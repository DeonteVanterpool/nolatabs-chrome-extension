import { Addition, Commit, CommitDiff, Deletion } from '../models/commit';
import { Repository } from '../models/repository';
import { Store } from './store';

export const validRepoOwner = new RegExp("^[A-Za-z@.-]+$");
export const validRepoName = new RegExp("^[A-Za-z/#@.-]+$");

export const LATEST_VERSION = 1;
type LATEST_SCHEMA = CommitPageV1;
export type CommitPage = CommitPageV1; // add future versions here using union types
export interface ICommitRepository { }

type CommitPageV1 = {
    repo: { owner: string, name: string },
    commits: CommitStorageV1[],
    version: number,
    // in the future we can add pagination here
}

type CommitStorageV1 = {
    hash: string,
    author: string,
    timestamp: number,
    message: string,
    additions: AdditionStorageV1[],
    deletions: DeletionStorageV1[],
    parents: string[],
}

type AdditionStorageV1 = {
    tab: TabStorageV1,
    after: number,
}

type DeletionStorageV1 = {
    index: number,
}

type TabStorageV1 = {
    url: string,
    title: string,
    favicon: string,
    pinned: boolean,
}

class CommitPageStore extends Store<Commit[], CommitPage> {
    repo: Repository;

    public constructor(repo: Repository) {
        super()
        if (!validRepoOwner.test(repo.owner)) {
            throw Error("Invalid owner name / email");
        } else if (!validRepoName.test(repo.name)) {
            throw Error("Invalid name for a repo");
        }
        this.repo = repo;
    }

    public serialize(commits: Commit[]): CommitPage {
        return {
            repo: this.repo,
            commits: CommitPageStore.toStorage(commits),
            version: LATEST_VERSION,
        };
    }

    public deserialize(page: CommitPage): Commit[] {
        if (page.version < LATEST_VERSION) {
            // run migrations
        }

        return page.commits.map((c) => {
            return {
                hash: c.hash,
                author: c.author,
                timestamp: new Date(c.timestamp),
                message: c.message,
                deltas: new CommitDiff(c.additions.map((a) => a as Addition), c.deletions.map((d) => d as Deletion)),
                parents: c.parents,
            } as Commit;
        })
    }

    private static toStorage(commits: Commit[]): CommitStorageV1[] {
        return commits.map((c) => {
            return {
                hash: c.hash,
                author: c.author,
                timestamp: c.timestamp.getTime(),
                message: c.message,
                additions: c.deltas.additions.map((a) => a as AdditionStorageV1),
                deletions: c.deltas.deletions.map((d) => d as DeletionStorageV1),
                parents: c.parents,
            };
        });
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
        let commits: CommitStorageV1[] = [];
        this.commits.forEach((val, _key) => commits.push(new CommitStorage(val, this.repo as Repository)));
        let commitPage: CommitPage = {
            repo: { owner: this.repo.owner, name: this.repo.name },
            commits: commits.map((commit) => commit.toItem()),
            version: latest, // todo: handle migrations
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

