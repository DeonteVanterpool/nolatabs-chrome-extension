import {User} from "../models/user";
import {UserStore} from "../repository/user";
import {Crypto} from "./crypto";

export class UserService {

    repo: UserStore;

    constructor(repo: UserStore) {
        this.repo = repo;
    }

    public async get(): Promise<User | null> {
        return this.repo.read();
    }

    public async signup(name: string, password: string): Promise<boolean> {
        return await this.repo.create({
            username: name,
            email: "",
            passwordHash: await new Crypto().argon2Hash(password),
            premium: false,
            settings: {
                devMode: false,
                autoCommit: true,
                commitIntervalTime: 3600,
                commitMode: "timer",
                autoPush: false,
            },
        }).then(() => true).catch(() => false);
    }

    public static async welcomed(storage: chrome.storage.StorageArea): Promise<boolean> {
        return (await chrome.storage.session.get("welcomed")).welcomed === true;
    }

    public async authenticate(password: string): Promise<boolean> {
        let user = await this.repo.read();
        return await new Crypto().argon2Verify(password, user!.passwordHash) === true;
    }
}

