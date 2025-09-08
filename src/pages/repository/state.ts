import { SettingsV1 } from './settings';

export const LATEST = 1;
export type State = StateV1; // add future versions here using union types

export type StateV1 = {
    username: string,
    email: string | null,
    passwordHash: string,
    premiumUser: boolean,
    settings: SettingsV1,
}

export class StateFactory {
    public static create(username: string, email: string, passwordHash: string, premiumUser: boolean, settings: SettingsV1, version: number): State {
        switch (version) {
            case 1:
                return StateV1Factory.create(username, email, passwordHash, premiumUser, settings as SettingsV1);
            default:
                throw Error("Unsupported state version " + version);
        }
    }
}

export class StateV1Factory {
    public static create(username: string, email: string, passwordHash: string, premiumUser: boolean, settings: SettingsV1): StateV1 {
        return {
            username: username,
            email: email,
            passwordHash: passwordHash,
            premiumUser: premiumUser,
            settings: settings,
        };
    }
}

