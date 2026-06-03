import {Addition, Commit, CommitDiff, Deletion, Delta} from "../models/commit";
import {Tab} from "../models/tab";

export function createCommit(hash: string, author: string, timestamp: Date, message: string, tabs: Tab[], parents: string[], commits: Commit[]): {commit: Commit, allCommits: Commit[]} {
    let graph = new Map();
    commits.forEach((c) => graph.set(c.hash, c));
    let difference: CommitDiff;
    if (parents.length === 1) { // normal commit
        let parentCommit = graph.get(parents[0]);
        if (!parentCommit) {
            throw new Error(`Parent commit ${graph.get(parents[0])?.message} not found`);
        }
        let parentSnapshot = getSnapshot(graph, parentCommit.hash);
        difference = diff(parentSnapshot, tabs);
    } else if (parents.length === 0) { // initial commit
        difference = {additions: tabs.map((tab, _) => {return {tab: tab, after: -1}}), deletions: []}; // add all tabs, since there is no parent
    } else { // merge commit
        difference = {additions: [], deletions: []}; // NO evil merges!
    }

    let commit = {hash, author, timestamp, message, diff: difference, parents};

    return {commit: commit, allCommits: [...commits, commit]};
}

export function buildSnapshot(commits: Commit[], head: string): Tab[] {
    let graph: Map<string, Commit> = new Map();
    commits.forEach((c) => graph.set(c.hash, c));
    return getSnapshot(graph, head);
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


function getSnapshot(graph: Map<string, Commit>, head: string): Tab[] {
    let c = graph.get(head);
    if (!c) {
        throw new Error(`Commit ${head} not found`);
    }
    if (c.parents.length === 0) {
        return apply([], c.diff);
    } else if (c.parents.length === 1) {
        let parentCommit = graph.get(c.parents[0]);
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

function getCommonAncestor(graph: Map<string, Commit>, commits: string[]): string | undefined {
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
        let c1 = graph.get(q1.shift() as string)!;
        let c2 = graph.get(q2.shift() as string)!;

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
        let c = graph.get(q.shift() as string) as Commit;

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
 * Aggregates changes from multiple parent commits into a single CommitDiff.
 * This is done by finding the common ancestor of all parents and calculating
 * the diff from that ancestor to each parent, then combining those diffs.
 */
function aggregateDiffs(graph: Map<string, Commit>, parents: string[]): CommitDiff {
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

function apply(to: Tab[], diff: CommitDiff): Tab[] {
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

function diff(a: Tab[], b: Tab[]): CommitDiff {
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

