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

function commitBelongsToBranch(commitHash: string, branchTipHash: string, commitReader: CommitGraph): boolean {
    let currentCommitHash = branchTipHash;
    while (currentCommitHash) {
        if (currentCommitHash === commitHash) {
            return true;
        }
        let currentCommit = commitReader(currentCommitHash);
        if (!currentCommit) {
            throw new Error(`Commit ${currentCommitHash} not found`);
        }
        if (currentCommit.parents.length === 0) {
            break; // reached the root commit
        }
        currentCommitHash = currentCommit.parents[0]; // follow the first parent
    }
    return false;
}

// Assigns each commit to the single branch that "owns" it, based on
// structural distance (hops along first-parent history) from each branch's
// own tip — not on which branch is currently being viewed. This guarantees
// the same underlying commit graph renders identically no matter whose tip
// you pass in as `tip`; only cosmetic ordering (declaration order / colors)
// should ever depend on currentTipBranch, never actual topology.
function computeLaneOwners(
    commitReader: CommitGraph,
    branchTips: Map<string, string>,
    currentTipBranch: string
): Map<string, string> {
    const best = new Map<string, { branch: string; dist: number }>();

    for (const [branchName, tipHash] of branchTips) {
        let cur: string | undefined = tipHash;
        let dist = 0;
        const seen = new Set<string>();
        while (cur && !seen.has(cur)) {
            seen.add(cur);

            const existing = best.get(cur);
            const isCloser = !existing || dist < existing.dist;
            // Only a true tie (identical distance — i.e. two branches
            // literally pointing at the same commit) falls back to the
            // cosmetic currentTipBranch preference. This never happens for
            // ordinary ancestor/descendant relationships.
            const isTieBreak =
                existing &&
                dist === existing.dist &&
                branchName === currentTipBranch &&
                existing.branch !== currentTipBranch;

            if (isCloser || isTieBreak) {
                best.set(cur, { branch: branchName, dist });
            }

            const c = commitReader(cur);
            if (!c || c.parents.length === 0) break;
            cur = c.parents[0];
            dist++;
        }
    }

    const owner = new Map<string, string>();
    for (const [hash, { branch }] of best) owner.set(hash, branch);
    return owner;
}

export function renderMermaid(
    commitReader: CommitGraph,
    tip: string,
    branchTips: Map<string, string>
): string {
    const currentTipBranch =
        Array.from(branchTips.entries()).find(([, t]) => t === tip)?.[0] ?? "main";

    const laneOwner = computeLaneOwners(commitReader, branchTips, currentTipBranch);

    // The branch that owns the very first (parentless) commit is Mermaid's
    // implicit initial branch. We tell Mermaid its real name via the init
    // directive instead of assuming it's literally called "main" — that
    // assumption breaks the moment a repo's default branch has any other name.
    let rootBranchName = currentTipBranch;
    for (const [hash, branch] of laneOwner) {
        const c = commitReader(hash);
        if (c && c.parents.length === 0) {
            rootBranchName = branch;
            break;
        }
    }

    const lines: string[] = [
        `%%{init: {'gitGraph': {'mainBranchName': '${rootBranchName}'}}}%%`,
        "gitGraph BT:",
    ];

    const esc = (s: string) => s.replace(/"/g, '\\"');
    const tagFor = (hash: string) => {
        const c = commitReader(hash);
        const msg = String(c?.message ?? "").split("\n")[0].trim();
        return msg ? ` tag: "${esc(msg)}"` : "";
    };

    const declaredBranches = new Set<string>([rootBranchName]);
    let currentBranch = rootBranchName;

    const liveHead = new Map<string, string>();
    liveHead.set(rootBranchName, "__root__");

    const hasRealCommit = (branch: string) => {
        const h = liveHead.get(branch);
        return !!h && h !== "__root__";
    };

    const ensureBranch = (branch: string) => {
        if (branch === rootBranchName) return;
        if (!declaredBranches.has(branch)) {
            lines.push(`branch ${branch}`);
            declaredBranches.add(branch);
            liveHead.set(branch, liveHead.get(currentBranch) ?? "__root__");
        }
    };

    const checkoutIfNeeded = (branch: string) => {
        ensureBranch(branch);
        if (currentBranch !== branch) {
            lines.push(`checkout ${branch}`);
            currentBranch = branch;
        }
    };

    const emittedNodes = new Set<string>();
    const visited = new Set<string>();

    const emitCommit = (hash: string) => {
        if (emittedNodes.has(hash)) return;
        const id = bytesToHex(hash);
        lines.push(`commit id: "${id}"${tagFor(hash)}`);
        emittedNodes.add(hash);
        liveHead.set(currentBranch, id);
    };

    // Commits only reachable through a merge's second parent, whose own
    // branch tip isn't in `branchTips` (e.g. the branch was deleted after
    // merging), never get an owner from computeLaneOwners. Give them a
    // synthetic lane instead of mis-attributing them to whatever branch is
    // currently checked out, or silently dropping the merge.
    let orphanCounter = 0;
    const resolveOwner = (hash: string): string => {
        const existing = laneOwner.get(hash);
        if (existing) return existing;

        const syntheticName = `deleted-branch-${++orphanCounter}`;
        let cur: string | undefined = hash;
        while (cur && !laneOwner.has(cur)) {
            laneOwner.set(cur, syntheticName);
            const c = commitReader(cur);
            if (!c || c.parents.length === 0) break;
            cur = c.parents[0];
        }
        return syntheticName;
    };

    const walk = (hash: string | undefined) => {
        if (!hash || visited.has(hash)) return;
        visited.add(hash);

        const commit = commitReader(hash);
        if (!commit) return;

        const destinationBranch = resolveOwner(hash);
        checkoutIfNeeded(destinationBranch);

        if (commit.parents.length > 0) {
            walk(commit.parents[0]);
        }

        const isMergeCommit = commit.parents.length > 1;

        if (!isMergeCommit) {
            emitCommit(hash);
            return;
        }

        const parentHash = commit.parents[1];
        walk(parentHash);

        const sourceBranch = resolveOwner(parentHash);
        if (sourceBranch === destinationBranch) return;

        checkoutIfNeeded(destinationBranch);
        if (currentBranch !== destinationBranch) return;
        if (!hasRealCommit(sourceBranch)) return;

        const srcLive = liveHead.get(sourceBranch);
        const dstLive = liveHead.get(destinationBranch);
        if (srcLive && dstLive && srcLive === dstLive) return;

        const mergeId = bytesToHex(hash);
        lines.push(`merge ${sourceBranch} id: "${mergeId}"${tagFor(hash)}`);
        emittedNodes.add(hash);
        liveHead.set(destinationBranch, mergeId);
    };

    const orderedTips = Array.from(branchTips.entries()).sort(([a], [b]) => {
        if (a === currentTipBranch && b !== currentTipBranch) return -1;
        if (b === currentTipBranch && a !== currentTipBranch) return 1;
        return a.localeCompare(b);
    });

    for (const [, tipHash] of orderedTips) {
        walk(tipHash);
    }

    return lines.join("\n");
}

function bytesToHex(data: string): string {
    const bytes = encode(data);
    let out = "";
    for (let i = 0; i < bytes.length; i++) {
        out += bytes[i].toString(16).padStart(2, "0");
    }
    return out;
}
