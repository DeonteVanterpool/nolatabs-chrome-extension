import {Commit} from 'src/models/git';
import * as git from 'src/libs/logic/git';
import {CommitHashInput} from 'src/libs/logic/git';
import {Repository} from 'src/models/git';
import * as state from 'src/libs/db/state';
import * as db from 'src/libs/db/storage';
import * as helpers from 'src/libs/helpers';
import {Result, Unit} from 'true-myth';
import {err, ok} from 'true-myth/result';
import {createCommit, defaultCommitGraph, calculateDifference, buildSnapshot} from 'src/libs/logic/git';
import * as browserWindow from 'src/libs/handlers/browserWindow';
import * as crypto from './cryptography';

// match any string
const stringRegex = /.+/;
const repoNameRegex = /^[\w.\-/]+$/

// COMMANDS:
/** Creates a new commit with the given author, message, and tabs, and updates the branch pointer to point to the new commit.
* args: [message: string] */
export async function handleCommit(args: string[]): Promise<Result<Commit, string>> {
    const currentWindowId = (await browserWindow.getCurrentlyFocusedWindow()).id;
    if (!currentWindowId) {
        return err("no currently focused window id?")
    }
    // input validation
    if (args.length < 1 || args[0].trim() === "") {
        return err("Not enough arguments provided for commit command. Expected at least 1 arguments: commit <message>");
    }
    if (!stringRegex.test(args[0])) {
        return err("Invalid commit message. Message must be a non-empty string.");
    }

    // parse arguments
    const message = args[0];

    // prepare inputs for commit creation
    const timestamp = new Date();
    const repoId = (await helpers.getCurrentlyFocusedRepoId());
    if (repoId.isErr) {
        return err(repoId.error);
    }
    const [me, tabs, currentlyOpenedBranchId] = await Promise.all([
        db.fetchMe(),
        browserWindow.getUnpinnedTabs(currentWindowId),
        state.fetchCurrentlyOpenedBranchForRepo(repoId.value)
    ]);

    const parent = await db.readBranchTip(currentlyOpenedBranchId);
    if (parent.isErr) {
        return err(parent.error);
    }
    const parents = parent.value ? [parent.value] : [];

    const commitGraph = defaultCommitGraph(await db.readCommits(repoId.value));

    const hashInput = new CommitHashInput(me.id, message, timestamp, tabs, parents);
    console.log("hash: ", hashInput.stringify())
    const hash = await crypto.sha2Hash(crypto.encode(hashInput.stringify()) as Uint8Array<ArrayBuffer>);

    // create the commit
    const snapshotReader = (hash: string) => buildSnapshot(commitGraph, hash)
    const difference = calculateDifference(parents, tabs, snapshotReader);
    const newCommit = createCommit(crypto.decode(hash), me.id, timestamp, message, difference, parents);

    // update storage
    await db.saveCommitAndUpdateBranch(repoId.value, newCommit, currentlyOpenedBranchId);

    return ok(newCommit);
}

export async function handleInit(args: string[]): Promise<Result<Unit, string>> {
    // input validation
    if (args.length < 1 || args[0].trim() === "") {
        return err("Not enough arguments provided for init command. Expected at least 1 arguments: init <repoName>");
    }
    if (!repoNameRegex.test(args[0])) {
        return err("Invalid repo name. Message must contain only alpha numeric characters and hyphens");
    }

    const repoName = args[0]

    const initResult = await init(repoName);
    if (initResult.isErr) {
        return err(initResult.error);
    }

    return ok();
}

export async function init(repoName: string): Promise<Result<Unit, string>> {
    const [currentWindow, me] = await Promise.all([await browserWindow.getCurrentlyFocusedWindow(), await db.fetchMe()]);
    console.log("currentwindow: ", currentWindow)
    if (!currentWindow.id) {
        return err("no currently focused window id?")
    }
    if (!currentWindow.sessionId) {
        console.log("no currently focused session id?")
    }
    const repoId = crypto.uuid()
    const branchId = crypto.uuid()

    console.log("creating repo")
    const repo = git.createRepository(repoId, repoName, me.id);
    console.log("creating branch")
    const branch = git.createBranch(branchId, "main", repoId)

    console.log("creating repo in db")
    await db.createRepository(repo);
    console.log("creating branch in db")
    await db.upsertBranch(branch.id, repoId, branch.name, branch.tipHash);
    console.log("creating window state in db")
    await state.createWindowStateForRepo(currentWindow.id, currentWindow.sessionId ?? null, repoId, branchId);
    return ok();
}

export async function handleMerge(args: string[]): Promise<Result<Unit, string>> {
    // input validation
    if (args.length < 1 || args[0].trim() === "") {
        return err("Not enough arguments provided for merge command. Expected at least 1 arguments: merge <branchName>");
    }
    if (!stringRegex.test(args[0])) {
        return err("Invalid branch name. Message must be a non-empty string.");
    }

    const branchName = args[0]

    return await merge(branchName);
}

export async function merge(branchName: string): Promise<Result<Unit, string>> {
    const repoIdRes = await helpers.getCurrentlyFocusedRepoId();
    if (repoIdRes.isErr) {
        return err(repoIdRes.error);
    }
    const repoId = repoIdRes.value;

    const branchIdRes = await db.fetchBranchIdByName(repoId, branchName);
    if (branchIdRes.isErr) {
        return err(branchIdRes.error);
    }
    const branchId = branchIdRes.value;
    console.log("merging branch: ", branchName, "branchId: ", branchId, "repoId: ", repoId)

    const currentlyOpenedBranchId = await state.fetchCurrentlyOpenedBranchForRepo(repoId);
    if (!currentlyOpenedBranchId) {
        return err("No branch is currently opened for this repo");
    }

    const currentlyOpenedBranchTipRes = await db.readBranchTip(currentlyOpenedBranchId);
    if (currentlyOpenedBranchTipRes.isErr) {
        return err(currentlyOpenedBranchTipRes.error);
    }
    const currentlyOpenedBranchTip = currentlyOpenedBranchTipRes.value;

    const branchToMergeTipRes = await db.readBranchTip(branchId);
    if (branchToMergeTipRes.isErr) {
        return err(branchToMergeTipRes.error);
    }
    const branchToMergeTip = branchToMergeTipRes.value;

    if (!currentlyOpenedBranchTip || !branchToMergeTip) {
        return err("Cannot merge branches with no commits");
    }

    const commitGraph = defaultCommitGraph(await db.readCommits(repoId));

    const snapshotReader = (hash: string) => buildSnapshot(commitGraph, hash)
    const currentlyOpenedBranchSnapshot = snapshotReader(currentlyOpenedBranchTip);
    const branchToMergeSnapshot = snapshotReader(branchToMergeTip);

    const mergedTabs = [...new Set([...currentlyOpenedBranchSnapshot, ...branchToMergeSnapshot])];

    console.log("merged tabs:", mergedTabs)

    const mergedTabsDiff = calculateDifference([currentlyOpenedBranchTip, branchToMergeTip], mergedTabs, snapshotReader);

    console.log("merged tabs diff:", mergedTabsDiff)
    const timestamp = new Date();
    const me = await db.fetchMe();
    const message = `Merge branch '${branchName}' into '${(await db.fetchBranchById(currentlyOpenedBranchId)).map(b => b.name).unwrapOr("unknown") ?? "unknown"}'`;

    const parents = [currentlyOpenedBranchTip, branchToMergeTip];
    console.log("parents", parents)

    const hashInput = new CommitHashInput(me.id, message, timestamp, mergedTabs, parents);
    console.log("hash: ", hashInput.stringify())
    const hash = await crypto.sha2Hash(crypto.encode(hashInput.stringify()) as Uint8Array<ArrayBuffer>);

    // create the commit
    const newCommit = createCommit(crypto.decode(hash), me.id, timestamp, message, mergedTabsDiff, parents);

    console.log("commit", newCommit);

    // update storage
    await db.saveCommitAndUpdateBranch(repoId, newCommit, currentlyOpenedBranchId);

    return ok();
}

/** command to change directory into a repo
* args: [repoName: string] **/
export async function handleEdit(args: string[]): Promise<Result<Unit, string>> {
    const currentlyOpenedRepositoryPromise = helpers.getCurrentlyFocusedRepoId();
    // input validation
    if (args.length < 1 || args[0].trim() === "") {
        return err("Not enough arguments provided for edit command. Expected at least 1 arguments: edit <repoName>");
    }

    // parse arguments
    const repoName: string = args[0];

    const [repoId, currentlyOpenedRepository] = await Promise.all([db.fetchRepositoryIdByName(repoName), currentlyOpenedRepositoryPromise]);
    if (repoId.isErr) {
        return err(repoId.error);
    }
    if (!currentlyOpenedRepository.isErr) {
        if (repoId.value === currentlyOpenedRepository.value) {
            return err("repo is already open");
        }
    }

    // edit the repo
    await edit(repoId.value);

    return ok();
}

/** command to remove a repository
 * args: [repoName: string] **/
export async function handleRm(args: string[]) {
    const currentlyOpenedRepositoryPromise = helpers.getCurrentlyFocusedRepoId();
    // input validation
    if (args.length < 1 || args[0].trim() === "") {
        return err("Not enough arguments provided for rm command. Expected at least 1 arguments: rm <repoName>");
    }

    // parse arguments
    const repoName: string = args[0];

    const [repoId, currentlyOpenedRepository] = await Promise.all([db.fetchRepositoryIdByName(repoName), currentlyOpenedRepositoryPromise]);
    if (repoId.isErr) {
        return err(repoId.error);
    }
    if (currentlyOpenedRepository.isErr) {
        return err(currentlyOpenedRepository.error);
    }

    await state.deleteRepository(repoId.value);
    await db.deleteRepository(repoId.value);

    return ok()
}

/** command to move/rename a repository
 * args: [repoName: string] **/
export async function handleMv(args: string[]) {
    const currentlyOpenedRepositoryPromise = helpers.getCurrentlyFocusedRepoId();
    // input validation
    if (args.length < 2 || args[0].trim() === "") {
        return err("Not enough arguments provided for rm command. Expected at least 1 arguments: rm <repoName>");
    }

    // parse arguments
    const repoName: string = args[0];
    const newName: string = args[1];

    const [repoId, currentlyOpenedRepository] = await Promise.all([db.fetchRepositoryIdByName(repoName), currentlyOpenedRepositoryPromise]);
    if (repoId.isErr) {
        return err(repoId.error);
    }
    if (currentlyOpenedRepository.isErr) {
        return err(currentlyOpenedRepository.error);
    }

    await db.renameRepository(repoId.value, newName);

    return ok()
}

/** command to create a new repository
 * args: [repoName: string] **/
export async function handleTouch(args: string[]): Promise<Result<string, string>> {
    // input validation
    console.log("handleTouch", args);
    if (args.length < 1 || args[0].trim() === "") {
        return err("Not enough arguments provided for touch command. Expected at least 1 arguments: touch <repoName>");
    }
    if (!repoNameRegex.test(args[0])) {
        return err("Invalid repo name. Message must contain only alpha numeric characters and hyphens");
    }

    const repoName = args[0]

    return await touch(repoName);
}

export async function handleBranch(args: string[]): Promise<Result<string, string>> {
    // input validation
    console.log("handleBranch", args);
    if (args.length < 1 || args[0].trim() === "") {
        return err("Not enough arguments provided for branch command. Expected at least 1 arguments: branch <branchName>");
    }
    if (!stringRegex.test(args[0])) {
        return err("Invalid branch name. Message must be a non-empty string.");
    }

    const branchName = args[0]

    return await branch(branchName);
}

export async function branch(branchName: string): Promise<Result<string, string>> {
    console.log("branch", branchName);
    const [currentWindow] = await Promise.all([await browserWindow.getCurrentlyFocusedWindow(), await db.fetchMe()]);
    if (!currentWindow.id) {
        return err("no currently focused window id?")
    }
    if (!currentWindow.sessionId) {
        console.log("no currently focused session id?")
    }
    const repoIdRes = await helpers.getCurrentlyFocusedRepoId();
    if (repoIdRes.isErr) {
        return err(repoIdRes.error);
    }
    const repoId = repoIdRes.value;

    const branchId = crypto.uuid()

    console.log("creating branch")
    const branch = git.createBranch(branchId, branchName, repoId)

    const currentlyOpenedBranchId = await state.fetchCurrentlyOpenedBranchForRepo(repoId);
    const currentlyOpenedBranchTipRes = await db.readBranchTip(currentlyOpenedBranchId);
    let currentlyOpenedBranchTip;
    if (currentlyOpenedBranchTipRes.isErr) {
        console.log("error reading currently opened branch tip: ", currentlyOpenedBranchTipRes.error)
        currentlyOpenedBranchTip = null;
    } else {
        currentlyOpenedBranchTip = currentlyOpenedBranchTipRes.value;
    }

    await db.upsertBranch(branch.id, repoId, branch.name, currentlyOpenedBranchTip);

    return ok(branchId)
}

export async function handleCheckout(args: string[]): Promise<Result<Unit, string>> {
    // input validation
    console.log("handleCheckout", args);
    if (args.length < 1 || args[0].trim() === "") {
        return err("Not enough arguments provided for checkout command. Expected at least 1 arguments: checkout <branchName>");
    }
    if (!stringRegex.test(args[0])) {
        return err("Invalid branch name. Message must be a non-empty string.");
    }

    const branchName = args[0]

    return await checkout(branchName);
}

export async function checkout(branchName: string): Promise<Result<Unit, string>> {
    console.log("checkout", branchName);
    const [currentWindow] = await Promise.all([await browserWindow.getCurrentlyFocusedWindow(), await db.fetchMe()]);
    if (!currentWindow.id) {
        return err("no currently focused window id?")
    }
    if (!currentWindow.sessionId) {
        console.log("no currently focused session id?")
    }
    const repoIdRes = await helpers.getCurrentlyFocusedRepoId();
    if (repoIdRes.isErr) {
        return err(repoIdRes.error);
    }
    const repoId = repoIdRes.value;

    console.log(branchName)
    const branchIdRes = await db.fetchBranchIdByName(repoId, branchName);
    if (branchIdRes.isErr) {
        return err(branchIdRes.error);
    }
    const branchId = branchIdRes.value;

    console.log("checking out branch: ", branchName, "branchId: ", branchId, "repoId: ", repoId)
    await state.updateWindowStateForRepo(currentWindow.id, currentWindow.sessionId ?? null, repoId, branchId);
    console.log("updated window state for repoId: ", repoId, "branchId: ", branchId)

    return ok()
}

export async function touch(repoName: string): Promise<Result<string, string>> {
    console.log("touch", repoName);
    const [currentWindow, me] = await Promise.all([await browserWindow.getCurrentlyFocusedWindow(), await db.fetchMe()]);
    console.log("currentwindow: ", currentWindow)
    if (!currentWindow.id) {
        return err("no currently focused window id?")
    }
    if (!currentWindow.sessionId) {
        console.log("no currently focused session id?")
    }
    const repoId = crypto.uuid()
    const branchId = crypto.uuid()

    console.log("creating repo")
    const repo = git.createRepository(repoId, repoName, me.id);
    console.log("creating branch")
    const branch = git.createBranch(branchId, "main", repoId)

    console.log("creating repo in db")
    await db.createRepository(repo);
    console.log("creating branch in db")
    await db.upsertBranch(branch.id, repoId, branch.name, branch.tipHash);
    console.log("creating window state in db")
    await state.createWindowStateForRepo(null, null, repoId, branchId);

    return ok(repoId)
}

// FUNCTIONS:
async function edit(repoId: string): Promise<Result<Unit, string>> {
    const currentWindow = await browserWindow.getCurrentlyFocusedWindow();
    console.log("currentwindow: ", currentWindow)
    if (!currentWindow.id) {
        return err("no currently focused window id?")
    }
    if (!currentWindow.sessionId) {
        console.log("no currently focused session id?")
    }
    const currentWindowState = await state.fetchStateForWindow(currentWindow.id);
    if (currentWindowState && repoId === currentWindowState.repoId) { // repo already open. No need to edit
        console.log("repo already open. No need to edit")
        return ok();
    }

    console.log("editing repo: ", repoId)
    // prepare inputs to get the tabs from the repository we need to cd into
    const currentlyOpenedBranchId = await state.fetchCurrentlyOpenedBranchForRepo(repoId);

    console.log("currentlyOpenedBranchId: ", currentlyOpenedBranchId)
    // update browser
    await state.updateWindowStateForRepo(currentWindow.id, currentWindow.sessionId ?? null, repoId, currentlyOpenedBranchId);
    console.log("updated window state for repoId: ", repoId, "branchId: ", currentlyOpenedBranchId)

    return ok()
}

export async function listRepositories(): Promise<Repository[]> {
    const repositories = await db.fetchRepositories();

    return repositories;
}

export async function renderGraph(): Promise<Result<string, string>> {
    const repoIdRes = await helpers.getCurrentlyFocusedRepoId();
    if (repoIdRes.isErr) return err(repoIdRes.error);
    const repoId = repoIdRes.value;

    const branchId = await state.fetchCurrentlyOpenedBranchForRepo(repoId);
    if (!branchId) return err("No branch is currently opened for this repo");

    const tip = await db.readBranchTip(branchId);
    if (tip.isErr) return err(tip.error);

    if (!tip.value) {
        return ok(`gitGraph TB\ncommit id: "empty"`);
    }

    const commits = await db.readCommits(repoId);
    const commitGraph = defaultCommitGraph(commits);

    const branchTips = new Map<string, string>();
    const branches = await db.fetchBranchesForRepo(repoId);
    if (branches.isErr) return err(branches.error);
    for (const branch of branches.value) {
        if (branch.tipHash) {
            branchTips.set(branch.name, branch.tipHash);
        }
    }
    const mermaid = git.renderMermaid(commitGraph, tip.value, branchTips);
    return ok(mermaid);
}

// HOOKS:
// clear tabs when a window state is deleted
state.getHook()("deleting", function (wid, _obj) {
    console.log("deleting window state for windowId: ", wid)
    if (wid) {
        this.onsuccess = async () => {
            await browserWindow.clearUnpinnedTabs(wid);
        }
    }
});

// Per-window mutex: ensures only one openBranchTabs call is ever in flight
// for a given window at a time. Without this, two checkouts fired in quick
// succession race on clearUnpinnedTabs/createTabs, and whichever call's
// createTabs happens to finish last "wins" — even if it was the older,
// stale checkout. Chaining onto the previous promise for the same wid
// forces later calls to wait for earlier ones to fully finish first.
const windowTabQueues = new Map<number, Promise<void>>();

function withWindowLock(wid: number, task: () => Promise<void>): Promise<void> {
    const previous = windowTabQueues.get(wid) ?? Promise.resolve();
    // Swallow errors from the previous task so one failure doesn't
    // permanently wedge the queue for this window.
    const next = previous.catch(() => {}).then(task);
    windowTabQueues.set(wid, next);
    return next;
}

const openBranchTabs = async (wid: number, repoId: string, branchId: string) => {
    console.log("running updated version")
    await withWindowLock(wid, async () => {
        const branchTip = await db.readBranchTip(branchId);
        if (branchTip.isErr) { // empty repo, no tabs need to open
            throw Error("incorrect branch set for current repo?")
        }
        const commitGraph = defaultCommitGraph(await db.readCommits(repoId));
        const latestSnapshotTabs = branchTip.value ? buildSnapshot(commitGraph, branchTip.value).map((t) => t.url) : []; // if there is no branch tip, then we have no tabs to open because the snapshot is empty
        console.log(latestSnapshotTabs);
        console.log("clearing unpinned tabs for windowId: ", wid)
        const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
        await browserWindow.clearUnpinnedTabs(wid);
        while ((await browserWindow.getUnpinnedTabs(wid)).length !== 0) {
            await sleep(500)
        }
        console.log("opening tabs for windowId: ", wid, "repoId: ", repoId, "branchId: ", branchId, "tabs: ", latestSnapshotTabs)
        await browserWindow.createTabs(wid, latestSnapshotTabs);
    });
}

// open specific branch from repo whenever window state changes
state.getHook()("creating", function (wid, obj) {
    console.log("creating window state for windowId: ", wid, "repoId: ", obj.repoId, "branchId: ", obj.branchId)
    if (wid) {
        this.onsuccess = async () => {
            console.log("opening tabs for windowId: ", wid, "repoId: ", obj.repoId, "branchId: ", obj.branchId)
            openBranchTabs(wid, obj.repoId, obj.branchId)
        }
        this.onerror = async (error) => {
            console.error("error opening tabs for windowId: ", wid, "repoId: ", obj.repoId, "branchId: ", obj.branchId, "error: ", error)
        }
    }
})

// open specific branch from repo whenever window state changes
state.getHook()("updating", function (this, mods: Partial<{branchId: string, repoId: string}>, wid, _oldObject, _transaction) {
    console.log("updating window state for windowId: ", wid, "repoId: ", mods.repoId, "branchId: ", mods.branchId)
    if (
        wid &&
        typeof mods.branchId === "string" &&
        typeof mods.repoId === "string"
    ) {
        this.onsuccess = async () => {
            if (mods.branchId && mods.repoId) {
                openBranchTabs(wid, mods.repoId, mods.branchId)
            }
        }
    }
})

async function updateSessionId(window: chrome.windows.Window) {
    console.log("updating session id for window: ", window.id, "sessionId: ", window.sessionId)
    if (window.id && window.sessionId) {
        await state.updateWindowIdForSession(window.sessionId, window.id);
    }
}

chrome.windows.onCreated.addListener(updateSessionId);

chrome.runtime.onStartup.addListener(async () => {
    chrome.windows.getAll(async (windows) => windows.forEach(updateSessionId));
})
