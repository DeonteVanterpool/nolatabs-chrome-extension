export type Repository = {
    // this uuid needs to be generated
    readonly id: string;
    readonly name: string;
    readonly owner: string;
    readonly branches: Branch[];
}

export type Branch = {
    readonly name: string;
    readonly commit: string; // hash of the commit the branch is pointing to
}

