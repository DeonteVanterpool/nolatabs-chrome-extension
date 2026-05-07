import {Repository} from '../models/repository';
import {CommitStore} from './commit';

type RepositoryDTO = RepositoryDTOV1; // add future versions here using union types
type RepositoryContainer = RepositoryContainerV1; // this is the object that will be stored in chrome.storage. Never build repository collection objects directly, always use the serialization functions
export const LATEST_VERSION = 1;

type RepositoryDTOV1 = {
    name: string,
    owner: string,
    version: number,
}

type RepositoryContainerV1 = {
    items: RepositoryDTO[];
    oldestVersion: number, // this is the version of the oldest repository in the repositories array. This is used to determine if migrations need to be run when deserializing the repositories
}

// This is the repository item that will be stored in chrome.storage. Never build repository objects directly, always use the serialization functions
function deserializeRepo(repositories: RepositoryContainer): Repository[] {
    if (repositories.oldestVersion < LATEST_VERSION) {
        // run migrations
    }
    return repositories.items.map((obj) => {
        return {
            name: obj.name, owner: obj.owner
        }
    });
}

// This is the repository item that will be stored in chrome.storage. Never build repository objects directly, always use the serialization functions
function serializeRepo(models: Repository[]): RepositoryContainer {
    return {
        items: models.map((obj) => {
            return {
                name: obj.name,
                owner: obj.owner,
                version: LATEST_VERSION,
            };
        }),
        oldestVersion: LATEST_VERSION
    };
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

    public static async delete(storage: chrome.storage.StorageArea, repo: Repository) {
        await storage.set({repositories: serializeRepo((await RepositoryStore.read(storage)).filter((r) => !(r.name === repo.name && r.owner === repo.owner)))});
    }
}

