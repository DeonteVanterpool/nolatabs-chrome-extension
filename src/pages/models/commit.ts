import { Tab } from './tab';

class Commit {
    constructor(
        public readonly hash: string,
        public readonly author: string,
        public readonly date: Date,
        public readonly message: string,
        public readonly diffs: string,
    ) {}
}

class CommitDiff {
    constructor(
        private readonly added: Tab[],
        private readonly removed: number[], // Assuming these are ids of removed tabs
    ) {}

    public static fromCommit(original: Tab[], updated: Tab[]): CommitDiff {
        // here, we will use the Myer's diff algorithm to compare the current state of tabs with the previous state
        
        return new CommitDiff(original, [1, 2]);
    }
}

class Snapshot {
    constructor(
        public Commit: Commit,
        public readonly tabs: Tab[],
    ) {}

    static fromCommits(
        commit: [Commit],
    ): Snapshot {
        const tabs: Tab[] = [];
        commit.forEach((c) => {
            
        });
        return new Snapshot(commit[0], tabs);
    }
}

