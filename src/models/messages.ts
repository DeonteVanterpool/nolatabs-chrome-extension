export type Message = Command | WelcomeMessage | CheckWelcomeStatusMessage | CloudLoginMessage | LocalLoginMessage | CheckLoggedIn;

export interface Command {
    kind: "command",
    action: string,
    args: string[],
};

export interface WelcomeMessage {
    kind: "welcome",
    devMode: boolean,
    passwordHash: string,
    passwordSalt: string,
};

export interface CloudLoginMessage {
    kind: "cloudlogin",
    email: string,
    passwordHash: string,
};

export interface LocalLoginMessage {
    kind: "locallogin",
    password: string,
};

export interface CheckWelcomeStatusMessage {
    kind: "checkWelcomeStatus",
};

export interface CheckLoggedIn {
    kind: "checkLoggedIn",
};

