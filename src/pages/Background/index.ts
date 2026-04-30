import {Commit} from "../models/commit";
import {CDMessageOptions, CommitMessageOptions, LoginMessageOptions, Message, MkDirMessageOptions} from "../models/messages";
import {Repository} from "../models/repository";
import {CommitRepository} from "../repository/commit";
import {RepositoryRepository} from "../repository/repository";
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
        return password !== null;
    } else if (message.action === "login") {
            let options = message.options as LoginMessageOptions;
            password = options.password;
    } else if (message.action === "commit") {
        let options = message.options as CommitMessageOptions;
        let commitRepo = new CommitRepository(chrome.storage.local);
        let commitGraph = await commitRepo.read(options.repo);

        let tabs = await BrowserWindow.getUnpinnedTabs();

        let commits = await CommitService.commit(commitGraph, "me", options.message, tabs, (CommitService.getTips(commitGraph)).map((c) => c.hash));

        await commitRepo.sync(options.repo, commits.graph);
        await BrowserWindow.addAllTabsToGroup(options.repo.name);
        sendResponse(commits.commit);
        return commits.commit;
    } else if (message.action === "cd") {
        let options = message.options as CDMessageOptions;

        changeDirectory(options.repo);
    } else if (message.action === "mkdir") {
            let options = message.options as MkDirMessageOptions;
            let repo = options.repo;

            await new RepositoryRepository(chrome.storage.local).create(repo);

            changeDirectory(repo);
    }
});

async function changeDirectory(repo: Repository) {
    let commits: Map<string, Commit> = await new CommitRepository(chrome.storage.local).read(repo);

    await BrowserWindow.clearUnpinnedTabs();
    await BrowserWindow.createTabs(CommitService.buildLatestSnapshot(commits));
    await BrowserWindow.addAllTabsToGroup(repo.name);
}
