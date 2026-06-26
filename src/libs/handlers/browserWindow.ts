import {Tab} from "src/models/git";

export async function clearUnpinnedTabs(windowId: number): Promise<void> {
    let tabs = await chrome.tabs.query({windowId, pinned: false});
    const tabIds = tabs.map((t) => t.id).filter((id) => id !== undefined);

    if (tabIds.length > 0) {
        await chrome.tabs.remove(tabIds);
    }
}

// TODO: create tabs / sync between tab states based on diffs/delta changes for more efficiency
/** Creates new tabs with the given urls. The tabs will be created in the current window and will be inactive. */
export async function createTabs(windowId: number, urls: string[]): Promise<void> {
    for (const url of urls) {
        await chrome.tabs.create({ url, active: false, windowId });
    }
}

/** Returns all unpinned tabs in the current window. */
export async function getUnpinnedTabs(windowId: number): Promise<Tab[]> {

    let tabs: Tab[] = (await chrome.tabs.query({windowId, pinned: false})).map((tab) => {
        if (!tab.url) {
            return null;
        }
        return {url: tab.url!, title: tab.title ? tab.title : "", favicon: tab.favIconUrl ? tab.favIconUrl : "", pinned: tab.pinned};
    }).filter((tab) => !!tab) as Tab[];

    return tabs;
}

/** Adds all unpinned tabs in the current window to a tab group with the given title. If a tab group with the given title already exists, the tabs will be added to that group. Otherwise, a new tab group will be created. */
export async function addAllTabsToGroup(windowId: number, title: string): Promise<void> {
    let tabs = await chrome.tabs.query({windowId, pinned: false});
    let tabIds = tabs.map((t) => t.id!).filter((id) => !!id) as number[];
    let group = (await chrome.tabGroups.query({title: title}));
    let groupPresent = group.length > 0;
    let groupId = groupPresent ? group[0].id : await chrome.tabs.group({tabIds: tabIds}); // create new group if not present

    await chrome.tabs.group({tabIds: tabIds, groupId: groupId});

    if (!groupPresent) {
        await chrome.tabGroups.update(groupId, {title: title});
    }
}

/** Gets the currently focused window. Returns `undefined` if focused window does not have a session id. */
export async function getCurrentlyFocusedWindow(): Promise<chrome.windows.Window> {
    return await chrome.windows.getCurrent();
}

