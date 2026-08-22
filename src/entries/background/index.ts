import {Message, WelcomeMessage} from "src/models/messages";
import "./commands";
import * as unix from "src/libs/handlers/unix";
import * as user from "src/libs/handlers/user";
import {openWelcomePage} from "src/libs/handlers/welcome";
import {fetchMe} from "src/libs/db/storage";
import * as crypto from "src/libs/handlers/cryptography";
import {authenticate} from "src/libs/handlers/local_auth";
import init from 'src/wasm/crypto/pkg/crypto.js';

let url = chrome.runtime.getURL("crypto_bg.wasm");

// we do this to allow the master key to stay in memory for the duration of the entire session. The alternative would be to store in chrome session storage, which means we have to make copy of the master key whenever we need to use it
const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();

console.log("Started at ", new Date())

chrome.runtime.onInstalled.addListener(async () => {
    await openWelcomePage();
});

chrome.windows.onCreated.addListener(async (window) => {
    if (window.type === "normal") { // don't open the page if the new window is a popup
        await openWelcomePage();
    }
});

let messageQueue: Promise<any> = Promise.resolve(); // queue to ensure that messages are processed sequentially, to avoid race conditions

interface CommandRouter {
    [key: string]: (args: string[]) => Promise<any>;
}

const commandRouter = {
    "commit": async (args: string[]) => {
        return await unix.handleCommit(args);
    },
    "edit": async (args: string[]) => {
        return await unix.handleEdit(args);
    },
    "touch": async (args: string[]) => {
        return await unix.handleTouch(args);
    },
    "rm": async (args: string[]) => {
        return await unix.handleRm(args);
    },
    "mv": async (args: string[]) => {
        return await unix.handleMv(args);
    },
    "init": async (args: string[]) => {
        return await unix.handleInit(args);
    },
    "branch": async (args: string[]) => {
        return await unix.handleBranch(args);
    },
    "checkout": async (args: string[]) => {
        return await unix.handleCheckout(args);
    },
    "merge": async (args: string[]) => {
        return await unix.handleMerge(args);
    }
} satisfies CommandRouter;

type Response = any;

const router = async (message: Message) => {
    let response: Response;
    try {
        console.log("Processing message: ", message.kind);
        switch (message.kind) {
            case "command":
                console.log("exucuting command")
                if (message.action in commandRouter) {
                    const res = await commandRouter[message.action as keyof typeof commandRouter](message.args)
                    if (res.isOk) {
                        response = {success: true, ...(res.value as Record<string, unknown> ?? {})};
                    } else {
                        response = {success: false, ...{error: res.error}};
                    }
                    console.log(response);
                } else {
                    response = {success: false, error: "unrecognized command: " + message.action} as Response;
                    console.log(response);
                }
                console.log("exutude")
                chrome.runtime.sendMessage({kind: "hookCommandExecuted", action: message.action, args: message.args, response: response});
                break;
            case "checkLoggedIn":
                const logged = await crypto.isLoggedIn();
                console.log("crypto.isLoggedIn(): " + logged)
                response = {success: logged};
                break;
            case "welcome":
                console.log("Received welcome message: ", message);
                message satisfies WelcomeMessage;
                const passwordSalt = crypto.generateSalt();
                console.log("salting");
                const passwordHash = crypto.uint8ArrayToBase64(await crypto.argon2HashMasterKey(crypto.encode(message.password), passwordSalt));
                console.log("hashing");
                console.log("creating local user");
                await user.createLocalUser(
                    message.devMode,
                    passwordHash,
                    crypto.uint8ArrayToBase64(passwordSalt),
                );
                response = {success: true};
                break
            case "checkWelcomeStatus":
                response = await user.checkWelcomeStatus();
                break;
            case "locallogin":
                const me = await fetchMe();
                const passwordBytes = crypto.encode(message.password);
                console.log("bytes", passwordBytes)
                if (!(await authenticate(passwordBytes))) {
                    response = {success: false, error: "Incorrect password"} as Response;
                    break
                }
                await crypto.argon2HashMasterKey(passwordBytes, me.passwordSalt)
                console.log("Length of encryptedMasterKey: ", me.encryptedMasterKey.length)
                console.log("Length of encryptionKeyNonce: ", me.encryptionKeyNonce.length)
                console.log(me.encryptedMasterKey, me.encryptionKeyNonce)
                await crypto.decrypt_kek(me.encryptedMasterKey, me.encryptionKeyNonce)
                passwordBytes.fill(0);
                chrome.runtime.sendMessage({kind: "hookLoggedIn"})
                response = {success: true}
                break;
            case "rendermermaid":
                const diagram = await unix.renderGraph();
                if (diagram.isOk) {
                    response = {success: true, diagram: diagram.value}
                } else {
                    response = {success: false, error: diagram.error}
                }
                break
            default:
                response = {success: false, error: "unrecognized message: " + message.kind} as Response;
        }
    } catch (error) {
        console.error("Error processing message: ", error);
        response = {success: false, error: "Error processing message: " + (error as Error).message} as Response;
    }
    console.log("Sending response: ", response);
    return response
}

// command handler
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse): boolean | any => {
    console.log("origin", sender.origin)
    console.log("runtime.id", chrome.runtime.id)
    if (sender.origin !== chrome.runtime.id && chrome.runtime.id !== "deonte@asimslaboratory.com") {
        return false;
    }
    console.log("Received message: ", message);
    const isFirefox = typeof browser !== 'undefined';
    if (isFirefox) {
        // Firefox: return a Promise directly
        return (async () => {
            return await router(message);
        })();
    } else {
        // Chrome: use callback-based approach
        messageQueue = messageQueue.then(async () => {
            const response = await router(message);
            sendResponse(response)
        });
        return true;
    }
});

