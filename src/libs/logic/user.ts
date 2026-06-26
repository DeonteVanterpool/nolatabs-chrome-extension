import {User} from "src/models/user";

export function setDevMode(user: User, devMode: boolean): User {
    user = {...user, settings: {...user.settings, devMode}};
    return user;
}

export function createDefaultUser(id: string, username: string, passwordVerification: string, masterKeySalt: string): User {
    return {
        id,
        username,
        email: "",
        premium: false,
        passwordVerification,
        masterKeySalt,
        settings: {
            devMode: false,
            autoCommit: true,
            commitIntervalTime: 3600,
            commitMode: "timer",
            autoPush: false,
        },
    }
}
