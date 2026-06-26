import {Message} from "src/models/messages";
import "./commands";
import * as unix from "src/libs/handlers/unix";
import * as user from "src/libs/handlers/user";
import {openWelcomePage} from "src/libs/handlers/welcome";

chrome.runtime.onInstalled.addListener(async () => {
    await openWelcomePage();
});

chrome.windows.onCreated.addListener(async (window) => {
    if (window.type === "normal") { // don't open the page if the new window is a popup
        await openWelcomePage();
    }
});

let messageQueue: Promise<any> = Promise.resolve(); // queue to ensure that messages are processed sequentially, to avoid race conditions

interface CommandRouter {
    [key: string]: (args: string[]) => Promise<any>;
}

const commandRouter = {
    "commit": async (args: string[]) => {
        return await unix.handleCommit(args);
    },
    "edit": async (args: string[]) => {
        return await unix.handleEdit(args);
    },
    "touch": async (args: string[]) => {
        return await unix.handleTouch(args);
    },
    "rm": async (args: string[]) => {
        return await unix.handleRm(args);
    },
    "mv": async (args: string[]) => {
        return await unix.handleMv(args);
    },
} satisfies CommandRouter;

// command handler
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse): boolean => {
    if (sender.origin !== chrome.runtime.id) {
        return false;
    }
    messageQueue.then(async () => {
        switch (message.kind) {
            case "command":
                if (message.action in commandRouter) {
                    sendResponse(await commandRouter[message.action as keyof typeof commandRouter](message.args))
                } else {
                    throw new Error("unrecognized command: " + message.action); // responses come back untyped, so its better to throw here instead of using Result types
                }
                break;
            case "welcome":
                throw new Error("unimplemented");
                // sendResponse(await user.welcome(message.devMode))
                break
            case "checkWelcomeStatus":
                sendResponse(await user.checkWelcomeStatus())
                break;
            default:
                throw new Error("unrecognized message: " + message)
        }
    });
    return true;
});
