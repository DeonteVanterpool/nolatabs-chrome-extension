type LATEST_SETTINGS = SettingsV1;
export type Settings = SettingsV1; // add future versions here using union types

/** This is the settings item that will be stored in chrome.storage. Never build settings objects directly, always use the builder
 * See `documentation/updating_schemas.md` for guidance on how to make changes the storage schema.
 */
export type SettingsV1 = {
    devMode: boolean,
    autoCommit: boolean,
    commitIntervalTime: number, // Time it takes to autosave between commits in milliseconds
    commitMode: "smart" | "timer" | "greedy", // smart: commit whenever idle for 30 seconds
    autoPush: boolean,
}

export class SettingsBuilder {
    settings: LATEST_SETTINGS;

    public constructor() {
        this.settings = {
            devMode: false,
            autoCommit: false,
            commitIntervalTime: 300000, // 5 minutes
            commitMode: "smart",
            autoPush: false,
        };
    }

    public setDevMode(devMode: boolean): SettingsBuilder {
        this.settings.devMode = devMode;
        return this;
    }

    public setAutoCommit(autoCommit: boolean): SettingsBuilder {
        this.settings.autoCommit = autoCommit;
        return this;
    }

    public setCommitIntervalTime(commitIntervalTime: number): SettingsBuilder {
        this.settings.commitIntervalTime = commitIntervalTime;
        return this;
    }

    public setCommitMode(commitMode: "smart" | "timer" | "greedy"): SettingsBuilder {
        this.settings.commitMode = commitMode;
        return this;
    }

    public setAutoPush(autoPush: boolean): SettingsBuilder {
        this.settings.autoPush = autoPush;
        return this;
    }

    public build(): SettingsV1 {
        return this.settings;
    }
}

