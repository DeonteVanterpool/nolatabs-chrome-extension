// On command-palette shortcut, open the extension
chrome.commands.onCommand.addListener((command) => {
    if (command === "command-pallete") {
        chrome.tabs.query({pinned: true, currentWindow: true, url: `chrome-extension://${chrome.runtime.id}/*`}, (tab) => {
            let id: number = tab[0].id!;
            chrome.tabs.update(id, {active: true});
        });
    }
});

