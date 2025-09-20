import {User, UserSettings} from '../models/user';
import {SettingsStorageV1} from './settings';
import {Store} from './store';

export const LATEST_VERSION = 1;
type LATEST_USER = UserStorageV1;
export type UserStorage = UserStorageV1; // add future versions here using union types

/** This is the user item that will be stored in chrome.storage. Never build user objects directly, always use the builder
 * See `documentation/updating_schemas.md` for guidance on how to make changes the storage schema.
 */
export type UserStorageV1 = {
    username: string,
    email: string,
    passwordHash: string, // DO NOT use this hash to encrypt anything. This hash is just to ensure you entered the correct password
    premium: boolean,
    settings: SettingsStorageV1,
    schemaVersion: 1,
}

export class UserBuilder {

    user: LATEST_USER;

    public constructor(username: string, email: string, passwordHash: string, settings: SettingsStorageV1) {
        this.user = {
            username: username,
            email: email,
            passwordHash: passwordHash,
            premium: false,
            settings: settings,
            schemaVersion: LATEST_VERSION,
        };
    }

    public setPremiumUser(premiumUser: boolean): UserBuilder {
        this.user.premium = premiumUser;
        return this;
    }

    public build(): UserStorageV1 {
        return this.user;
    }
}

class UserStore extends Store<User, UserStorage> {
    public serialize(user: User): UserStorage {
        return {
            username: user.username,
            email: user.email,
            passwordHash: user.passwordHash,
            premium: user.premium,
            settings: {
                devMode: user.settings.devMode,
                autoCommit: user.settings.autoCommit,
                commitIntervalTime: user.settings.commitIntervalTime,
                commitMode: user.settings.commitMode,
                autoPush: user.settings.autoPush,
            },
            schemaVersion: LATEST_VERSION,
        };
    }

    public deserialize(userStorage: UserStorage): User {
        if (userStorage.schemaVersion < LATEST_VERSION) {
            // run migrations
        }

        return new User(userStorage.username, userStorage.email, userStorage.passwordHash, userStorage.premium, new UserSettings(userStorage.settings.devMode, userStorage.settings.autoCommit, userStorage.settings.commitIntervalTime, userStorage.settings.commitMode, userStorage.settings.autoPush));
    }
}

export class UserRepository {
    storage: chrome.storage.StorageArea;
    public constructor(storage: chrome.storage.StorageArea) {
        this.storage = storage;
    }

    public async runMigrations() {
        let user = await this.storage.get("user");
        if (!user) {
            throw new Error("User not initialized");
        }
        if (user.schemaVersion < LATEST_VERSION) {
            // call migration functions here
        }
    }

    public async update(user: User) {
        await this.storage.set({user: new UserStore().serialize(user)});
    }

    public async read(): Promise<UserStorage | null> {
        this.runMigrations();
        let storedUser = await this.storage.get("user") as {user: UserStorage};
        if (!storedUser.user) {
            return null;
        }
        return storedUser.user;
    }

    public async create(user: User) {
        if (Object.keys(await this.storage.get("user")).length !== 0) {
            throw new Error("User already initialized");
        }
        await this.update(user);
    }
}
