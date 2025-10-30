import {Tab} from "../models/tab";

export class BrowserWindow {
    public static async clearUnpinnedTabs(): Promise<void> {
        let t = await chrome.tabs.query({lastFocusedWindow: true, pinned: false});
        await chrome.tabs.remove(t.map((t) => t.id!)); // clear unpinned tabs
    }
    public static async createTabs(tabs: Tab[]): Promise<void> {
        let tabIds = await Promise.all(tabs.map(async (t) => {
            return (await chrome.tabs.create({url: t.url, active: false})).id!
        }));
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
    public static async addAllTabsToGroup(title: string): Promise<void> {
        let tabs = await chrome.tabs.query({lastFocusedWindow: true, pinned: false});
        let tabIds = tabs.map((t) => t.id!).filter((id) => !!id) as number[];
        let group = (await chrome.tabGroups.query({title: title}));
        let groupPresent = group.length > 0;
        let groupId = groupPresent ? group[0].id : await chrome.tabs.group({tabIds: tabIds}); // create new group if not present
        await chrome.tabs.group({ tabIds: tabIds, groupId: groupId});
        if (!groupPresent) {
            await chrome.tabGroups.update(groupId, {title: title});
        }
    }
}
