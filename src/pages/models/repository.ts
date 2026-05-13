export type Repository = {
    readonly name: string;
    readonly owner: string;
    readonly branches: Branch[];
}

// We only need the repository name and owner to store commits, so we can use a simplified repository address type here instead of the full Repository type from repository.ts
export type RepositoryAddress = {
    name: string;
    owner: string;
}


export type Branch = {
    readonly name: string;
    readonly commit: string; // hash of the commit the branch is pointing to
}

