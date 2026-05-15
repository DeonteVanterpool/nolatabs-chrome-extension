import {Tab} from '../models/tab';
import {Commit} from '../models/commit';
import {Crypto} from './crypto';
import {Branch, Repository} from '../models/repository';
import {CommitStore} from '../repository/commit';
import {RepositoryService} from './repository';
import {CommitHashInput, createCommit} from '../logic/commit';

export class CommitService {
    public static async commit(storage: chrome.storage.StorageArea, repo: Repository, author: string, message: string, tabs: Tab[], branches: Branch[]): Promise<Commit> {

        let commits = await CommitStore.read(chrome.storage.local, repo);
        let timestamp = new Date();
        let branchCommitHashes = branches.map((b) => b.commit);

        let hashInput = new CommitHashInput(author, message, timestamp, tabs, branchCommitHashes);
        let hash = await (new Crypto()).sha2Hash(hashInput.stringify());

        let res = createCommit(hash, author, timestamp, message, tabs, branchCommitHashes, commits)

        await CommitStore.set(storage, repo, res.allCommits);
        await (await RepositoryService.updateBranchPointer(repo, branches[0].name, hash))(storage);
        return res.commit;
    }
}
