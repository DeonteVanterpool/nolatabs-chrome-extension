import {Commit} from "../models/commit";
import {CDMessageOptions, CommitMessageOptions, Message} from "../models/messages";
import {Repository} from "../models/repository";
import {Tab} from "../models/tab";
import {CommitRepository} from "../repository/commit";
import {CommitService} from "../services/commit";
import "./commands";
import {openWelcomePage} from "./services";

chrome.runtime.onInstalled.addListener(async () => {
    await openWelcomePage()
});

chrome.runtime.onMessage.addListener(async (message: Message, sender, sendResponse) => {
    console.log(message);
    console.log("no message");
    if (message.action === "commit") {
        console.log("committing");
        let options = message.options as CommitMessageOptions;
        let tabs: Tab[] = (await chrome.tabs.query({lastFocusedWindow: true, pinned: false})).map((tab) => {
            if (!tab.url) {
                return null;
            }
            return {url: tab.url!, title: tab.title ? tab.title : "", favicon: tab.favIconUrl ? tab.favIconUrl : "", pinned: tab.pinned};
        }).filter((tab) => !!tab) as Tab[];
        let cr = new CommitRepository(chrome.storage.local);
        if (CommitService.list(await cr.read(options.repo)).length === 0) {
            let commits = await CommitService.commit(await cr.read(options.repo), "me", options.message, tabs, []);
            await cr.sync(options.repo, commits.graph);
            return commits.commit;
        }
        else {
            let commits = await CommitService.commit(await cr.read(options.repo), "me", options.message, tabs, [CommitService.getTips(await cr.read(options.repo))[0].hash]);
            await cr.sync(options.repo, commits.graph);
            return commits.commit;
        }
    } else if (message.action === "cd") {
        console.log("cding");
        let options = message.options as CDMessageOptions;
        let commits: Map<string, Commit> = await new CommitRepository(chrome.storage.local).read(options.repo);
        let tabs: Tab[] = [];
        if (CommitService.getTips(commits).length !== 0) {
            tabs = CommitService.buildSnapshot(commits, CommitService.getTips(commits)[0].hash);
        }
        let t = await chrome.tabs.query({lastFocusedWindow: true, pinned: false});
        await chrome.tabs.remove(t.map((t) => t.id!));
        tabs.forEach(async (t) => {
            await chrome.tabs.create({url: t.url});
        });
    }
});
