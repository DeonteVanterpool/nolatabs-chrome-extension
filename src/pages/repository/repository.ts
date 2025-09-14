import {Repository} from '../models/repository';
import {Store} from './store';

type RepositoryStorageItem = RepositoryStorageItemV1; // add future versions here using union types
export const LATEST_VERSION = 1;

type RepositoryStorageItemV1 = {
    name: string,
    owner: string,
    version: number,
}

class RepositoryStore extends Store<Repository[], RepositoryStorageItem[]> {
    deserialize(objects: RepositoryStorageItem[]): Repository[] {
        return objects.map((obj) => {
            if (obj.version < LATEST_VERSION) {
                // run migrations
            }
            return new Repository(obj.name, obj.owner)
        });
    }

    serialize(models: Repository[]): RepositoryStorageItemV1[] {
        return models.map((obj) => {
            return {
                name: obj.name,
                owner: obj.owner,
                version: LATEST_VERSION,
            };
        })
    }

    public constructor() {
        super();
    }
}

// HAHA
export class RepositoryRepository {
    storage: chrome.storage.StorageArea;

    public constructor(storage: chrome.storage.StorageArea) {
        this.storage = storage;
    }

    public async init() {
        if (!(await this.storage.get("repositories"))) {
            await this.storage.set({repositories: []})
        }
        throw new Error("Repositories storage already initialized");
    }

    public async list(): Promise<Repository[]> {
        return new RepositoryStore().deserialize(await this.storage.get("repositories") as RepositoryStorageItem[]);
    }

    public async new(repo: Repository) {
        await this.storage.set({
            repositories: new RepositoryStore().serialize([...await this.list(), repo])
        });
    }
}

