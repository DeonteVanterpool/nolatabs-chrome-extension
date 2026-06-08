import {createDefaultUser, setDevMode} from "../logic/user";
import {User} from "../models/user";
import {UserStore} from "../repository/user";
import {Crypto} from "./crypto";

export class UserService {

    public static async get(storage: chrome.storage.StorageArea): Promise<User | null> {
        return UserStore.read(storage);
    }

    public static async signup(storage: chrome.storage.StorageArea, name: string, password: string): Promise<boolean> {
        let passwordHash = await new Crypto().argon2Hash(password);
        return await UserStore.create(storage, createDefaultUser(name, passwordHash)).then(() => true).catch(() => false);
    }

    public static async welcomed(storage: chrome.storage.StorageArea): Promise<boolean> {
        return await UserService.get(storage) !== null;
    }

    public static async welcome(storage: chrome.storage.StorageArea, password: string, devMode: boolean): Promise<void> {
        await UserService.signup(storage, "me", password);

        let user = setDevMode((await UserService.get(storage))!, devMode);

        await UserStore.update(storage, user);
    }

    public static async authenticate(storage: chrome.storage.StorageArea, password: string): Promise<boolean> {
        let user = await UserStore.read(storage);
        return await new Crypto().argon2Verify(password, user!.passwordHash) === true;
    }
}

