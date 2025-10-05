import {Tab} from './tab';

export type Commit = {
    readonly hash: string;
    readonly author: string;
    readonly timestamp: Date;
    readonly message: string;
    readonly diff: CommitDiff;
    readonly parents: string[]; // hash of parent commit, empty if no parent (initial commit)
}

export type CommitDiff = {
    // deltas
    readonly additions: Addition[];
    readonly deletions: Deletion[];
}

export type Addition = {
    readonly tab: Tab;
    readonly after: number;
}

export type Deletion = {
    readonly index: number;
}

export type Delta = Addition | Deletion;

export type Snapshot  = {
    readonly commit: string; // string storing hash of commit
    readonly tabs: Tab[];
}

