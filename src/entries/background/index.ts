import {Message} from "src/models/messages";
import {Repository} from "src/models/repository";
import {RepositoryStore} from "src/libs/repository/repository";
import {CommitService} from "src/libs/services/commit";
import {RepositoryService} from "src/libs/services/repository";
import {UserService} from "src/libs/services/user";
import "./commands";
import {openWelcomePage} from "src/libs/handlers/welcome";
import {BrowserWindow} from "./window";
import {handleCommit} from "src/libs/handlers/commit";

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

let router = {
    "loggedIn": async (args: string[]) => {
        handleCommit(args);
    },
    "login": async (args: string[]) => {
    },
    "commit": async (args: string[]) => {
    },
    "cd": async (args: string[]) => {
    },
    "mkdir": async (args: string[]) => {
    },
    "rm": async (args: string[]) => {
    },
    "mv": async (args: string[]) => {
    },
    "welcomed": async (args: string[]) => {
    },
    "welcome": async (args: string[]) => {
    }
} satisfies CommandRouter;

// command handler
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse): boolean => {
    const hasResponse = ["loggedIn", "commit", "welcomed"].includes(message.action);
    messageQueue.then(async () => {
        const existingContexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT']
        });

        if (existingContexts.length === 0) {
            // Create the hidden window
            await chrome.offscreen.createDocument({
                url: 'crypto.html',
                reasons: ['LOCAL_STORAGE'],
                justification: 'Maintaining secure, persistent cryptographic state.'
            });
        }
        if (message.action === "loggedIn") {
            let pw = await chrome.storage.session.get("password");
            sendResponse(!!pw.password);
        } else if (message.action === "login") {
            await chrome.storage.session.set({password: options.password});
        } else if (message.action === "commit") {
            let tabs = await BrowserWindow.getUnpinnedTabs();

            let commit = await CommitService.commit(chrome.storage.local, options.repo, "me", options.message, tabs, ["main"]);

            sendResponse(commit);
        } else if (message.action === "cd") {
            let options = message.args;
            await RepositoryService.openRepository(chrome.storage.local, options.repo);
        } else if (message.action === "mkdir") {
            let options = message.options as MkDirMessageOptions;
            let repo: Repository = {...options.repo, branches: []}

            await RepositoryStore.create(chrome.storage.local, repo);
        } else if (message.action === "rm") {
            let options = message.options as CDMessageOptions;

            RepositoryService.removeRepository(chrome.storage.local, options.repo);
        } else if (message.action === "mv") {
            let options = message.options as MvMessageOptions;
            let newName = options.newName;

            RepositoryService.moveRepository(chrome.storage.local, options.repo, newName);
        } else if (message.action === "welcomed") {
            sendResponse(await UserService.welcomed(chrome.storage.local));
        } else if (message.action === "welcome") {
            let options = message.options as WelcomeMessageOptions;

            await UserService.welcome(chrome.storage.local, options.password, options.devMode);
        }
    });
    return hasResponse; // TODO: uncomment when this can compile
});
