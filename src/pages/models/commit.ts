import {Tab} from './tab';

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

        let additions: Addition[] = [];
        let deletions: Deletion[] = [];
        let moves = this.shortest_edit(a, b);
        moves.forEach((move) => {
            if (move instanceof Deletion) {
                deletions.push(new Deletion(move.index));
            } else if (move instanceof Addition) {
                additions.push(new Addition(move, move.index));
            }
        });
        return new CommitDiff(additions, deletions);
    }

    private static shortest_edit(a: Tab[], b: Tab[]): Delta[] {
        // this current implementation is based on the python code from https://gist.github.com/adamnew123456/37923cf53f51d6b9af32a539cdfa7cc4
        let n: number = a.length;
        let m: number = b.length;
        let max: number = n + m;

        let dp: number[] = new Array(2 * max + 1).fill(0);
        dp[1] = 0;
        let trace: Delta[][] = dp.map((_) => []);
        for (let d: number = 0; d <= max; d++) {
            for (let k: number = -d; k <= d; k += 2) {
                let x, y, old_x, hist;
                let go_down = k === -d || (k !== d && dp[k - 1] < dp[k + 1]);
                if (go_down) {
                    old_x = dp[k + 1];
                    hist = trace[k + 1];
                    x = old_x;
                } else {
                    old_x = dp[k - 1];
                    x = dp[k - 1] + 1;
                    hist = trace[k - 1];
                }

                hist = [...hist]; // copy
                y = x - k;

                if (1 <= y && y <= m && go_down) {
                    hist.push(new Addition(b[y - 1], x-1));
                } else if (1 <= x && x <= n) {
                    hist.push(new Deletion(x - 1));
                }
                while (x < n && y < m && a[x].url === b[y].url) { // not at the end of either array and the urls match
                    x++;
                    y++;
                }
                dp[k] = x;
                if (x >= n && y >= m) { // at end of both arrays
                    return hist;
                } else {
                    dp[k] = x;
                    trace[k] = hist;
                }
            }
        }
        return [];
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

