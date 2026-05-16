import {CDMessageOptions, CommitMessageOptions, LoginMessageOptions, Message, MkDirMessageOptions, MVMessageOptions} from "../models/messages";
import {Repository} from "../models/repository";
import {RepositoryStore} from "../repository/repository";
import {CommitService} from "../services/commit";
import {RepositoryService} from "../services/repository";
import "./commands";
import {openWelcomePage} from "./services";
import {BrowserWindow} from "./window";

chrome.runtime.onInstalled.addListener(async () => {
    await openWelcomePage();
});

chrome.windows.onCreated.addListener(async (window) => {
    if (window.type === "normal") { // don't open the page if the new window is a popup
        await openWelcomePage();
    }
});

let messageQueue: Promise<any> = Promise.resolve(); // queue to ensure that messages are processed sequentially, to avoid race conditions

// command handler
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse): boolean => {
    const hasResponse = ["loggedIn", "commit"].includes(message.action);
    messageQueue.then(async () => {
        if (message.action === "loggedIn") {
            let pw = await chrome.storage.session.get("password");
            sendResponse(!!pw.password);
        } else if (message.action === "login") {
            let options = message.options as LoginMessageOptions;
            await chrome.storage.session.set({password: options.password});
        } else if (message.action === "commit") {
            let options = message.options as CommitMessageOptions;
            let tabs = await BrowserWindow.getUnpinnedTabs();

            console.log("Raorestn")

            let commit = await CommitService.commit(chrome.storage.local, options.repo, "me", options.message, tabs, ["main"]);

            sendResponse(commit);
        } else if (message.action === "cd") {
            let options = message.options as CDMessageOptions;
            await RepositoryService.openRepository(chrome.storage.local, options.repo);
        } else if (message.action === "mkdir") {
            let options = message.options as MkDirMessageOptions;
            let repo: Repository = { ...options.repo, branches: [] }

            await RepositoryStore.create(chrome.storage.local, repo);
        } else if (message.action === "rm") {
            let options = message.options as CDMessageOptions;

            RepositoryService.removeRepository(chrome.storage.local, options.repo);
        } else if (message.action === "mv") {
            let options = message.options as MVMessageOptions;
            let newName = options.newName;

            RepositoryService.moveRepository(chrome.storage.local, options.repo, newName);
        }
    });
    return hasResponse;
});
