import {User} from "../models/user";

export function setDevMode(user: User, devMode: boolean): User {
    user = {...user};
    user.settings.devMode = devMode;
    return user;
}

export function createDefaultUser(name: string, passwordHash: string): User {
    return {
            username: name,
            email: "",
            passwordHash: passwordHash,
            premium: false,
            settings: {
                devMode: false,
                autoCommit: true,
                commitIntervalTime: 3600,
                commitMode: "timer",
                autoPush: false,
            },
    }
}
