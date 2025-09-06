export async function openWelcomePage() {
    chrome.tabs.create({
        url: "frontend.html",
        active: true,
        pinned: true,
        index: 0,
    });
}
