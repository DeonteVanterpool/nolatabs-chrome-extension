import * as crypto from './cryptography';
import * as db from '../db/storage';
import {createDefaultUser, setDevMode} from '../logic/user';

export async function authenticate(password: Uint8Array): Promise<boolean> {
    let me = await db.fetchMe();
    return await crypto.passwordVerify(password, me.passwordVerification, me.passwordSalt);
}

export async function isLoggedIn(): Promise<boolean> {
    return await crypto.isLoggedIn();
}

export async function signup(devMode: boolean, password: Uint8Array): Promise<void> {
    const salt = crypto.generateSalt();
    const passwordHash = await crypto.argon2HashMasterKey(password, salt);
    let user = createDefaultUser(crypto.uuid(), "me", passwordHash, salt);

    user = setDevMode(user, devMode);
    await db.createUser(user);
}

