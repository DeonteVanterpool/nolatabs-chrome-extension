import {User, UserSettings} from "../models/user";
import {UserRepository} from "../repository/user";
import {Crypto} from "./crypto";

export class UserService {

    repo: UserRepository;

    constructor(repo: UserRepository) {
        this.repo = repo;
    }

    public async get(): Promise<User | null> {
        return this.repo.read();
    }

    public async signup(name: string, password: string): Promise<boolean> {
        return await this.repo.create(new User(name, "", await new Crypto().sha2Hash(password), false, new UserSettings(false, true, 3600, "timer", false))).then(() => true).catch(() => false);
    }
}

