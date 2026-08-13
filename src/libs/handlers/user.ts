import {Result} from "true-myth";
import * as db from "../db/storage";
import {User, UserSettings} from "src/models/user";
import {ok} from "true-myth/result";
import {base64ToUint8Array} from "./cryptography";

export async function get(): Promise<User | null> {
    try {
        return await db.fetchMe();
    } catch {
        return null;
    }
}

export async function checkWelcomeStatus(): Promise<boolean> {
    return !!(await get());
}

export async function fetchSettings(): Promise<Result<UserSettings, string>> {
    return ok((await db.fetchMe()).settings);
}

export async function setSettings(settings: UserSettings): Promise<boolean> {
    return await db.setSettings(settings);
}

export async function createLocalUser(devMode: boolean, passwordHash: string, passwordSalt: string): Promise<void> {
    let user: User = {
        username: "",
        email: "",
        id: "",
        premium: false,
        passwordVerification: base64ToUint8Array(passwordHash),
        passwordSalt: base64ToUint8Array(passwordSalt),
        settings: {
            devMode: devMode,
            autoCommit: true,
            autoPush: true,
            commitIntervalTime: 6000,
            commitMode: "timer",
        }
    } satisfies User;
    await db.createUser(user);
}
