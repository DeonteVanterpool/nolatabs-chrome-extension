import {User} from '../models/user';
import {SettingsDTOV1} from './settings';

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
    settings: SettingsDTOV1,
    schemaVersion: 1,
}

export class UserBuilder {

    user: LATEST_USER;

    public constructor(username: string, email: string, passwordHash: string, settings: SettingsDTOV1) {
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

class UserDTO {
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

        return {username: userStorage.username, email: userStorage.email, passwordHash: userStorage.passwordHash, premium: userStorage.premium, settings: {devMode: userStorage.settings.devMode, autoCommit: userStorage.settings.autoCommit, commitIntervalTime: userStorage.settings.commitIntervalTime, commitMode: userStorage.settings.commitMode, autoPush: userStorage.settings.autoPush}};
    }
}

export class UserStore {
    public static async runMigrations(storage: chrome.storage.StorageArea) {
        let user = await storage.get("user");
        if (!user) {
            throw new Error("User not initialized");
        }
        if (user.schemaVersion < LATEST_VERSION) {
            // call migration functions here
        }
    }

    public static async update(storage: chrome.storage.StorageArea, user: User) {
        await storage.set({user: new UserDTO().serialize(user)});
    }

    public static async read(storage: chrome.storage.StorageArea): Promise<UserStorage | null> {
        UserStore.runMigrations(storage);
        let storedUser = await storage.get("user") as {user: UserStorage};
        if (!storedUser.user) {
            return null;
        }
        return storedUser.user;
    }

    public static async create(storage: chrome.storage.StorageArea, user: User) {
        if (Object.keys(await storage.get("user")).length !== 0) {
            throw new Error("User already initialized");
        }
        await UserStore.update(storage, user);
    }
}
