import {Branch, Repository} from "../models/repository";
import {RepositoryStore} from "../repository/repository";

export class RepositoryService {
    public static getRepository(reponame: string, owner: string): (storage: chrome.storage.StorageArea) => Promise<Repository> {
        let execute = async (storage: chrome.storage.StorageArea) => {
            let repos = await RepositoryStore.read(storage);
            let repo = repos.find((r) => r.name === reponame && r.owner === owner);
            if (!repo) {
                throw new Error(`Repository ${owner}/${reponame} not found`);
            }
            return repo;
        }
        return execute;
    }
    public static async getBranch(repo: Repository, branchName: string): Promise<Branch> {
        let branch = repo.branches.find((b) => b.name === branchName);
        if (!branch) {
            throw new Error(`Branch ${branchName} not found in repo ${repo.name}`);
        }
        return branch;
    }

    public static createBranch(repo: Repository, branchName: string, commitHash: string): (storage: chrome.storage.StorageArea) => Promise<void> {
        if (repo.branches.find((b) => b.name === branchName)) {
            throw new Error(`Branch ${branchName} already exists in repo ${repo.name}`);
        }
        repo.branches.push({name: branchName, commit: commitHash});

        return async (storage: chrome.storage.StorageArea) => {
            let repos = await RepositoryStore.read(storage);
            let repoIndex = repos.findIndex((r) => r.name === repo.name && r.owner === repo.owner);
            if (repoIndex === -1) {
                throw new Error(`Repository ${repo.owner}/${repo.name} not found`);
            }
            repos[repoIndex] = repo;
            await RepositoryStore.update(storage, repo);
        }
    }

    public static deleteBranch(repo: Repository, branchName: string): (storage: chrome.storage.StorageArea) => Promise<void> {
        let branchIndex = repo.branches.findIndex((b) => b.name === branchName);
        if (branchIndex === -1) {
            throw new Error(`Branch ${branchName} not found in repo ${repo.name}`);
        }
        repo.branches.splice(branchIndex, 1);
        
        return async (storage: chrome.storage.StorageArea) => {
            let repos = await RepositoryStore.read(storage);
            let repoIndex = repos.findIndex((r) => r.name === repo.name && r.owner === repo.owner);
            if (repoIndex === -1) {
                throw new Error(`Repository ${repo.owner}/${repo.name} not found`);
            }
            repos[repoIndex] = repo;
            await RepositoryStore.update(storage, repo);
        }
    }

    public static async updateBranchPointer(repo: Repository, branchName: string, newCommitHash: string) {
        let del = RepositoryService.deleteBranch(repo, branchName);
        let create = RepositoryService.createBranch(repo, branchName, newCommitHash);
        let execute = async (storage: chrome.storage.StorageArea) => {
            await del(chrome.storage.local).then(() => create(chrome.storage.local));
        }
        return execute;
    }
}
