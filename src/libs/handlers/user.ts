import * as db from "../db/storage";
import {createDefaultUser, setDevMode} from "../logic/user";
import {User} from "src/models/user";
import {uuid} from "./cryptography";

export async function get(): Promise<User | null> {
    try {
        return await db.fetchMe();
    } catch {
        return null;
    }
}

export async function welcome(devMode: boolean, passwordHash: string, masterKeySalt: string): Promise<void> {
    let user = createDefaultUser(uuid(), "me", passwordHash, masterKeySalt);

    user = setDevMode(user, devMode);
    await db.createUser(user);
}

export async function checkWelcomeStatus(): Promise<boolean> {
    return !!get();
}
