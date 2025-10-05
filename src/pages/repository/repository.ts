import {Repository} from '../models/repository';
import {CommitRepository} from './commit';
import {Store} from './store';

type RepositoryStorageItem = RepositoryStorageItemV1; // add future versions here using union types
type RepositoryStorage = RepositoryStorageV1;
export const LATEST_VERSION = 1;

type RepositoryStorageItemV1 = {
    name: string,
    owner: string,
    version: number,
}

type RepositoryStorageV1 = {
    repositories: RepositoryStorageItem[];
    version: number,
}

class RepositoryStore extends Store<Repository[], RepositoryStorage> {
    deserialize(repositories: RepositoryStorage): Repository[] {
        if (repositories.version < LATEST_VERSION) {
            // run migrations
        }
        return repositories.repositories.map((obj) => {
            return {
                name: obj.name, owner: obj.owner
            }
        });
    }

    serialize(models: Repository[]): RepositoryStorage {
        return {
            repositories: models.map((obj) => {
                return {
                    name: obj.name,
                    owner: obj.owner,
                    version: LATEST_VERSION,
                };
            }),
            version: LATEST_VERSION
        };
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

    public async initialized() {
        return Object.keys(await this.storage.get("repositories")).length !== 0;
    }

    public async init() {
        if (await this.initialized()) {
            throw new Error("Repositories storage already initialized");
        }
        await this.storage.set({repositories: []});
    }

    public async list(): Promise<Repository[]> {
        return new RepositoryStore().deserialize((await this.storage.get("repositories")) as RepositoryStorage);
    }

    public async new(repo: Repository) {
        let commitRepo = new CommitRepository(this.storage);
        await commitRepo.init(repo);
        await this.storage.set(
            new RepositoryStore().serialize([...await this.list(), repo]));
    }
}

