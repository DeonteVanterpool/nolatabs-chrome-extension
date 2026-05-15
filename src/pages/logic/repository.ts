import {Repository} from "../models/repository";

export function getRepositoryByNameAndOwner(repos: Repository[], name: string, owner: string): Repository {
    let repo = repos.find((r) => r.name === name && r.owner === owner);
    if (!repo) {
        throw new Error(`Repository ${owner}/${name} not found`);
    }
    return repo;
}

export function getBranchByName(repo: Repository, branchName: string) {
    let branch = repo.branches.find((b) => b.name === branchName);
    if (!branch) {
        throw new Error(`Branch ${branchName} not found in repo ${repo.name}`);
    }
    return branch;
}

function hasBranch(repo: Repository, branchName: string): boolean {
    return repo.branches.some((b) => b.name === branchName);
}

export function addBranch(repo: Repository, branchName: string, commitHash: string): Repository {
    if (hasBranch(repo, branchName)) {
        throw new Error(`Branch ${branchName} already exists in repo ${repo.name}`);
    }

    return {
        ...repo,
        branches: [...repo.branches, {name: branchName, commit: commitHash}],
    };
}

export function removeBranch(repo: Repository, branchName: string): Repository {
    if (!hasBranch(repo, branchName)) {
        throw new Error(`Branch ${branchName} not found in repo ${repo.name}`);
    }
    
    return {
        ...repo,
        branches: repo.branches.filter((b) => b.name !== branchName),
    };
}

export function updateBranchPointer(repo: Repository, branchName: string, newCommitHash: string): Repository {
    if (!hasBranch(repo, branchName)) {
        throw new Error(`Branch ${branchName} not found in repo ${repo.name}`);
    }
    
    return {
        ...repo,
        branches: repo.branches.map((b) => 
            b.name === branchName ? { ...b, commit: newCommitHash } : b
        ),
    };
}

export function renameRepository(repo: Repository, newName: string): Repository {
    return {
        ...repo,
        name: newName,
    }
}
