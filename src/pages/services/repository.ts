import {BrowserWindow} from "../Background/window";
import {addBranch, getBranchByName, getRepositoryByNameAndOwner, removeBranch, renameRepository, updateBranchPointer} from "../logic/repository";
import {Branch, Repository, RepositoryAddress} from "../models/repository";
import {CommitStore} from "../repository/commit";
import {RepositoryStore} from "../repository/repository";
import {CommitService} from "./commit";

export class RepositoryService {
    static async getRepository(storage: chrome.storage.StorageArea, repo: RepositoryAddress): Promise<Repository> {
        let repos = await RepositoryStore.read(storage);
        return getRepositoryByNameAndOwner(repos, repo.name, repo.owner);
    }

    public static async openRepository(storage: chrome.storage.StorageArea, repoAddr: RepositoryAddress): Promise<Repository> {
        let repo = await RepositoryService.getRepository(storage, repoAddr);
        RepositoryService.openRepositoryInWindow(storage, repo);
        return repo;
    }

    public static async removeRepository(storage: chrome.storage.StorageArea, repoAddr: RepositoryAddress): Promise<Repository> {
        let repo = RepositoryService.getRepository(storage, repoAddr);
        await RepositoryStore.delete(chrome.storage.local, repoAddr);
        BrowserWindow.clearUnpinnedTabs();
        return repo;
    }

    public static async getBranch(storage: chrome.storage.StorageArea, repoAddr: RepositoryAddress, branchName: string): Promise<Branch> {
        let repo = await RepositoryService.getRepository(storage, repoAddr);
        return getBranchByName(repo, branchName);
    }

    public static async createBranch(storage: chrome.storage.StorageArea, repoAddr: RepositoryAddress, branchName: string, commitHash: string): Promise<void> {
        let repo = await RepositoryService.getRepository(storage, repoAddr);
        let res = addBranch(repo, branchName, commitHash);
        await RepositoryStore.update(storage, res);
    }

    public static async deleteBranch(storage: chrome.storage.StorageArea, repoAddr: RepositoryAddress, branchName: string): Promise<void> {
        let repo = await RepositoryService.getRepository(storage, repoAddr);
        repo = removeBranch(repo, branchName);

        await RepositoryStore.update(storage, repo);
    }

    public static async updateBranchPointer(storage: chrome.storage.StorageArea, repoAddr: RepositoryAddress, branchName: string, newCommitHash: string) {
        let repo = await RepositoryService.getRepository(storage, repoAddr);
        repo = updateBranchPointer(repo, branchName, newCommitHash);

        await RepositoryStore.update(storage, repo);
    }

    public static async moveRepository(storage: chrome.storage.StorageArea, repoAddr: RepositoryAddress, newName: string): Promise<void> {
        let repo = await RepositoryService.getRepository(storage, repoAddr);
        let res = renameRepository(repo, newName);

        await RepositoryStore.update(storage, res);

        RepositoryService.openRepositoryInWindow(storage, res);
    }

    public static async openRepositoryInWindow(storage: chrome.storage.StorageArea, repoAddr: RepositoryAddress) {
        let repo = await RepositoryService.getRepository(storage, repoAddr);
        if (repo.branches.length === 0) {
            await BrowserWindow.clearUnpinnedTabs();
            return;
        }
        let branch = getBranchByName(repo, "main")
        let commits = await CommitStore.read(chrome.storage.local, repo);

        await BrowserWindow.clearUnpinnedTabs();
        if (commits.length === 0) {
            return;
        }
        await BrowserWindow.createTabs(await CommitService.getSnapshotForCommit(chrome.storage.local, repo, branch.commit));
        await BrowserWindow.addAllTabsToGroup(repo.name);
    }
}
