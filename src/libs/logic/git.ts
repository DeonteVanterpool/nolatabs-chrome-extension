import {Addition, Commit, Diff, Deletion, Delta, Branch, Tab, Repository} from "src/models/git";
import {encode} from "../handlers/cryptography";

type SnapshotReader = (commitHash: string) => Tab[];
type CommitGraph = (commitHash: string) => Commit;

export function defaultCommitGraph(commits: Commit[]): CommitGraph {
    let graph: Map<string, Commit> = new Map();
    commits.forEach((c) => graph.set(c.hash, c));
    return (commitHash: string) => {
        let commit = graph.get(commitHash);
        if (!commit) {
            throw new Error(`Commit ${commitHash} not found`);
        }
        return commit;
    }
}

export function createCommit(hash: string, author: string, timestamp: Date, message: string, difference: Diff, parents: string[]): Commit {

    let commit = {hash, author, timestamp, message, diff: difference, parents};

    return commit;
}

export function calculateDifference(
    parents: string[],
    currentTabs: Tab[],
    getSnapshot: SnapshotReader
): Diff {
    if (parents.length === 1) { // normal commit
        try {
            const parentSnapshot = getSnapshot(parents[0]);
            return diff(parentSnapshot, currentTabs);
        } catch (e) {
            throw new Error(`Failed to calculate diff: Parent commit ${parents[0]} not found`);
        }
    } else if (parents.length === 0) { // initial commit
        return {additions: currentTabs.map((tab) => ({tab, after: -1})), deletions: []};
    } else { // merge commit
        return {additions: [], deletions: []}; // no evil merges! (i.e. we won't calculate a diff for merge commits, since they don't represent any new changes to the tabs themselves, just a merging of branches)
    }
}

export function buildSnapshot(commitReader: CommitGraph, head: string): Tab[] {
    return getSnapshot(commitReader, head);
}

export class CommitHashInput {
    author: string;
    message: string;
    timestamp: Date;
    tabs: Tab[];
    parentHashes: string[];

    constructor(
        author: string,
        message: string,
        timestamp: Date,
        tabs: Tab[],
        parentHashes: string[],
    ) {
        this.author = author;
        this.message = message;
        this.timestamp = timestamp;
        this.tabs = tabs;
        this.parentHashes = parentHashes;
    }

    // converts tabs into something that can be used by the hashing algo
    private tabsToTree(tabs: Tab[]): string[] {
        return tabs.map((t) => {
            return "url " + t.url + "pinned " + t.pinned;
        });
    }

    stringify(): string {
        return "author " + this.author + "\nmessage " + this.message + "\ntimestamp " + this.timestamp.getTime() + "\ntabs " + this.tabsToTree(this.tabs) + "\nparents " + this.parentHashes.slice().sort().join(" ");
    }

    encode(): Uint8Array {
        return new TextEncoder().encode(this.stringify());
    }
}


function getSnapshot(graph: CommitGraph, head: string): Tab[] {
    let c = graph(head);
    if (!c) {
        throw new Error(`Commit ${head} not found`);
    }
    if (c.parents.length === 0) {
        return apply([], c.diff);
    } else if (c.parents.length === 1) {
        let parentCommit = graph(c.parents[0]);
        if (parentCommit) {
            let parentSnapshot = getSnapshot(graph, c.parents[0]);
            return apply(parentSnapshot, c.diff);
        } else {
            throw new Error(`Parent commit ${c.parents[0]} not found`);
        }
    } else { // merge commit (no evil merges!)
        let commonAncestorHash = getCommonAncestor(graph, c.parents);
        let diff = aggregateDiffs(graph, c.parents);
        let snapshot = getSnapshot(graph, commonAncestorHash!);
        return apply(snapshot, diff);
    }
}

function getCommonAncestor(graph: CommitGraph, commits: string[]): string | undefined {
    if (commits.length === 1) {
        return commits[0];
    }
    let v1: Set<string> = new Set();
    v1.add(commits[0]);
    let v2: Set<string> = new Set();
    v2.add(commits[1]);
    let q1: string[] = [commits[0]]; // we should switch to a proper Dequeue here if performance becomes a problem
    let q2: string[] = [commits[1]];
    // bfs
    while (q1.length !== 0 && q2.length !== 0) {
        let c1 = graph(q1.shift() as string)!;
        let c2 = graph(q2.shift() as string)!;

        for (const p of c1.parents) {
            if (v2.has(p)) {
                commits = commits.slice(2);
                commits.push(p);
                return getCommonAncestor(graph, commits);
            }
            // this is a Direct Acyclic Graph (DAG). No need to check for cycles
            v1.add(p);
            q1.push(p);
        }

        for (const p of c2.parents) {
            if (v1.has(p)) {
                commits = commits.slice(2);
                commits.push(p);
                return getCommonAncestor(graph, commits)
            }
            v2.add(p);
            q2.push(p);
        }
    }
    let q: string[] = [];
    let v: Set<string>;
    if (q1.length !== 0) {
        q = q1;
        v = v2;
    } else if (q2.length !== 0) {
        q = q2
        v = v1;
    } else {
        throw new Error("both q1 and q2 still have elements");
    }
    while (q.length !== 0) {
        let c = graph(q.shift() as string) as Commit;

        for (const p of c.parents) {
            if (v.has(p)) {
                commits = commits.slice(2);
                commits.push(p);
                return getCommonAncestor(graph, commits);
            }
            q.push(p);
        }
    }
    return undefined;
}

/** 
 * Aggregates changes from multiple parent commits into a single Diff.
 * This is done by finding the common ancestor of all parents and calculating
 * the diff from that ancestor to each parent, then combining those diffs.
 */
function aggregateDiffs(graph: CommitGraph, parents: string[]): Diff {
    let additions: Addition[] = [];
    let deletions: Deletion[] = [];
    let commonAncestorHash = getCommonAncestor(graph, parents)!;
    let snapshot = getSnapshot(graph, commonAncestorHash);
    for (let parentHash of parents.slice(1, parents.length)) {
        let parentSnapshot = getSnapshot(graph, parentHash);
        let deltaFromAncestorToParent = diff(snapshot, parentSnapshot);

        // concatentate all the changes
        additions = additions.concat(deltaFromAncestorToParent.additions);
        deletions = deletions.concat(deltaFromAncestorToParent.deletions);
    }
    return {additions, deletions};
}

export function apply(to: Tab[], diff: Diff): Tab[] {
    let tabs: Tab[] = [];

    let ptr1 = 0; // ptr to additions array
    let ptr2 = 0; // ptr to deletions array
    let ptr3 = 0; // ptr to to array
    while (ptr1 !== diff.additions.length || ptr2 !== diff.deletions.length || ptr3 !== to.length) {
        let x: number = Infinity;
        let y: number = Infinity;
        let z: number = Infinity;
        if (ptr1 < diff.additions.length) {
            x = diff.additions[ptr1].after;
        }
        if (ptr2 < diff.deletions.length) {
            y = diff.deletions[ptr2].index;
        }
        if (ptr3 < to.length) {
            z = ptr3;
        }
        let min = Math.min(x, y, z);
        if (min === y) { // deletion
            ptr3++; // skip tab in `to` array
            ptr2++;
        } else if (min === z) { // keep (should have priority over addition, since addition adds a tab *after* the current index in the `to` array)
            tabs.push(to[ptr3]);
            ptr3++;
        } else {
            tabs.push(diff.additions[ptr1].tab);
            ptr1++;
        }
    }
    return tabs;
}

export function diff(a: Tab[], b: Tab[]): Diff {
    // here, we will use the Myer's diff algorithm to compare the current state of tabs with the previous state
    // algorithm based on https://blog.jcoglan.com/2017/02/15/the-myers-diff-algorithm-part-1/

    let additions: Addition[] = [];
    let deletions: Deletion[] = [];
    let moves = shortest_edit(a, b);
    moves.forEach((move) => {
        if ("index" in move) { // deletion
            deletions.push(move);
        } else if ("tab" in move) { // addition
            additions.push(move);
        } else {
            throw new Error("invalid move" + move);
        }
    });
    return {additions, deletions};
}

function shortest_edit(a: Tab[], b: Tab[]): Delta[] {
    // this current implementation is based on the python code from https://gist.github.com/adamnew123456/37923cf53f51d6b9af32a539cdfa7cc4
    let n: number = a.length;
    let m: number = b.length;
    let max: number = n + m;

    let dp: number[] = new Array(2 * max + 1);
    dp[max + 1] = 0; // offset for dp array, since k can be negative
    let trace: Delta[][] = dp.map((_) => []);
    let last_match: number = -1;
    for (let d: number = 0; d <= max; d++) {
        for (let k: number = -d; k <= d; k += 2) {
            let idx = k + max; // offset for dp array, since k can be negative
            let l = idx - 1; // offset for dp array
            let r = idx + 1;
            let x, y, old_x, hist;
            let go_down = k === -d || (k !== d && dp[l] < dp[r]);
            if (go_down) {
                old_x = dp[r];
                hist = trace[r];
                x = old_x;
            } else {
                old_x = dp[l];
                x = old_x + 1;
                hist = trace[l];
            }

            hist = [...hist]; // copy
            y = x - k;

            if (1 <= y && y <= m && go_down) {
                hist.push({tab: b[y - 1], after: last_match}); // x - deletions, since we want to add after the last undeleted tab (just to keep things clean)
            } else if (1 <= x && x <= n) {
                hist.push({index: x - 1});
            } else { // keep
            }
            while (x < n && y < m && a[x].url === b[y].url) { // not at the end of either array and the urls match
                last_match = x; // update last match
                x++;
                y++; // move accross the diagonal
            }
            dp[idx] = x;
            trace[idx] = hist;
            if (x >= n && y >= m) { // at end of both arrays
                return hist;
            }
        }
    }
    return [];
}

export function getRepositoryByNameAndOwner(repos: Repository[], name: string, owner: string): Repository {
    let repo = repos.find((r) => r.name === name && r.ownerId === owner);
    if (!repo) {
        throw new Error(`Repository ${owner}/${name} not found`);
    }
    return repo;
}

export function renameRepository(repo: Repository, newName: string): Repository {
    return {
        ...repo,
        name: newName,
    }
}

export function createRepository(id: string, name: string, ownerId: string): Repository {
    return {
        id,
        name,
        ownerId,

    } satisfies Repository;
}

export function createBranch(id: string, name: string, repoId: string): Branch {
    return {
        id,
        name,
        repoId,
        tipHash: null,
    } satisfies Branch;
}
export function renderMermaid(commitReader: CommitGraph, heads: string[]): string {
    const uniqueHeads = Array.from(new Set(heads.filter((h) => h && h.trim() !== "")));

    if (uniqueHeads.length === 0) {
        return `gitGraph TB\ncommit id: "empty"`;
    }

    // Collect all reachable commits from ALL heads.
    const commitsByHash = new Map<string, Commit>();
    const stack: string[] = [...uniqueHeads];

    while (stack.length) {
        const h = stack.pop()!;
        if (commitsByHash.has(h)) continue;

        const c = commitReader(h);
        commitsByHash.set(h, c);
        for (const p of c.parents) stack.push(p);
    }

    // Build child adjacency for branch assignment.
    const children = new Map<string, string[]>(); // parentHash -> childHashes
    for (const [h] of commitsByHash.entries()) {
        const c = commitsByHash.get(h)!;
        for (const p of c.parents) {
            if (!children.has(p)) children.set(p, []);
            children.get(p)!.push(h);
        }
    }
    for (const [p, arr] of children.entries()) arr.sort(); // deterministic

    // Topological order of DAG (parents before child) within the collected subgraph.
    const indegree = new Map<string, number>();
    for (const h of commitsByHash.keys()) indegree.set(h, 0);
    for (const [h, c] of commitsByHash.entries()) {
        for (const _p of c.parents) {
            indegree.set(h, (indegree.get(h) ?? 0) + 1);
        }
    }

    const q: string[] = [];
    for (const [h, deg] of indegree.entries()) if (deg === 0) q.push(h);
    q.sort();

    const topo: string[] = [];
    while (q.length) {
        const cur = q.shift()!;
        topo.push(cur);
        for (const ch of children.get(cur) ?? []) {
            indegree.set(ch, (indegree.get(ch) ?? 0) - 1);
            if ((indegree.get(ch) ?? 0) === 0) {
                q.push(ch);
                q.sort();
            }
        }
    }

    // Branch assignment:
    const mainBranchName = "main";
    let branchCounter = 0;

    const branchOfCommit = new Map<string, string>(); // hash -> mermaid branch name
    const childrenSorted = (arr: string[]) => arr.slice().sort();

    // Find a root-ish commit to act as main start.
    const rootCandidates = topo.filter((h) => (commitsByHash.get(h)!.parents.length === 0));
    const rootForMain = rootCandidates.length ? rootCandidates.sort()[0] : uniqueHeads[0];

    branchOfCommit.set(rootForMain, mainBranchName);

    for (const h of topo) {
        const curBranch = branchOfCommit.get(h);
        if (!curBranch) continue;

        const cs = childrenSorted(children.get(h) ?? []);
        if (!cs.length) continue;

        // First child continues on the same branch.
        branchOfCommit.set(cs[0], curBranch);

        // Remaining children become new branches.
        for (let i = 1; i < cs.length; i++) {
            branchOfCommit.set(cs[i], `b${branchCounter++}`);
        }
    }

    const escapeMermaidString = (s: string) =>
        s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");

    const lines: string[] = [];
    lines.push(`gitGraph BT:`);

    let currentBranch = mainBranchName;
    const emitted = new Set<string>();

    for (const h of topo) {
        const c = commitsByHash.get(h)!;

        // Wait until all parents are emitted (helps with merge syntax ordering).
        let ready = true;
        for (const p of c.parents) {
            if (!emitted.has(p)) {
                ready = false;
                break;
            }
        }
        if (!ready) continue;

        const myBranch = branchOfCommit.get(h) ?? mainBranchName;

        if (c.parents.length > 1) {
            const [targetParent, ...otherParents] = c.parents;
            const targetBranch = branchOfCommit.get(targetParent) ?? mainBranchName;

            if (targetBranch !== currentBranch) {
                lines.push(`checkout ${targetBranch}`);
                currentBranch = targetBranch;
            }

            for (const op of otherParents) {
                const sourceBranch = branchOfCommit.get(op) ?? mainBranchName;
                if (sourceBranch !== targetBranch) {
                    lines.push(`merge ${sourceBranch}`);
                }
            }

            // Merge commit with message label
            const label = escapeMermaidString(c.message);
            lines.push(`commit id: "${bytesToHex(encode(h))}" tag: "${label}"`);
            emitted.add(h);
            continue;
        }

        if (c.parents.length === 0) {
            if (currentBranch !== mainBranchName) {
                lines.push(`checkout ${mainBranchName}`);
                currentBranch = mainBranchName;
            }
            const label = escapeMermaidString(c.message);
            lines.push(`commit id: "${bytesToHex(encode(h))}" tag: "${label}"`);
            emitted.add(h);
            continue;
        }

        // Normal commit
        const parent = c.parents[0];
        const parentBranch = branchOfCommit.get(parent) ?? mainBranchName;

        if (myBranch !== parentBranch) {
            lines.push(`checkout ${myBranch}`);
            currentBranch = myBranch;
        } else if (currentBranch !== myBranch) {
            lines.push(`checkout ${myBranch}`);
            currentBranch = myBranch;
        }

        const label = escapeMermaidString(c.message);
        lines.push(`commit id: "${bytesToHex(encode(h))}" tag: "${label}"`);
        emitted.add(h);
    }

    return lines.join("\n");
}

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < Math.min(bytes.length, Math.ceil(bytes.length / 2)); i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}
