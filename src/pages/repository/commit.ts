import { Commit } from '../models/commit';

export interface ICommitRepository {

}

export class CommitRepository {
    storage: chrome.storage.StorageArea;
    commits: Map<String, Commit>;
    public constructor(storage: chrome.storage.StorageArea) {
        this.storage = storage;
        this.commits = new Map();
    }

    public async init() {
        let commits: Commit[] = await this.storage.get("commits") as Commit[];
        commits.forEach((commit) => this.commits.set(commit.hash, commit));
    }

    public get(hash: string): Commit {
        let commit = this.commits.get(hash);
        if (!commit) {
            throw Error("No commit for given hash: " + hash);
        }
        return commit;
    }
}

