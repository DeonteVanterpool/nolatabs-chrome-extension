export type User = {
    readonly id: string; // uuid
    readonly username: string;
    readonly email: string;
    readonly premium: boolean;
    readonly settings: UserSettings;
    readonly passwordVerification: Uint8Array; // this key needs to be strong (use a kdf function), and a second hash used to verify the password (separate from the master key)
    readonly encryptionKeyNonce: Uint8Array; // this nonce is used to encrypt the master key, which is used to encrypt the data
    readonly passwordSalt: Uint8Array;
    readonly encryptedMasterKey: Uint8Array; // this key is used to encrypt the master key, which is used to encrypt the data
}

export type CommitMode = "smart" | "timer" | "greedy"; // smart: commit whenever idle for 30 second

export type UserSettings = {
    readonly devMode: boolean;
    readonly autoCommit: boolean;
    readonly commitIntervalTime: number; // Time it takes to autosave between commits in millisecond
    readonly commitMode: CommitMode;
    readonly autoPush: boolean;
}
