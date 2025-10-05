export type User = {
    readonly username: string;
    readonly email: string;
    readonly passwordHash: string;
    readonly premium: boolean;
    readonly settings: UserSettings;
}

export type UserSettings = {
    readonly devMode: boolean;
    readonly autoCommit: boolean;
    readonly commitIntervalTime: number; // Time it takes to autosave between commits in millisecond
    readonly commitMode: "smart" | "timer" | "greedy"; // smart: commit whenever idle for 30 second
    readonly autoPush: boolean;
}
