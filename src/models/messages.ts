export type Message = Command | WelcomeMessage | CheckWelcomeStatusMessage;

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

export interface CheckWelcomeStatusMessage {
    kind: "checkWelcomeStatus",
};
