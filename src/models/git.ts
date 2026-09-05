export type Commit = {
    readonly hash: string;
    readonly author: string;
    readonly timestamp: Date;
    readonly message: string;
    readonly diff: Diff;
    readonly parents: string[]; // hash of parent commit, empty if no parent (initial commit)
    readonly branch: string;
}

export type Diff = {
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

export type Tab = {
    readonly url: string;
    readonly title: string;
    readonly favicon: string;
    readonly pinned: boolean;
}

export type Repository = {
    // this uuid needs to be generated
    readonly id: string;
    readonly name: string;
    readonly ownerId: string;
}

export type Branch = {
    readonly id: string;
    readonly name: string;
    readonly repoId: string; // id of the repo the branch belongs to
    readonly tipHash: string | null; // hash of the commit the branch is pointing to
}

