import { SettingsV1 } from './settings';

export const LATEST = 1;
export type StateBuilder = StateV1Builder;
export type State = StateV1; // add future versions here using union types

/** This is the state item that will be stored in chrome.storage. Never build state objects directly, always use the builder
 * See `documentation/updating_schemas.md` for guidance on how to make changes the storage schema.
 */
export type StateV1 = {
    username: string,
    email: string,
    passwordHash: string,
    premiumUser: boolean,
    settings: SettingsV1,
    schemaVersion: 1,
}

export class StateV1Builder {

    state: StateV1;

    public constructor(username: string, email: string, passwordHash: string, settings: SettingsV1) {
        this.state = {
            username: username,
            email: email,
            passwordHash: passwordHash,
            premiumUser: false,
            settings: settings,
            schemaVersion: 1,
        };
    }

    public setPremiumUser(premiumUser: boolean): StateV1Builder {
        this.state.premiumUser = premiumUser;
        return this;
    }

    public build(): StateV1 {
        return this.state;
    }
}

