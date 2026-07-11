import init, {argon2_verify_password, argon2_set_password, logged_in, aes_encrypt, aes_decrypt, Packet} from 'src/wasm/crypto/pkg/crypto.js';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

let requireWasm = init();

export async function encrypt(data: Uint8Array, nonce: Uint8Array): Promise<Uint8Array> {
    await requireWasm;
    return aes_encrypt(data, nonce);
}

export async function decrypt(ciphertext: Uint8Array, nonce: Uint8Array): Promise<Packet> {
    await requireWasm;
    return aes_decrypt(ciphertext, nonce);
}

export async function sha2Hash(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
    return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
}

export async function sha2Verify(data: Uint8Array<ArrayBuffer>, hash: Uint8Array): Promise<boolean> {
    const digest = await sha2Hash(data);
    if (digest.length !== hash.length) return false;
    for (let i = 0; i < digest.length; i++) {
        if (digest[i] !== hash[i]) return false;
    }
    return true;
}

// takes in password and salt. Returns a verification key, which can be used with passwordVerify
export async function argon2HashMasterKey(password: Uint8Array, salt: Uint8Array): Promise<Uint8Array> {
    await requireWasm;
    return argon2_set_password(password, salt);
}

export function uuid(): string {
    return crypto.randomUUID();
}

export async function handleIsLoggedIn() {
    await requireWasm;
    return logged_in();
}

export async function passwordVerify(password: Uint8Array, against: Uint8Array, salt: Uint8Array): Promise<boolean> {
    await requireWasm;
    return argon2_verify_password(password, against, salt);
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

export function encode(data: string): Uint8Array {
    return encoder.encode(data);
}

export function decode(data: Uint8Array): string {
    return decoder.decode(data);
}

