import {Addition, Commit, CommitDiff, Deletion} from '../models/commit';

export const validRepoOwner = new RegExp("^[0-9 A-Za-z@.-]+$");
export const validRepoName = new RegExp("^[0-9 A-Za-z/#@.-]+$");

// We only need the repository name and owner to store commits, so we can use a simplified repository parameter type here instead of the full Repository type from repository.ts
export type RepositoryAddress = {
    name: string;
    owner: string;
}

export const LATEST_VERSION = 1;
type LATEST_SCHEMA = CommitPageV1;
export type CommitPage = CommitPageV1; // add future versions here using union types
export interface ICommitRepository {}

// This is the commit page that will be stored in chrome.storage. Never build commit pages directly, always use the serialization functions
type CommitPageV1 = {
    repo: {owner: string, name: string},
    commits: CommitDTOV1[],
    version: number,
    // in the future we can add pagination here
}

// This is the commit item that will be stored in chrome.storage. Never build commit objects directly, always use the serialization functions
type CommitDTOV1 = {
    hash: string,
    author: string,
    timestamp: number,
    message: string,
    additions: AdditionDTOV1[],
    deletions: DeletionDTOV1[],
    parents: string[],
}

type AdditionDTOV1 = {
    tab: TabDTOV1,
    after: number,
}

type DeletionDTOV1 = {
    index: number,
}

type TabDTOV1 = {
    url: string,
    title: string,
    favicon: string,
    pinned: boolean,
}

/** Serializes a list of commits for storage. Throws an error if the repository owner or name is invalid. */
function serializeCommits(repo: RepositoryAddress, commits: Commit[]): CommitPage {
    if (!validRepoOwner.test(repo.owner)) {
        throw Error("Invalid owner name / email");
    } else if (!validRepoName.test(repo.name)) {
        throw Error("Invalid name for a repo");
    }
    return {
        repo: repo,
        commits: toStorageObject(commits),
        version: LATEST_VERSION,
    };
}

/** Deserializes a commit page from storage. Throws an error if the commit page is invalid. */
function deserializeCommits(page: CommitPage): Commit[] {
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

function toStorageObject(commits: Commit[]): CommitDTOV1[] {
    return commits.map((c) => {
        return {
            hash: c.hash,
            author: c.author,
            timestamp: c.timestamp.getTime(),
            message: c.message,
            additions: c.diff.additions.map((a) => a as AdditionDTOV1),
            deletions: c.diff.deletions.map((d) => d as DeletionDTOV1),
            parents: c.parents,
        };
    });
}

export class CommitStore {
    /** Checks if the commit storage for a repository has been initialized. */
    public static async initialized(storage: chrome.storage.StorageArea, repo: RepositoryAddress) {
        return Object.keys(await storage.get(`commits:${repo.owner}:${repo.name}`)).length !== 0;
    }

    /** Initializes the commit storage for a repository if it doesn't exist yet. Does nothing if it already exists. */
    public static async init(storage: chrome.storage.StorageArea, repo: RepositoryAddress) {
        if (!(await CommitStore.initialized(storage, repo))) { // only initialize if it hasn't been initialized before, to avoid overwriting existing commits with an empty commit page
            let commitsPath = CommitStore.getPathForCommits(repo);
            (storage.set({
                [commitsPath]: serializeCommits(repo, [])
            }));
        }
    }

    /** Sets the commits for a repository, overwriting any existing commits. */
    public static async set(storage: chrome.storage.StorageArea, repo: RepositoryAddress, commits: Map<string, Commit>) {
        let commitsPath = CommitStore.getPathForCommits(repo);
        let store = serializeCommits(repo, Array.from(commits.values()));
        storage.set({
            [commitsPath]: store,
        });
    }

    /** Reads the commits for a repository. Returns an empty map if the repository has no commits or if the commit storage hasn't been initialized yet. */
    public static async read(storage: chrome.storage.StorageArea, repo: RepositoryAddress): Promise<Map<string, Commit>> {
        let commitsPath = CommitStore.getPathForCommits(repo);
        let commitMap = new Map<string, Commit>();
        let commits: Commit[] = deserializeCommits((await storage.get(commitsPath))[commitsPath] as CommitPage);
        commits.forEach((commit) => commitMap.set(commit.hash, commit));
        return commitMap;
    }

    /** Deletes the commits for a repository. Does nothing if the commit storage hasn't been initialized yet. */
    public static async delete(storage: chrome.storage.StorageArea, repo: RepositoryAddress) {
        if (await CommitStore.initialized(storage, repo)) {
            storage.remove(CommitStore.getPathForCommits(repo));
        }
    }

    /** Returns the storage path for the commits of a repository. */
    private static getPathForCommits(repo: RepositoryAddress) {
        return `commits:${repo.owner}:${repo.name}`;
    }
}

