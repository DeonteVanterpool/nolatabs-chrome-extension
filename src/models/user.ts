export type User = {
    readonly id: string; // uuid
    readonly username: string;
    readonly email: string;
    readonly passwordHash: string;
    readonly premium: boolean;
    readonly settings: UserSettings;
    readonly publicKey: string,
    readonly privateKey: string,
}

export type UserSettings = {
    readonly devMode: boolean;
    readonly autoCommit: boolean;
    readonly commitIntervalTime: number; // Time it takes to autosave between commits in millisecond
    readonly commitMode: "smart" | "timer" | "greedy"; // smart: commit whenever idle for 30 second
    readonly autoPush: boolean;
}
