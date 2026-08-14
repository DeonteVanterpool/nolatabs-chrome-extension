import {Result} from "true-myth";
import * as db from "../db/storage";
import {User, UserSettings} from "src/models/user";
import {ok} from "true-myth/result";
import {base64ToUint8Array} from "./cryptography";
import * as crypto from "./cryptography";

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
    const nonce = crypto.generateSalt(12);
    console.log("Creating local user with devMode:", devMode, "passwordHash:", passwordHash, "passwordSalt:", passwordSalt, "nonce:", nonce);
    let user: User = {
        username: "",
        email: "",
        id: "",
        premium: false,
        passwordVerification: base64ToUint8Array(passwordHash),
        passwordSalt: base64ToUint8Array(passwordSalt),
        encryptedMasterKey: await crypto.encrypt_kek(crypto.generateSalt(32), nonce),
        encryptionKeyNonce: nonce,
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
