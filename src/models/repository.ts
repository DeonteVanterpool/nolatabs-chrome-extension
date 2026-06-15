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

