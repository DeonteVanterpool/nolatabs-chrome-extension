import {Tab} from "src/models/tab";

export async function clearUnpinnedTabs(): Promise<void> {
    let tabs = await chrome.tabs.query({lastFocusedWindow: true, pinned: false});
    const tabIds = tabs.map((t) => t.id).filter((id) => id !== undefined);

    if (tabIds.length > 0) {
        await chrome.tabs.remove(tabIds);
    }
}

/** Creates new tabs with the given urls. The tabs will be created in the current window and will be inactive. */
export async function createTabs(urls: string[]): Promise<void> {
    for (const url of urls) {
        await chrome.tabs.create({ url, active: false });
    }
}

/** Returns all unpinned tabs in the current window. */
export async function getUnpinnedTabs(): Promise<Tab[]> {

    let tabs: Tab[] = (await chrome.tabs.query({lastFocusedWindow: true, pinned: false})).map((tab) => {
        if (!tab.url) {
            return null;
        }
        return {url: tab.url!, title: tab.title ? tab.title : "", favicon: tab.favIconUrl ? tab.favIconUrl : "", pinned: tab.pinned};
    }).filter((tab) => !!tab) as Tab[];

    return tabs;
}

/** Adds all unpinned tabs in the current window to a tab group with the given title. If a tab group with the given title already exists, the tabs will be added to that group. Otherwise, a new tab group will be created. */
export async function addAllTabsToGroup(title: string): Promise<void> {
    let tabs = await chrome.tabs.query({lastFocusedWindow: true, pinned: false});
    let tabIds = tabs.map((t) => t.id!).filter((id) => !!id) as number[];
    let group = (await chrome.tabGroups.query({title: title}));
    let groupPresent = group.length > 0;
    let groupId = groupPresent ? group[0].id : await chrome.tabs.group({tabIds: tabIds}); // create new group if not present

    await chrome.tabs.group({tabIds: tabIds, groupId: groupId});

    if (!groupPresent) {
        await chrome.tabGroups.update(groupId, {title: title});
    }
}
