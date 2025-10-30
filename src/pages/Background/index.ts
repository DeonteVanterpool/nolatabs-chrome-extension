import {Commit} from "../models/commit";
import {CDMessageOptions, CommitMessageOptions, Message} from "../models/messages";
import {CommitRepository} from "../repository/commit";
import {CommitService} from "../services/commit";
import "./commands";
import {openWelcomePage} from "./services";
import {BrowserWindow} from "./window";

chrome.runtime.onInstalled.addListener(async () => {
    await openWelcomePage();
});

chrome.windows.onCreated.addListener(async (window) => {
    if (window.type === "normal") { // don't open th epage if the new window is a popup
        await openWelcomePage();
    }
})

chrome.runtime.onMessage.addListener(async (message: Message, sender, sendResponse) => {
    if (message.action === "commit") {
        let options = message.options as CommitMessageOptions;
        let commitRepo = new CommitRepository(chrome.storage.local);
        let commitGraph = await commitRepo.read(options.repo);

        let tabs = await BrowserWindow.getUnpinnedTabs();

        let commits = await CommitService.commit(commitGraph, "me", options.message, tabs, (CommitService.getTips(commitGraph)).map((c) => c.hash));

        await commitRepo.sync(options.repo, commits.graph);
        await BrowserWindow.addAllTabsToGroup(options.repo.name);
        return commits.commit;
    } else if (message.action === "cd") {
        let options = message.options as CDMessageOptions;

        let commits: Map<string, Commit> = await new CommitRepository(chrome.storage.local).read(options.repo);

        await BrowserWindow.clearUnpinnedTabs();
        await BrowserWindow.createTabs(CommitService.buildLatestSnapshot(commits));
        await BrowserWindow.addAllTabsToGroup(options.repo.name);
    }
});

