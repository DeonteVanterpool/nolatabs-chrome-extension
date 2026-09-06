const extensionUrl = chrome.runtime.getURL("frontend.html");

export async function openWelcomePage() {
    if (((await chrome.tabs.query({pinned: true, currentWindow: true, url: `${extensionUrl}*`})).length === 0)) {
        if (((await chrome.tabs.query({pinned: true, currentWindow: true, url: `${extensionUrl}*`})).length === 0)) {
            await chrome.tabs.create({
                url: "frontend.html",
                active: true,
                pinned: true,
                index: 0,
            });
        }
    }
}
