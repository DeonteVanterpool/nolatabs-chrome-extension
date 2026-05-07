import {Addition, Commit, CommitDiff, Deletion} from '../models/commit';
import {Repository} from '../models/repository';
import {StorageDTO} from './store';

export const validRepoOwner = new RegExp("^[0-9 A-Za-z@.-]+$");
export const validRepoName = new RegExp("^[0-9 A-Za-z/#@.-]+$");

export const LATEST_VERSION = 1;
type LATEST_SCHEMA = CommitPageV1;
export type CommitPage = CommitPageV1; // add future versions here using union types
export interface ICommitRepository {}

type CommitPageV1 = {
    repo: {owner: string, name: string},
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

class CommitPageStore {
    public static serialize(repo: Repository, commits: Commit[]): CommitPage {
        if (!validRepoOwner.test(repo.owner)) {
            throw Error("Invalid owner name / email");
        } else if (!validRepoName.test(repo.name)) {
            throw Error("Invalid name for a repo");
        }
        return {
            repo: repo,
            commits: CommitPageStore.toStorage(commits),
            version: LATEST_VERSION,
        };
    }

    public static deserialize(page: CommitPage): Commit[] {
        if (page.version < LATEST_VERSION) {
            // run migrations
        }

        return page.commits.map((c) => {
            return {
                hash: c.hash,
                author: c.author,
                timestamp: new Date(c.timestamp),
                message: c.message,
                diff: {
                    additions: c.additions.map((a) => a as Addition),
                    deletions: c.deletions.map((d) => d as Deletion)
                },
                parents: c.parents,
            };
        })
    }

    private static toStorage(commits: Commit[]): CommitStorageV1[] {
        return commits.map((c) => {
            return {
                hash: c.hash,
                author: c.author,
                timestamp: c.timestamp.getTime(),
                message: c.message,
                additions: c.diff.additions.map((a) => a as AdditionStorageV1),
                deletions: c.diff.deletions.map((d) => d as DeletionStorageV1),
                parents: c.parents,
            };
        });
    }
}

export class CommitStore {
    public static async initialized(storage: chrome.storage.StorageArea, repo: Repository) {
        return Object.keys(await storage.get(`commits:${repo.owner}:${repo.name}`)).length !== 0;
    }

    /** Initializes the commit storage for a repository if it doesn't exist yet. Does nothing if it already exists. */
    public static async init(storage: chrome.storage.StorageArea, repo: Repository) {
        if (!(await CommitStore.initialized(storage, repo))) { // only initialize if it hasn't been initialized before, to avoid overwriting existing commits with an empty commit page
            let commitsPath = CommitStore.getPathForCommits(repo);
            (storage.set({
                [commitsPath]: CommitPageStore.serialize(repo, [])
            }));
        }
    }

    /** Sets the commits for a repository, overwriting any existing commits. */
    public static async set(storage: chrome.storage.StorageArea, repo: Repository, commits: Map<string, Commit>) {
        let commitsPath = CommitStore.getPathForCommits(repo);
        let store = CommitPageStore.serialize(repo, Array.from(commits.values()));
        storage.set({
            [commitsPath]: store,
        });
    }

    /** Reads the commits for a repository. Returns an empty map if the repository has no commits or if the commit storage hasn't been initialized yet. */
    public static async read(storage: chrome.storage.StorageArea, repo: Repository): Promise<Map<string, Commit>> {
        let commitsPath = CommitStore.getPathForCommits(repo);
        let commitMap = new Map<string, Commit>();
        let commits: Commit[] = CommitPageStore.deserialize((await storage.get(commitsPath))[commitsPath] as CommitPage);
        commits.forEach((commit) => commitMap.set(commit.hash, commit));
        return commitMap;
    }

    /** Deletes the commits for a repository. Does nothing if the commit storage hasn't been initialized yet. */
    public async delete(storage: chrome.storage.StorageArea, repo: Repository) {
        if (await CommitStore.initialized(storage, repo)) {
            storage.remove(CommitStore.getPathForCommits(repo));
        }
    }

    /** Returns the storage path for the commits of a repository. */
    private static getPathForCommits(repo: Repository) {
        return `commits:${repo.owner}:${repo.name}`;
    }
}

