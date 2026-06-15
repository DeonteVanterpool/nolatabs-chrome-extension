import {Repository} from "src/models/repository";

export function getRepositoryByNameAndOwner(repos: Repository[], name: string, owner: string): Repository {
    let repo = repos.find((r) => r.name === name && r.ownerId === owner);
    if (!repo) {
        throw new Error(`Repository ${owner}/${name} not found`);
    }
    return repo;
}

export function renameRepository(repo: Repository, newName: string): Repository {
    return {
        ...repo,
        name: newName,
    }
}

export function createRepository(id: string, name: string, ownerId: string): Repository {
    return {
        id,
        name,
        ownerId,

    } satisfies Repository;

}
