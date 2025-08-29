import {Tab} from './tab';

let commits = new Map<string, Commit>();

export class Commit {
    hash: string;
    author: string;
    timestamp: Date;
    message: string;
    deltas: CommitDiff;
    base: string | null = null; // hash of parent commit, null if no parent (initial commit)
    children: string[]; // hashes of child commits

    constructor(
        author: string,
        date: Date,
        message: string,
        tabs: Tab[],
        base: Commit | null,
    ) {
        this.hash = crypto.createHash('sha1');
        this.author = author;
        this.timestamp = date;
        this.message = message;
        this.base = base ? base.hash : null; // if no base, this is the initial commit
        this.deltas = base ? CommitDiff.diff(base.getSnapshot(), tabs) : new CommitDiff(tabs.map((tab) => {
            return new Addition(tab, -1);
        }), []);
        this.children = [];
        if (base) {
            base.children.push(this.hash);
        }
    }

    public getSnapshot(): Tab[] {
        if (this.base) {
            let parentCommit = Commit.get(this.base);
            if (parentCommit) {
                let parentSnapshot = parentCommit.getSnapshot();
                return this.deltas.apply(parentSnapshot);
            } else {
                throw new Error(`Parent commit ${this.base} not found`);
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

