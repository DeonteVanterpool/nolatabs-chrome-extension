import {User} from "src/models/user";

export function setDevMode(user: User, devMode: boolean): User {
    user = {...user, settings: {...user.settings, devMode}};
    return user;
}

export function createDefaultUser(id: string, username: string): User {
    return {
        id,
        username,
        email: "",
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
