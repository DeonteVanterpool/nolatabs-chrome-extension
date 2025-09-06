import {openWelcomePage} from "./services";

chrome.commands.onCommand.addListener((command) => {
    if (command === "command-pallete") {
        chrome.tabs.query({index: 0}, (tab) => {
            let id: number = tab[0].id!;
            chrome.tabs.update(id, {active: true});
        });
    }
});

