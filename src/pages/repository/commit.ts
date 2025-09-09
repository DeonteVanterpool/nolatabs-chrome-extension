import { Commit, CommitDiff } from '../models/commit';
import { Repository } from '../models/repository';

export const validRepoOwner = new RegExp("^[A-Za-z@.-]+$");
export const validRepoName = new RegExp("^[A-Za-z/#@.-]+$");
export const latest = 1;

export interface ICommitRepository { }

type CommitPage = {
    repo: { owner: string, name: string },
    commits: CommitStorageItem[],
    version: number,
    // in the future we can add pagination here
}

type CommitStorageItem = {
    hash: string,
    author: string,
    timestamp: number,
    message: string,
    deltas: CommitDiff,
    parents: string[],
}

class CommitStorage {
    hash: string;
    author: string;
    timestamp: number;
    message: string;
    deltas: CommitDiff;
    parents: string[];

    public constructor(commit: Commit, repo: Repository) {
        if (!validRepoOwner.test(repo.owner)) {
            throw Error("Invalid owner name / email");
        } else if (!validRepoName.test(repo.name)) {
            throw Error("Invalid name for a repo");
        }
        this.hash = commit.hash;
        this.author = commit.author;
        this.timestamp = commit.timestamp.getTime();
        this.message = commit.message;
        this.deltas = commit.deltas;
        this.parents = commit.parents;
    }

    public static fromStorageItem(item: CommitStorageItem): CommitStorage {
        return item as CommitStorage;
    }

    public toItem(): CommitStorageItem {
        return this as CommitStorageItem;
    }

    public toCommit(): Commit {
        return {
            author: this.author,
            hash: this.hash,
            timestamp: new Date(this.timestamp),
            message: this.message,
            deltas: this.deltas,
            parents: this.parents,
        } as Commit;
    }
}

export class CommitRepository {
    storage: chrome.storage.StorageArea;
    commits: Map<string, Commit>;
    repo: Repository | null;
    public constructor(storage: chrome.storage.StorageArea) {
        this.storage = storage;
        this.commits = new Map();
        this.repo = null;
    }

    public async cd(repo: Repository) {
        let commitPage: CommitPage = await this.storage.get(`commits:${repo.owner}:${repo.name}`) as CommitPage;
        this.commits.clear();
        commitPage.commits.forEach((commit) => this.commits.set(commit.hash, CommitStorage.fromStorageItem(commit).toCommit()));
        this.repo = repo;
    }

    private async sync() {
        if (!this.repo) {
            throw new Error("Repository not initialized");
        }
        let path = `commits:${this.repo.owner}:${this.repo.name}`;
        let commits: CommitStorage[] = [];
        this.commits.forEach((val, _key) => commits.push(new CommitStorage(val, this.repo as Repository)));
        let commitPage: CommitPage = {
            repo: { owner: this.repo.owner, name: this.repo.name },
            commits: commits.map((commit) => commit.toItem()),
            version: latest,
        }
        // See: ES6 Computed Property Names https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#computed_property_names
        this.storage.set({ 
            [path]: commitPage,
        });
    }

    public get(hash: string): Commit {
        let commit = this.commits.get(hash);
        if (!commit) {
            throw Error("No commit for given hash: " + hash);
        }
        return commit;
    }

    public async add(commit: Commit) {
        this.commits.set(commit.hash, commit);
        if (commit.parents.length === 0) {
            await this.sync();
            return;
        }
        commit.parents.forEach((p) => {
        let base = this.commits.get(p); // TODO: loop through parents
        if (!base) {
            throw new Error("Base " + p + " does not exist in repo" + this.repo)
        }
        });
        await this.sync();
    }
}

