import {CommitStore} from "../repository/commit";
import {Repository} from "./repository";

type MessageAction = "commit" | "cd" | "mkdir" | "login" | "loggedIn" | "rm" | "mv";
type MessageOptions = {} | CommitMessageOptions;

export interface Message {
    readonly action: MessageAction;
    readonly options: MessageOptions;
};

export type CommitMessageOptions = {
    message: string,
    repo: {owner: string, name: string};
}

export type CDMessageOptions = {
    repo: {owner: string, name: string};
}

export type MkDirMessageOptions = {
    repo: {owner: string, name: string};
}

export type LoginMessageOptions = {
    password: string;
}

export type LoggedInMessageOptions = {}

export class LoginMessage {
    public static new(password: string): LoginMessage {
        let options = {
            password,
        }
        return {
            action: "login",
            options,
        }
    }
}

export class LoggedInMessage {
    public static new(): LoggedInMessage {
        return {
            action: "loggedIn",
            options: {},
        }
    }
}

export class CommitMessage {
    public static new(message: string, r: Repository): CommitMessage {
        let options = {
            message,
            repo: {
                owner: r.owner,
                name: r.name,
            },
        }
        return {
            action: "commit",
            options,
        }
    }
}

export class CDMessage {
    public static new(r: Repository): CDMessage {
        let options = {
            repo: {
                owner: r.owner,
                name: r.name,
            },
        }
        return {
            action: "cd",
            options,
        }
    }
}

export class MkDirMessage {
    public static new(name: string): MkDirMessage {
        let options = {
            repo: {
                owner: "me",
                name: name,
            },
        }
        return {
            action: "mkdir",
            options,
        }
    }
}

export class RmMessage {
    public static new(r: Repository): RmMessage {
        let options = {
            repo: {
                owner: r.owner,
                name: r.name,
            },
        }
        return {
            action: "rm",
            options,
        }
    }
}

export class MVMessage {
    public static new(r: Repository, newName: string): MVMessage {
        let options = {
            repo: {
                owner: r.owner,
                name: r.name,
            },
            newName,
        }
        return {
            action: "mv",
            options,
        }
    }
}

export type MVMessageOptions = {
    repo: {owner: string, name: string};
    newName: string;
}
