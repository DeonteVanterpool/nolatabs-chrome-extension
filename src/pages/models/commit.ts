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

class CommitDiff {
    added: Tab[];
    removed: Tab[];
    constructor(
        added: Tab[],
        removed: number[], // Assuming these are ids of removed tabs
    ) {
        this.added = added;
        this.removed = removed;
    }

    public static myersDiff(original: Tab[], updated: Tab[]): CommitDiff {
        // here, we will use the Myer's diff algorithm to compare the current state of tabs with the previous state
        
        return new CommitDiff(original, [1, 2]);
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

