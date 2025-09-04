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

    public sha1(text: string): string {
        throw Error("Unimplemented!");
    }
}

