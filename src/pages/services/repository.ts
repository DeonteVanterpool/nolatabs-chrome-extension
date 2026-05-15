import {addBranch, deleteBranch, getBranchByName, getRepositoryByNameAndOwner} from "../logic/repository";
import {Branch, Repository} from "../models/repository";
import {CommitStore} from "../repository/commit";
import {RepositoryStore} from "../repository/repository";

export class RepositoryService {
    public static async getRepository(storage: chrome.storage.StorageArea, reponame: string, owner: string): Promise<Repository> {
        let repos = await RepositoryStore.read(storage);
        return getRepositoryByNameAndOwner(repos, reponame, owner);
    }
    public static async getBranch(repo: Repository, branchName: string): Promise<Branch> {
        return getBranchByName(repo, branchName);
    }

    public static async createBranch(storage: chrome.storage.StorageArea, repo: Repository, branchName: string, commitHash: string): Promise<void> {
        let res = addBranch(repo, branchName, commitHash);
        await RepositoryStore.update(storage, res);
    }

    public static deleteBranch(storage: chrome.storage.StorageArea, repo: Repository, branchName: string): (storage: chrome.storage.StorageArea) => Promise<void> {
        let repos = await RepositoryStore.read(storage);
        repos = deleteBranch(repo, branchName);

        return async (storage: chrome.storage.StorageArea) => {
            repos[repoIndex] = repo;
            await RepositoryStore.update(storage, repo);
        }
    }

    public static async updateBranchPointer(repo: Repository, branchName: string, newCommitHash: string) {
        let del = RepositoryService.deleteBranch(repo, branchName);
        let create = RepositoryService.createBranch(repo, branchName, newCommitHash);
        let execute = async (storage: chrome.storage.StorageArea) => {
            await del(storage).then(() => create(storage));
        }
        return execute;
    }

    public static moveRepository(repo: Repository, newName: string): (storage: chrome.storage.StorageArea) => Promise<void> {
        return async (storage: chrome.storage.StorageArea) => {
            let repos = await RepositoryStore.read(storage);
            let repoIndex = repos.findIndex((r) => r.name === repo.name && r.owner === repo.owner);
            let commits = await CommitStore.read(chrome.storage.local, repo);

            await CommitStore.set(chrome.storage.local, {name: newName, owner: repo.owner}, commits);
            let newRepo = {...repo, name: newName};
            repos[repoIndex] = newRepo;
            await RepositoryStore.update(chrome.storage.local, newRepo);
            await CommitStore.delete(chrome.storage.local, repo);
        };
    }
}
