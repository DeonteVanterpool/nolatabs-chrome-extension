import * as argon2 from 'argon2-browser';

const SALT = "dL%41Ruja1NLtA";

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

export async function argon2Hash(text: string): Promise<string> {
    return (await argon2.hash({pass: text, salt: SALT, time: 3, type: argon2.ArgonType.Argon2id})).encoded;
}

export async function argon2Verify(input: string, hash: string): Promise<boolean> {
    return await argon2.verify({encoded: hash, pass: input}).then(() => true).catch(() => false);
}

export function uuid(): string {
    return crypto.randomUUID();
}
