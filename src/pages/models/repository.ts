export type Repository = {
    readonly name: string;
    readonly owner: string;
    readonly branches: Branch[];
}

export type Branch = {
    readonly name: string;
    readonly commit: string; // hash of the commit the branch is pointing to
}

