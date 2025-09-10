import {Commit} from '../models/commit';
import {Repository} from '../models/repository';

type RepositoryStorageItem = {
    name: string,
    owner: string,
    version: number,
}

class RepositoryStorage {
    name: string;
    owner: string;
    public constructor(repo: Repository) {
        this.name = repo.name;
        this.owner = repo.owner;
    }
}

// HAHA
export class RepositoryRepository {
    storage: chrome.storage.StorageArea;
    public constructor(storage: chrome.storage.StorageArea) {
        this.storage = storage;
    }

    public async init() {
        await this.storage.set({ repositories: [] })
    }

    public async list(): Promise<Repository[]> {
        return await this.storage.get("repositories").map(item);
    }

    public async new(repo: Repository) {

    }

    public async get(name: string, owner: string) {
            let repo = (await this.storage.get("repositories") as RepositoryStorageItem[]).find((repo) => repo.name === name && repo.owner === owner);
        if (!repo) {
            throw Error("No repo for given owner " + owner + " and name " + name);
        }
    }
}

