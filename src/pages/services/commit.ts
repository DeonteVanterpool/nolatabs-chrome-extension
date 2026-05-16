import {Tab} from '../models/tab';
import {Commit} from '../models/commit';
import {Crypto} from './crypto';
import {Branch, Repository, RepositoryAddress} from '../models/repository';
import {CommitStore} from '../repository/commit';
import {RepositoryService} from './repository';
import {CommitHashInput, createCommit, buildSnapshot} from '../logic/commit';
import {RepositoryStore} from '../repository/repository';

export class CommitService {
    /* Creates a new commit with the given author, message, and tabs, and updates the branch pointer to point to the new commit. In the future, we can add data transactions to this function to make it atomic and rollback on failure so data is not corrupted */
    public static async commit(storage: chrome.storage.StorageArea, repoAddr: RepositoryAddress, author: string, message: string, tabs: Tab[], branchNames: string[]): Promise<Commit> {
        console.log("Commiting")
        let repo = await RepositoryService.getRepository(storage, repoAddr);
        let branches: Branch[] = [];
        if (repo.branches.length !== 0) {
            branches = await Promise.all(branchNames.map((b) => RepositoryService.getBranch(storage, repoAddr, b)));
        }

        // preparing for commit creation
        let commits = await CommitStore.read(chrome.storage.local, repo);

        let timestamp = new Date();
        let branchCommitHashes = branches.map((b) => b.commit);

        let hashInput = new CommitHashInput(author, message, timestamp, tabs, branchCommitHashes);
        let hash = await (new Crypto()).sha2Hash(hashInput.stringify());

        console.log("Repo: " + repo);

        // create the commit
        let res = createCommit(hash, author, timestamp, message, tabs, branchCommitHashes, commits)

        // update storage
        await CommitStore.set(storage, repo, res.allCommits);

        // update branch pointer to point to the new commit
        console.log(repo.branches)
        if (repo.branches.length !== 0) {
            console.log("zero")
            await RepositoryService.updateBranchPointer(storage, repo, branchNames[0], hash)
        } else {
            await RepositoryService.createBranch(storage, repoAddr, "main", res.commit.hash)
        };

        await RepositoryService.openRepositoryInWindow(storage, repo);

        return res.commit;
    }

    public static async getSnapshotForCommit(storage: chrome.storage.StorageArea, repo: Repository, commitHash: string): Promise<Tab[]> {
        let commits = await CommitStore.read(chrome.storage.local, repo);
        return buildSnapshot(commits, commitHash);
    }
}
