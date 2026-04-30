export async function openWelcomePage() {
    if (((await chrome.tabs.query({pinned: true})).filter((tab) => tab.url!.startsWith("chrome-extension://" + chrome.runtime.id + "/frontend.html")).length === 0)) {
        await chrome.tabs.create({
            url: "frontend.html",
            active: true,
            pinned: true,
            index: 0,
        });
    }
}
