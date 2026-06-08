import * as argon2 from 'argon2-browser';

const SALT = "dL%41Ruja1NLtA";

export class Crypto {
    privateKey: string;
    publicKey: string;
    encoder: TextEncoder;
    decoder: TextDecoder;

    constructor() {
        this.privateKey = "";
        this.publicKey = "";
        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder();
    }

    public encrypt(text: string): string {
        throw Error("Unimplemented!");
    }

    public decrypt(text: string): string {
        throw Error("Unimplemented!");
    }

    public async sha2Hash(text: string): Promise<string> {
        return this.decoder.decode(await crypto.subtle.digest("SHA-256", this.encoder.encode(text)));
    }
    
    public async sha2Verify(input: string, hash: string): Promise<boolean> {
        return await this.sha2Hash(input) === hash;
    }

    public async argon2Hash(text: string): Promise<string> {
        return (await argon2.hash({ pass: text, salt: SALT, time: 3, type: argon2.ArgonType.Argon2id})).encoded;
    }
    
    public async argon2Verify(input: string, hash: string): Promise<boolean> {
        return await argon2.verify({encoded: hash, pass: input}).then(() => true).catch(() => false);
    }
}

