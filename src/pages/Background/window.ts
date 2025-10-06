import {Tab} from "../models/tab";

export class BrowserWindow {
    public static async clearUnpinnedTabs(): Promise<void> {
        let t = await chrome.tabs.query({lastFocusedWindow: true, pinned: false});
        await chrome.tabs.remove(t.map((t) => t.id!)); // clear unpinned tabs
    }
    public static async createTabs(tabs: Tab[]): Promise<void> {
        tabs.forEach(async (t) => {
            await chrome.tabs.create({url: t.url});
        });
    }
    public static async getUnpinnedTabs(): Promise<Tab[]> {
        let tabs: Tab[] = (await chrome.tabs.query({lastFocusedWindow: true, pinned: false})).map((tab) => {
            if (!tab.url) {
                return null;
            }
            return {url: tab.url!, title: tab.title ? tab.title : "", favicon: tab.favIconUrl ? tab.favIconUrl : "", pinned: tab.pinned};
        }).filter((tab) => !!tab) as Tab[];
        return tabs;
    }
}
