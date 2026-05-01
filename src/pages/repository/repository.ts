import {Repository} from '../models/repository';
import {CommitStore} from './commit';
import {StorageDTO} from './store';

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

class RepositoryDTO extends StorageDTO<Repository[], RepositoryStorage> {
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

export class RepositoryStore {
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

    public async read(): Promise<Repository[]> {
        return new RepositoryDTO().deserialize((await this.storage.get("repositories")) as RepositoryStorage);
    }

    public async create(repo: Repository) {
        let commitRepo = new CommitStore(this.storage);
        await commitRepo.init(repo);
        await this.storage.set(
            new RepositoryDTO().serialize([...await this.read(), repo]));
    }

    public async delete(repo: Repository) {
        await this.storage.set(
            new RepositoryDTO().serialize((await this.read()).filter((r) => !(r.name === repo.name && r.owner === repo.owner))));
    }
}

