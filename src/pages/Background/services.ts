export async function openWelcomePage() {
    if ((await chrome.tabs.query({index: 0}))[0].url !== "frontend.html") {
        await chrome.tabs.create({
            url: "frontend.html",
            active: true,
            pinned: true,
            index: 0,
        });
    }
}
