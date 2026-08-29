export type Message = Command | WelcomeMessage | CheckWelcomeStatusMessage | CloudLoginMessage | LocalLoginMessage | CheckLoggedIn | RenderMermaidMessage | LogOutMessage;

export interface Command {
    kind: "command",
    action: string,
    args: string[],
};

export interface WelcomeMessage {
    kind: "welcome",
    devMode: boolean,
    password: string,
};

export interface RenderMermaidMessage {
    kind: "rendermermaid",
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

export interface LogOutMessage {
    kind: "logout",
};

