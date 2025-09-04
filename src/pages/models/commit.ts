import {Tab} from './tab';

export let commits = new Map<string, Commit>();

export class Commit {
    hash: string;
    author: string;
    timestamp: Date;
    message: string;
    deltas: CommitDiff;
    parents: string[]; // hash of parent commit, null if no parent (initial commit)

    constructor(
        hash: string,
        author: string,
        timestamp: Date,
        message: string,
        tabs: Tab[],
        parents: string[]
    ) {
        this.hash = hash;
        commits.set(this.hash, this);
        this.parents = parents;
        this.author = author;
        this.timestamp = timestamp;
        this.message = message;
        if (this.parents.length === 1) {
            let parentCommit = Commit.get(this.parents[0]);
            if (parentCommit) {
                let parentSnapshot = parentCommit.getSnapshot();
                this.deltas = CommitDiff.diff(parentSnapshot, tabs);
            } else {
                throw new Error(`Parent commit ${commits.get(this.parents[0])?.message} not found`);
            }
        } else if (this.parents.length === 0) {
            this.deltas = new CommitDiff(tabs.map((tab, index) => new Addition(tab, -1)), []);
        } else {
            // merge commit
            let additions: Addition[] = [];
            let deletions: Deletion[] = [];
            let currHash = this.parents[0];
            for (let parentHash of this.parents.slice(1, this.parents.length)) {
                let currCommit = Commit.get(currHash);
                let parentCommit = Commit.get(parentHash);
                let commonAncestorHash = Commit.getCommonAncestor(currCommit!, parentCommit!);
                if (!commonAncestorHash) {
                    throw new Error(`No common ancestor found between commits ${currCommit!.message} and ${parentCommit!.message}`); // should never happen in a properly formed DAG
                }
                let commonAncestorCommit = Commit.get(commonAncestorHash);
                if (!commonAncestorCommit) {
                    throw new Error(`Common ancestor commit ${commonAncestorHash} not found`);
                }
                let ancestorSnapshot = commonAncestorCommit.getSnapshot();
                let parentSnapshot = parentCommit!.getSnapshot();
                let deltaFromAncestorToParent = CommitDiff.diff(ancestorSnapshot, parentSnapshot);
                
                // concatentate all the changes
                additions = additions.concat(deltaFromAncestorToParent.additions);
                deletions = deletions.concat(deltaFromAncestorToParent.deletions);
            }
            this.deltas = new CommitDiff(additions, deletions);
        }
    }

    public static async init(
        author: string,
        timestamp: Date,
        message: string,
        tabs: Tab[],
        parents: Commit[]
    ): Promise<Commit> {
        let parentHashes = parents.map((c) => c.hash);
        let buffer = new TextEncoder().encode(author + timestamp + tabs + parents.reduce((accum, commit) => accum + commit.hash, ""));
        let hash = new TextDecoder().decode(await crypto.subtle.digest("SHA-1", buffer));
        return new Commit(hash, author, timestamp, message, tabs, parentHashes);
    }

    // Returns the lowest common ancestor between two commits. If there is none, this method returns undefined
    public static getCommonAncestor(a: Commit, b: Commit): string | undefined {
        let v1: Set<string> = new Set();
        let v2: Set<string> = new Set();
        let q1: string[] = [a.hash]; // we should switch to a proper Dequeue here if performance becomes a problem
        let q2: string[] = [b.hash];
        // bfs
        while (q1.length !== 0 && q2.length !== 0) {
            let c1 = commits.get(q1.shift() as string) as Commit;
            let c2 = commits.get(q2.shift() as string) as Commit;

            for (const p of c1.parents) {
                if (v2.has(p)) {
                    return p;
                }
                // this is a Direct Acyclic Graph (DAG). No need to check for cycles
                v1.add(p);
                q1.push(p);
            }

            for (const p of c2.parents) {
                if (v1.has(p)) {
                    return p;
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
            let c = commits.get(q.shift() as string) as Commit;

            for (const p of c.parents) {
                if (v.has(p)) {
                    return p;
                }
                q.push(p);
            }
        }
        return undefined;
    }

    public getSnapshot(): Tab[] {
        if (this.parents.length === 1) {
            let parentCommit = Commit.get(this.parents[0]);
            if (parentCommit) {
                let parentSnapshot = parentCommit.getSnapshot();
                return this.deltas.apply(parentSnapshot);
            } else {
                throw new Error(`Parent commit ${this.parents[0]} not found`);
            }
        } else {
            return this.deltas.apply([]);
        }
    }

    public static get(hash: string): Commit | null {
        if (commits.has(hash)) {
            return commits.get(hash)!;
        }
        return null;
    }
}

export type Delta = Addition | Deletion;

export class CommitDiff {
    // deltas
    additions: Addition[];
    deletions: Deletion[];
    constructor(
        additions: Addition[],
        deletions: Deletion[], // Assuming these are ids of removed tabs
    ) {
        this.additions = additions;
        this.deletions = deletions;
    }

    public static diff(a: Tab[], b: Tab[]): CommitDiff {
        // here, we will use the Myer's diff algorithm to compare the current state of tabs with the previous state
        // algorithm based on https://blog.jcoglan.com/2017/02/15/the-myers-diff-algorithm-part-1/

        let additions: Addition[] = [];
        let deletions: Deletion[] = [];
        let moves = this.shortest_edit(a, b);
        moves.forEach((move) => {
            if (move instanceof Deletion) {
                deletions.push(move);
            } else if (move instanceof Addition) {
                additions.push(move);
            }
        });
        return new CommitDiff(additions, deletions);
    }

    public apply(to: Tab[]): Tab[] {
        let tabs: Tab[] = [];

        let ptr1 = 0; // ptr to additions array
        let ptr2 = 0; // ptr to deletions array
        let ptr3 = 0; // ptr to to array
        while (ptr1 !== this.additions.length || ptr2 !== this.deletions.length || ptr3 !== to.length) {
            let x: number = Infinity;
            let y: number = Infinity;
            let z: number = Infinity;
            if (ptr1 < this.additions.length) {
                x = this.additions[ptr1].after;
            }
            if (ptr2 < this.deletions.length) {
                y = this.deletions[ptr2].index;
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
                tabs.push(this.additions[ptr1].tab);
                ptr1++;
            }
        }

        return tabs;
    }

    private static shortest_edit(a: Tab[], b: Tab[]): Delta[] {
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
                    hist.push(new Addition(b[y - 1], last_match)); // x - deletions, since we want to add after the last undeleted tab (just to keep things clean)
                } else if (1 <= x && x <= n) {
                    hist.push(new Deletion(x - 1));
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
}

export class Addition {
    tab: Tab;
    after: number;
    constructor(
        tab: Tab,
        index: number,
    ) {
        this.tab = tab;
        this.after = index;
    }
}

export class Deletion {
    index: number;
    constructor(
        index: number,
    ) {
        this.index = index;
    }
}

export class Snapshot {
    commit: string; // string storing hash of commit
    tabs: Tab[];
    constructor(
        head: Commit,
        tabs: Tab[],
    ) {
        this.commit = head.hash;
        this.tabs = tabs;
    }

    static fromCommits(
        commits: Commit[],
    ): Snapshot {
        let tabs = commits[0].deltas.apply([]);
        commits.forEach((commit) => {
            tabs = commit.deltas.apply(tabs);
        })
        return new Snapshot(commits[0], tabs);
    }
}

