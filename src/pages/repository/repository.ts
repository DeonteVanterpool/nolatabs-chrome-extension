import {Commit} from '../models/commit';
import {Repository, RepositoryAddress} from '../models/repository';
import {CommitStore} from './commit';

type RepositoryDTO = RepositoryDTOV2; // add future versions here using union types
type BranchDTO = BranchDTOV1; // add future versions here using union types
type RepositoryContainer = RepositoryContainerV2; // this is the object that will be stored in chrome.storage. Never build repository collection objects directly, always use the serialization functions
export const LATEST_VERSION = 2;

type RepositoryDTOV1 = {
    name: string,
    owner: string,
    version: number,
}

type RepositoryDTOV2 = {
    name: string,
    owner: string,
    branches: BranchDTO[],
    version: number,
}


type BranchDTOV1 = {
    name: string,
    commit: string, // hash of the commit the branch is pointing to
}

type RepositoryContainerV2 = {
    items: RepositoryDTO[];
    oldestVersion: number, // this is the version of the oldest repository in the repositories array. This is used to determine if migrations need to be run when deserializing the repositories
}

// This is the repository item that will be stored in chrome.storage. Never build repository objects directly, always use the serialization functions
async function deserializeRepo(repositories: RepositoryContainer): Promise<Repository[]> {

    let itemsToRepositories: (obj: RepositoryDTO) => Repository = (obj) => {
        return {
            name: obj.name,
            owner: obj.owner,
            branches: obj.branches.map((b) => {
                return {
                    name: b.name,
                    commit: b.commit,
                }
            }
            ),
        };
    };

    if (repositories.oldestVersion < LATEST_VERSION) {
        // run migrations
        repositories.items = await Promise.all(repositories.items.map((obj) => {
            if (obj.version === 1) {
                let repoV1 = obj as RepositoryDTOV1;
                return migrateRepoV1ToV2(repoV1);
            }
            else {
                throw new Error(`Unknown repository version ${obj.version} for repo ${obj.owner}/${obj.name}`);
            }
        }));

        repositories.oldestVersion = LATEST_VERSION; // no need to run migrations again until we add a new version
        let repos = repositories.items.map(itemsToRepositories);
        await chrome.storage.local.set({repositories: serializeRepo(repos)}); // update the repositories in storage to the latest version
        return repos;
    }

    return repositories.items.map(itemsToRepositories);
}

async function migrateRepoV1ToV2(repo: RepositoryDTOV1): Promise<RepositoryDTOV2> {
    let commits = await CommitStore.read(chrome.storage.local, {name: repo.name, owner: repo.owner});

    let tips: Commit[] = [];
    let allParents: Set<string> = new Set();
    let commitsList = Array.from(commits.values());
    if (commitsList.length === 0) {
        return {
            name: repo.name,
            owner: repo.owner,
            branches: [],
            version: LATEST_VERSION,
        }
    }
    for (let commit of commitsList) {
        commit.parents.forEach((p) => allParents.add(p));
    }
    for (let commit of commitsList) {
        if (!allParents.has(commit.hash)) {
            tips.push(commit);
        }
    }
    if (tips.length === 0) {
        throw new Error(`No commits found for repo ${repo.name}`);
    } else if (tips.length > 1) {
        throw new Error(`Multiple tips found for repo ${repo.name}. This should never happen since we don't allow merges yet!`);
    }

    return {
        name: repo.name,
        owner: repo.owner,
        branches: [{name: "main", commit: tips[0].hash}],
        version: LATEST_VERSION,
    };
}

// This is the repository item that will be stored in chrome.storage. Never build repository objects directly, always use the serialization functions
function serializeRepo(models: Repository[]): RepositoryContainer {
    let items: RepositoryDTO[] = models.map((repo) => {
        return {
            name: repo.name,
            owner: repo.owner,
            branches: repo.branches.map((b) => {
                return {
                    name: b.name,
                    commit: b.commit,
                }
            }),
            version: LATEST_VERSION,
        }
    });
    return {
        items: items,
        oldestVersion: LATEST_VERSION,
    } as RepositoryContainer;
}

export class RepositoryStore {
    public static async initialized(storage: chrome.storage.StorageArea): Promise<boolean> {
        return Object.keys(await storage.get("repositories")).length !== 0;
    }

    /** Initializes the repositories storage with an empty array. Throws an error if the repositories storage is already initialized. */
    public static async init(storage: chrome.storage.StorageArea) {
        if (await RepositoryStore.initialized(storage)) {
            throw new Error("Repositories storage already initialized");
        }
        await storage.set({repositories: serializeRepo([])});
    }

    public static async read(storage: chrome.storage.StorageArea): Promise<Repository[]> {
        let data = await storage.get("repositories");
        if (!data.repositories) {
            throw new Error("Repositories storage not initialized");
        }
        return deserializeRepo(data.repositories as RepositoryContainer);
    }

    public static async create(storage: chrome.storage.StorageArea, repo: Repository) {
        await CommitStore.init(storage, repo);
        await storage.set({repositories: serializeRepo([...await RepositoryStore.read(storage), repo])});
    }

    public static async update(storage: chrome.storage.StorageArea, repo: Repository) {
        let repos = await RepositoryStore.read(storage);
        let repoIndex = repos.findIndex((r) => r.name === repo.name && r.owner === repo.owner);
        if (repoIndex === -1) {
            throw new Error(`Repository ${repo.owner}/${repo.name} not found`);
        }
        repos[repoIndex] = repo;
        await storage.set({repositories: serializeRepo(repos)});
    }

    public static async delete(storage: chrome.storage.StorageArea, repo: RepositoryAddress) {
        await storage.set({repositories: serializeRepo((await RepositoryStore.read(storage)).filter((r) => !(r.name === repo.name && r.owner === repo.owner)))});
    }
}

