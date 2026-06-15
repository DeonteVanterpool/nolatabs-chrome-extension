import * as db from "../db/storage";
import {createDefaultUser, setDevMode} from "../logic/user";
import {User} from "src/models/user";
import {uuid} from "./crypto";

export async function get(): Promise<User | null> {
    try {
        return await db.fetchMe();
    } catch {
        return null;
    }
}

export async function welcome(devMode: boolean): Promise<void> {
    let user = createDefaultUser(uuid(), "me");

    user = setDevMode(user, devMode);
    await db.createUser(user);
}

