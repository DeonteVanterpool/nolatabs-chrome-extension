export class Crypto {
    privateKey: string;
    publicKey: string;

    constructor() {
        this.privateKey = "";
        this.publicKey = "";
    }

    public encrypt(text: string): string {
        throw Error("Unimplemented!");
    }

    public decrypt(text: string): string {
        throw Error("Unimplemented!");
    }

    public sha1Hash(text: string): string {
        throw Error("Unimplemented!");
    }
    
    public sha1Verify(input: string, hash: string): boolean {
        return this.sha1Hash(input) === hash;
    }
}

