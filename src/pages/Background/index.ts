import {Commit} from "../models/commit";
import {CDMessageOptions, CommitMessageOptions, LoginMessageOptions, Message, MkDirMessageOptions, MVMessageOptions} from "../models/messages";
import {Repository} from "../models/repository";
import {CommitStore} from "../repository/commit";
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

let messageQueue: Promise<any> = Promise.resolve();

// command handler
chrome.runtime.onMessage.addListener((message: Message, sender): Promise<any> => {
    return messageQueue = messageQueue.then(async () => {
        if (message.action === "loggedIn") {
            return (await chrome.storage.session.get("password")) !== null;
        } else if (message.action === "login") {
            let options = message.options as LoginMessageOptions;
            await chrome.storage.session.set({password: options.password});
        } else if (message.action === "commit") {
            let options = message.options as CommitMessageOptions;
            let repo = await RepositoryService.getRepository(options.repo.name, options.repo.owner)(chrome.storage.local);
            let tabs = await BrowserWindow.getUnpinnedTabs();

            let action = await CommitService.commit(repo, "me", options.message, tabs, [await RepositoryService.getBranch(repo, "main")]);

            let commit = await action(chrome.storage.local);
            await BrowserWindow.addAllTabsToGroup(options.repo.name);
            return commit;
        } else if (message.action === "cd") {
            let options = message.options as CDMessageOptions;
            let repo = await RepositoryService.getRepository(options.repo.name, options.repo.owner)(chrome.storage.local);

            openRepositoryInWindow(repo);
        } else if (message.action === "mkdir") {
            let options = message.options as MkDirMessageOptions;
            let repo = await RepositoryService.getRepository(options.repo.name, options.repo.owner)(chrome.storage.local);

            await RepositoryStore.create(chrome.storage.local, repo);

            openRepositoryInWindow(repo);
        } else if (message.action === "rm") {
            let options = message.options as CDMessageOptions;
            let repo = await RepositoryService.getRepository(options.repo.name, options.repo.owner)(chrome.storage.local);

            await RepositoryStore.delete(chrome.storage.local, repo);
        } else if (message.action === "mv") {
            let options = message.options as MVMessageOptions;
            let repo = await RepositoryService.getRepository(options.repo.name, options.repo.owner)(chrome.storage.local);
            let newName = options.newName;
            let commits = await CommitStore.read(chrome.storage.local, repo);
            console.log(commits);
            console.log("mv " + repo.name + " to " + newName);

            await RepositoryStore.create(chrome.storage.local, {name: newName, branches: repo.branches, owner: repo.owner});
            await CommitStore.set(chrome.storage.local, {name: newName, owner: repo.owner}, commits);
            await RepositoryStore.delete(chrome.storage.local, repo);
            await CommitStore.delete(chrome.storage.local, repo);
            openRepositoryInWindow({name: newName, branches: repo.branches, owner: repo.owner});
        }
    })
});

async function openRepositoryInWindow(repo: Repository) {
    let commits = await CommitStore.read(chrome.storage.local, repo);

    await BrowserWindow.clearUnpinnedTabs();
    await BrowserWindow.createTabs(CommitService.buildLatestSnapshot(commits));
    await BrowserWindow.addAllTabsToGroup(repo.name);
}

