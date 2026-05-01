import {Commit} from "../models/commit";
import {CDMessageOptions, CommitMessageOptions, LoginMessageOptions, Message, MkDirMessageOptions} from "../models/messages";
import {Repository} from "../models/repository";
import {CommitStore} from "../repository/commit";
import {RepositoryStore} from "../repository/repository";
import {CommitService} from "../services/commit";
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

let password: string | null = null;

// command handler
chrome.runtime.onMessage.addListener(async (message: Message, sender, sendResponse) => {
    if (message.action === "loggedIn") {
        sendResponse(password !== null);
    } else if (message.action === "login") {
        let options = message.options as LoginMessageOptions;
        password = options.password;
    } else if (message.action === "commit") {
        let options = message.options as CommitMessageOptions;
        let commitStore = new CommitStore(chrome.storage.local);
        let commitGraph = await commitStore.read(options.repo);
        let tip = (CommitService.getTips(commitGraph)).map((c) => c.hash); // TODO: actually check where the current commit is / which branch is active instead of just committing on top of all tips
        let tabs = await BrowserWindow.getUnpinnedTabs();

        let commits = await CommitService.commit(commitGraph, "me", options.message, tabs, tip);

        await commitStore.set(options.repo, commits.graph);
        await BrowserWindow.addAllTabsToGroup(options.repo.name);
        sendResponse(commits.commit);
    } else if (message.action === "cd") {
        let options = message.options as CDMessageOptions;

        openRepositoryInWindow(options.repo);
    } else if (message.action === "mkdir") {
        let options = message.options as MkDirMessageOptions;

        await new RepositoryStore(chrome.storage.local).create(options.repo);

        openRepositoryInWindow(options.repo);
    } else if (message.action === "rm") {
        let options = message.options as CDMessageOptions;
        
        await new RepositoryStore(chrome.storage.local).delete(options.repo);
        await BrowserWindow.clearUnpinnedTabs();
    }
});

async function openRepositoryInWindow(repo: Repository) {
    let commits: Map<string, Commit> = await new CommitStore(chrome.storage.local).read(repo);

    await BrowserWindow.clearUnpinnedTabs();
    await BrowserWindow.createTabs(CommitService.buildLatestSnapshot(commits));
    await BrowserWindow.addAllTabsToGroup(repo.name);
}
