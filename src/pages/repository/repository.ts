import {Commit} from '../models/commit';

export interface IRepositoryRepository {

}

// HAHA
export class RepositoryRepository {
    storage: chrome.storage.StorageArea;
    commits: Map<String, Commit>;
    public constructor(storage: chrome.storage.StorageArea) {
        this.storage = storage;
        this.commits = new Map();
    }

    public async init(hash: string) {
        let commits: Commit[] = await this.storage.get({repo: hash}) as Commit[];
        this.commits.clear();
        commits.forEach((commit) => this.commits.set(commit.hash, commit));
    }
}

