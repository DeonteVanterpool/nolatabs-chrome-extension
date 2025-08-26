chrome.commands.onCommand.addListener((command) => {
    if (command === "command-pallete")
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id as number, { action: "showCommandPallete" });
    });
});

