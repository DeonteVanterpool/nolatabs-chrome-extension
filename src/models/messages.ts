export type Message = AccountMessage | CommandPaletteMessage | WelcomeMessage;

export type AccountMessage = {
    action: "loggedIn" | "login",
}

export type WelcomeMessage = {
    action: "welcome",
    password: string,
    devMode: boolean,
}

export type WelcomeStatusMessage = {
    action: "checkWelcomeStatus",
}

export type CommandPaletteMessage = {
    action: "mkdir" | "cd" | "rm" | "mv" | "commit",
    args: string[],
};
