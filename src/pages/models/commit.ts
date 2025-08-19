import { Tab } from './tab';

class Commit {
    hash: string;
    author: string;
    date: Date;
    message: string;
    diffs: string;

    constructor(
        hash: string,
        author: string,
        date: Date,
        message: string,
        diffs: string,
    ) {
        this.hash = hash;
        this.author = author;
        this.date = date;
        this.message = message;
        this.diffs = diffs;
    }
}

type Delta = Addition | Deletion;

class CommitDiff {
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
        let n: number = a.length;
        let m: number = b.length;
        let max: number = n + m;

        let dp: number[] = new Array(2 * max + 1);
        dp[1] = 0;
        for (let i: number = 0; i < max; i += 2) {
            for (let j: number = -i; j < i; j += 2) {

            }
        }
        return new CommitDiff(original, [1, 2]);
    }
}

class Addition {
    tab: Tab;
    index: number;
    constructor(
        tab: Tab,
        index: number,
    ) {
        this.tab = tab;
        this.index = index;
    }
}

class Deletion {
    index: number;
    constructor(
        index: number,
    ) {
        this.index = index;
    }
}

class Snapshot {
    commit: Commit;
    tabs: Tab[];
    constructor(
        commit: Commit,
        tabs: Tab[],
    ) {
        this.commit = commit;
        this.tabs = tabs;
    }

    static fromCommits(
        commit: [Commit],
    ): Snapshot {
        const tabs: Tab[] = [];
        commit.forEach((c) => {
            
        });
        return new Snapshot(commit[0], tabs);
    }
}

