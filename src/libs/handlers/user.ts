import {Result} from "true-myth";
import * as db from "../db/storage";
import {User, UserSettings} from "src/models/user";
import {ok} from "true-myth/result";

export async function get(): Promise<User | null> {
    try {
        return await db.fetchMe();
    } catch {
        return null;
    }
}

export async function checkWelcomeStatus(): Promise<boolean> {
    return !!get();
}

export async function fetchSettings(): Promise<Result<UserSettings, string>> {
    return ok((await db.fetchMe()).settings);
}

export async function setSettings(settings: UserSettings): Promise<boolean> {
    return await db.setSettings(settings);
}

