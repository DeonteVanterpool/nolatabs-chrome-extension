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
export async function handleCommit(args: string[]): Promise<Result<Commit, String>> {
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
    const hash = await crypto.sha2Hash(crypto.encode(hashInput.stringify()) as Uint8Array<ArrayBuffer>);

    // create the commit
    const snapshotReader = (hash: string) => buildSnapshot(commitGraph, hash)
    const difference = calculateDifference(parents, tabs, snapshotReader);
    const newCommit = createCommit(crypto.decode(hash), me.id, timestamp, message, difference, parents);

    // update storage
    await db.saveCommitAndUpdateBranch(repoId.value, newCommit, currentlyOpenedBranchId);

    return ok(newCommit);
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
    if (currentlyOpenedRepository.isErr) {
        return err(currentlyOpenedRepository.error);
    }
    if (repoId.value === currentlyOpenedRepository.value) {
        return err("repo is already open");
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
    if (args.length < 1 || args[0].trim() === "") {
        return err("Not enough arguments provided for touch command. Expected at least 1 arguments: touch <repoName>");
    }
    if (!repoNameRegex.test(args[0])) {
        return err("Invalid repo name. Message must contain only alpha numeric characters and hyphens");
    }

    const repoName = args[0]

    return await touch(repoName);
}

export async function touch(repoName: string): Promise<Result<string, string>> {
    const [currentWindow, me] = await Promise.all([await browserWindow.getCurrentlyFocusedWindow(), await db.fetchMe()]);
    if (!currentWindow.id) {
        return err("no currently focused window id?")
    }
    if (!currentWindow.sessionId) {
        return err("no currently focused session id?")
    }
    const repoId = crypto.uuid()
    const branchId = crypto.uuid()

    const repo = git.createRepository(repoId, repoName, me.id);
    const branch = git.createBranch(branchId, "main", repoId)

    await db.createRepository(repo);
    await db.upsertBranch(branch.id, repoId, branch.name, branch.tipHash);
    await state.createWindowStateForRepo(null, null, repoId, branchId);

    return ok(repoId)
}

// FUNCTIONS:
async function edit(repoId: string): Promise<Result<Unit, string>> {
    const currentWindow = await browserWindow.getCurrentlyFocusedWindow();
    if (!currentWindow.id) {
        return err("no currently focused window id?")
    }
    if (!currentWindow.sessionId) {
        return err("no currently focused session id?")
    }
    const currentWindowState = await state.fetchStateForWindow(currentWindow.id);
    if (currentWindowState && repoId === currentWindowState.repoId) { // repo already open. No need to edit
        return ok();
    }

    // prepare inputs to get the tabs from the repository we need to cd into
    const currentlyOpenedBranchId = await state.fetchCurrentlyOpenedBranchForRepo(repoId);

    // update browser
    await state.updateWindowStateForRepo(currentWindow.id, currentWindow.sessionId, repoId, currentlyOpenedBranchId);

    return ok()
}

export async function listRepositories(): Promise<Repository[]> {
    const repositories = await db.fetchRepositories();

    return repositories;
}

// HOOKS:
// clear tabs when a window state is deleted
state.getHook()("deleting", function (wid, _obj) {
    if (wid) {
        this.onsuccess = async () => {
            await browserWindow.clearUnpinnedTabs(wid);
        }
    }
});

const openBranchTabs = async (wid: number, repoId: string, branchId: string) => {
    const branchTip = await db.readBranchTip(branchId);
    if (branchTip.isErr) { // empty repo, no tabs need to open
        throw Error("incorrect branch set for current repo?")
    }
    const commitGraph = defaultCommitGraph(await db.readCommits(repoId));
    const latestSnapshotTabs = branchTip.value ? buildSnapshot(commitGraph, branchTip.value).map((t) => t.url) : []; // if there is no branch tip, then we have no tabs to open because the snapshot is empty
    await browserWindow.clearUnpinnedTabs(wid);
    await browserWindow.createTabs(wid, latestSnapshotTabs);
}

// open specific branch from repo whenever window state changes
state.getHook()("creating", function (wid, obj) {
    if (wid) {
        this.onsuccess = async () => {
            openBranchTabs(wid, obj.repoId, obj.branchId)
        }
    }
})

// open specific branch from repo whenever window state changes
state.getHook()("updating", function (this, mods: Partial<{branchId: string, repoId: string}>, wid, _oldObject, _transaction) {
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
    if (window.id && window.sessionId) {
        await state.updateWindowIdForSession(window.sessionId, window.id);
    }
}

chrome.windows.onCreated.addListener(updateSessionId);

chrome.runtime.onStartup.addListener(async () => {
    chrome.windows.getAll(async (windows) => windows.forEach(updateSessionId));
})
