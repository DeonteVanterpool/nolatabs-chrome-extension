import { Commit, CommitDiff } from '../models/commit';
import { Repository } from '../models/repository';

export const validRepoOwner = new RegExp("^[A-Za-z@.-]+$");
export const validRepoName = new RegExp("^[A-Za-z/#@.-]+$");

export interface ICommitRepository { }

class CommitStorage {
    hash: string;
    author: string;
    timestamp: number;
    message: string;
    deltas: CommitDiff;
    parents: string[];
    repo: { owner: string, name: string }

    public constructor(commit: Commit, repo: Repository) {
        if (!validRepoOwner.test(repo.owner)) {
            throw Error("Invalid owner name / email");
        } else if (!validRepoName.test(repo.name)) {
            throw Error("Invalid name for a repo");
        }
        this.repo = { owner: repo.owner, name: repo.name };
        this.hash = commit.hash;
        this.author = commit.author;
        this.timestamp = commit.timestamp.getTime();
        this.message = commit.message;
        this.deltas = commit.deltas;
        this.parents = commit.parents;
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

    public async init(repo: Repository) {
        let commits: CommitStorage[] = await this.storage.get("commits") as CommitStorage[]; // worst case scenario, we can start paginating these commits
        commits.filter((commit) => commit.repo.name === repo.name && commit.repo.owner === repo.owner ).forEach((commit) => this.commits.set(commit.hash, commit.toCommit()));
        this.repo = repo;
    }

    private async sync() {
        let commits: CommitStorage[] = [];
        this.commits.forEach((val, _key) => commits.push(new CommitStorage(val, this.repo as Repository)));
        await this.storage.set({ commits: commits });
    }

    public get(hash: string): Commit {
        let commit = this.commits.get(hash);
        if (!commit) {
            throw Error("No commit for given hash: " + hash);
        }
        return commit;
    }

    public async delete(hash: string) {
        if (!this.repo) {
            throw new Error("Repository not initialized");
        }
        this.commits.delete(hash);
        let commits: CommitStorage[] = [];
        this.commits.forEach((val, _key) => commits.push(new CommitStorage(val, this.repo as Repository)));
        await this.sync();
    }

    public async add(commit: Commit) {
        this.commits.set(commit.hash, commit);
        if (commit.parents.length == 0) {
            await this.sync();
            return;
        }
        let base = this.commits.get(commit.parents[0]); // TODO: loop through parents
        if (!base) {
            throw new Error("Base " + commit.parents[0] + " does not exist in repo" + this.repo)
        }
        this.commits.set(base.hash, base);
        await this.sync();
    }
}

