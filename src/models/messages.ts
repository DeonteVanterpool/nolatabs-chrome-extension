export type Message = Command | WelcomeMessage | CheckWelcomeStatusMessage | CloudLoginMessage;

export interface Command {
    kind: "command",
    action: string,
    args: string[],
};

export interface WelcomeMessage {
    kind: "welcome",
    devMode: boolean,
    passwordHash: string,
};

export interface CloudLoginMessage {
    kind: "cloudlogin",
    email: string,
    passwordHash: string,
};

export interface CheckWelcomeStatusMessage {
    kind: "checkWelcomeStatus",
};
