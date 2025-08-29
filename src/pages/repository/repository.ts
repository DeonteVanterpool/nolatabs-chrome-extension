import {Commit} from '../models/commit';
import {Repository} from '../models/repository';

export interface IRepositoryRepository {

}

class RepositoryStorage {
    head: string;
    name: string;
    owner: string;
    public constructor(repo: Repository) {
        this.name = repo.name;
        this.head = repo.head;
        this.owner = repo.owner;
    }
}

// HAHA
export class RepositoryRepository {
    storage: chrome.storage.StorageArea;
    public constructor(storage: chrome.storage.StorageArea) {
        this.storage = storage;
    }

    public async init(name: string, owner: string) {
            let repo = (await this.storage.get("repositories") as Repository[]).find((repo) => repo.name === name && repo.owner === owner);
        if (!repo) {
            throw Error("No repo for given owner " + owner + " and name " + name);
        }
        let head = repo.head;
    }
}

