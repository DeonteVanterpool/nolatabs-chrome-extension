import {User} from "src/models/user";

export function setDevMode(user: User, devMode: boolean): User {
    user = {...user, settings: {...user.settings, devMode}};
    return user;
}

export function createDefaultUser(id: string, username: string, passwordVerification: Uint8Array, masterKeySalt: Uint8Array): User {
    return {
        id,
        username,
        email: "",
        premium: false,
        passwordVerification,
        passwordSalt: masterKeySalt,
        settings: {
            devMode: false,
            autoCommit: true,
            commitIntervalTime: 3600,
            commitMode: "timer",
            autoPush: false,
        },
    }
}
