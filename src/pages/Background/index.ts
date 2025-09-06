import "./commands";
import {openWelcomePage} from "./services";

chrome.runtime.onInstalled.addListener(async () => {
    await openWelcomePage()
});
