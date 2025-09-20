export class User {
    username: string;
    email: string;
    passwordHash: string;
    premium: boolean;
    settings: UserSettings;

    constructor(
        username: string,
        email: string,
        passwordHash: string,
        premium: boolean,
        settings: UserSettings,
    ) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.premium = premium;
        this.settings = settings;
    }

}

export class UserSettings {
    devMode: boolean;
    autoCommit: boolean;
    commitIntervalTime: number; // Time it takes to autosave between commits in millisecond
    commitMode: "smart" | "timer" | "greedy"; // smart: commit whenever idle for 30 second
    autoPush: boolean;

    constructor(
        devMode: boolean,
        autoCommit: boolean,
        commitIntervalTime: number, // Time it takes to autosave between commits in millisecond,
        commitMode: "smart" | "timer" | "greedy", // smart: commit whenever idle for 30 second,
        autoPush: boolean,
    ) {
        this.devMode = devMode;
        this.autoCommit = autoCommit;
        this.commitIntervalTime = commitIntervalTime;
        this.commitMode = commitMode;
        this.autoPush = autoPush;
    }
}

