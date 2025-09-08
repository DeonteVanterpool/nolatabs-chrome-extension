export type Settings = SettingsV1; // add future versions here using union types

export type SettingsV1 = {
    devMode: boolean,
    autoCommit: boolean,
    commitIntervalTime: number, // Time it takes to autosave between commits in milliseconds
    commitMode: "smart" | "timer" | "greedy", // smart: commit whenever idle for 30 seconds
    autoPush: boolean,
}

export class SettingsV1Builder {
    settings: SettingsV1;

    public constructor() {
        this.settings = {
            devMode: false,
            autoCommit: false,
            commitIntervalTime: 300000, // 5 minutes
            commitMode: "smart",
            autoPush: false,
        };
    }

    public setDevMode(devMode: boolean): SettingsV1Builder {
        this.settings.devMode = devMode;
        return this;
    }

    public setAutoCommit(autoCommit: boolean): SettingsV1Builder {
        this.settings.autoCommit = autoCommit;
        return this;
    }

    public setCommitIntervalTime(commitIntervalTime: number): SettingsV1Builder {
        this.settings.commitIntervalTime = commitIntervalTime;
        return this;
    }

    public setCommitMode(commitMode: "smart" | "timer" | "greedy"): SettingsV1Builder {
        this.settings.commitMode = commitMode;
        return this;
    }

    public setAutoPush(autoPush: boolean): SettingsV1Builder {
        this.settings.autoPush = autoPush;
        return this;
    }

    public build(): SettingsV1 {
        return this.settings;
    }
}

