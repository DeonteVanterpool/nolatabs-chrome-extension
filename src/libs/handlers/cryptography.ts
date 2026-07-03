const decoder = new TextDecoder();
const encoder = new TextEncoder();

export function encrypt(text: string): string {
    throw Error("Unimplemented!");
}

export function decrypt(text: string): string {
    throw Error("Unimplemented!");
}

export async function sha2Hash(text: string): Promise<string> {
    return decoder.decode(await crypto.subtle.digest("SHA-256", encoder.encode(text)));
}

export async function sha2Verify(input: string, hash: string): Promise<boolean> {
    return await sha2Hash(input) === hash;
}

export async function argon2Hash(text: Uint8Array, salt: Uint8Array): Promise<string> {
    throw Error("Unimplemented!");
    // return (await argon2.hash({pass: text, salt, time: 3, type: argon2.ArgonType.Argon2id})).encoded;
}

export async function argon2Verify(pass: Uint8Array, encoded: string): Promise<boolean> {
    throw Error("Unimplemented!");
    // return await argon2.verify({encoded, pass: pass}).then(() => true).catch(() => false);
}

export async function argon2HashMasterKey(text: string, salt: string) {
    throw Error("Unimplemented!");
    /*
    const res = (await argon2.hash({
        pass: text,
        salt,
        time: 3,
        hashLen: 64,
        type: argon2.ArgonType.Argon2id
    }));
    const masterKey = res.hash.slice(0, 32);
    const verification = res.hash.slice(32, 64);
    */
}

export function uuid(): string {
    return crypto.randomUUID();
}

export async function handleIsLoggedIn() {
    return !!(await chrome.storage.session.get("masterKey")).masterKey
}

export async function passwordVerify(password: string): Promise<boolean> {
    return argon2Verify(password, (await chrome.storage.session.get("masterKey")).masterKey)
}

export function hookLogin(f: () => void) {
    const handler = (changes: {[key: string]: chrome.storage.StorageChange}) => {
        if (changes["masterKey"]) {
            f();
        }
    };
    chrome.storage.session.onChanged.addListener(handler);
    return () => chrome.storage.session.onChanged.removeListener(handler);
}

