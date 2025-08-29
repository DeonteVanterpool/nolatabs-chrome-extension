import { Commit, CommitDiff } from '../models/commit';
import { Repository } from '../models/repository';

export const validRepoOwner = new RegExp("[A-Za-z@.-]+");
export const validRepoName = new RegExp("[A-Za-z/#@.-]+");

export interface ICommitRepository { }

class CommitStorage {
    hash: string;
    author: string;
    timestamp: number;
    message: string;
    deltas: CommitDiff;
    base: string | null = null;
    children: string[];
    repo: { owner: string, name: string }

    public constructor(commit: Commit, repo: Repository) {
        if (!validRepoOwner.exec(repo.owner)) {
            throw Error("Invalid owner name / email");
        } else if (!validRepoName.exec(repo.name)) {
            throw Error("Invalid name for a repo");
        }
        this.repo = { owner: repo.owner, name: repo.name };
        this.hash = commit.hash;
        this.author = commit.author;
        this.timestamp = commit.timestamp.getMilliseconds();
        this.message = commit.message;
        this.deltas = commit.deltas;
        this.base = commit.base;
        this.children = commit.children;
    }

    public toCommit(): Commit {
        return {
            author: this.author,
            hash: this.hash,
            timestamp: new Date(this.timestamp),
            message: this.message,
            deltas: this.deltas,
            base: this.base,
            children: this.children,
        } as Commit;
    }
}

export class CommitRepository {
    storage: chrome.storage.StorageArea;
    commits: Map<string, Commit>;
    public constructor(storage: chrome.storage.StorageArea) {
        this.storage = storage;
        this.commits = new Map();
    }

    public async init(repo: Repository) {
        let commits: CommitStorage[] = await this.storage.get("commits") as CommitStorage[]; // worst case scenario, we can start paginating these commits
        commits.filter((commit) => commit.repo.name === repo.name && commit.repo.owner === repo.owner ).forEach((commit) => this.commits.set(commit.hash, commit.toCommit()));
    }

    public get(hash: string): Commit {
        let commit = this.commits.get(hash);
        if (!commit) {
            throw Error("No commit for given hash: " + hash);
        }
        return commit;
    }
}

