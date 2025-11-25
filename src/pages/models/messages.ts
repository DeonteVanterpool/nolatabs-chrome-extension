import {CommitRepository} from "../repository/commit";
import {Repository} from "./repository";

type MessageAction = "commit" | "cd";
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
