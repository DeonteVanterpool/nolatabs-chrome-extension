import {Tab} from './tab';

export class Commit {
    hash: string;
    author: string;
    timestamp: Date;
    message: string;
    diff: CommitDiff;
    parents: string[]; // hash of parent commit, empty if no parent (initial commit)

    constructor(
        hash: string,
        author: string,
        timestamp: Date,
        message: string,
        diff: CommitDiff,
        parents: string[]
    ) {
        this.hash = hash;
        this.author = author;
        this.timestamp = timestamp;
        this.message = message;
        this.diff = diff;
        this.parents = parents;
    }
}

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

export type Delta = Addition | Deletion;

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
}

