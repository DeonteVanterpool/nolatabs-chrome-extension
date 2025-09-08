export type Settings = SettingsV1; // add future versions here using union types

export type SettingsV1 = {
    devMode: boolean,
    autoCommit: boolean,
    commitIntervalTime: number, // Time it takes to autosave between commits in milliseconds
    commitMode: "smart" | "timer" | "greedy", // smart: commit whenever idle for 30 seconds
    autoPush: boolean,
}

