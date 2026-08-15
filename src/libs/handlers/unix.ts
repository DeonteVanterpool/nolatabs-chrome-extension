import * as state from 'src/libs/db/state';
import * as db from 'src/libs/db/storage';
import * as git from 'src/libs/logic/git';
import {buildSnapshot, defaultCommitGraph} from "src/libs/logic/git";
import {err, ok} from 'true-myth/result';
import * as browserWindow from './browserWindow';
import * as helpers from 'src/libs/helpers';
import * as crypto from './cryptography';
import {Repository} from 'src/models/git';
import {Result, Unit} from 'true-myth';

// In-memory map to associate current window with current repo id
const currentRepoByWindow = new Map<number, string>();

export async function handleCommit(args: string[]): Promise<Result<Unit, string>> {
    // input validation
    console.log("handleCommit", args);
    if (args.length < 1 || args[0].trim() === "") {
        return err("Not enough arguments provided for commit command. Expected at least 1 arguments: commit <message>");
    }
    if (!stringRegex.test(args[0])) {
        return err("Invalid commit message. Message must be a non-empty string.");
    }

    const message = args[0]

    return await commit(message);
}

const stringRegex = /^\S(.*\S)?$/;

export async function commit(message: string): Promise<Result<Unit, string>> {
    console.log("commit", message);

    const [currentWindow, me] = await Promise.all([browserWindow.getCurrentlyFocusedWindow(), db.fetchMe()]);
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

    const branchId = await state.fetchCurrentlyOpenedBranchForRepo(repoId);
    if (!branchId) {
        return err("No branch is currently opened for this repo");
    }
    const parentHash = await db.readBranchTip(branchId); // Parent commit hash (or undefined for initial commit)
    if (parentHash.isErr) {
        return err(parentHash.error)
    }

    const tabs = await browserWindow.getAllTabsForWindow(currentWindow.id);

    const currSnapshot = tabs.map((tab) => {
        return {
            url: tab.url!,
            title: tab.title,
            favicon: tab.favIconUrl ?? "",
            pinned: tab.pinned,
        }
    });

    const parents = parentHash.value ? [parentHash.value] : [];

    // Compute hash input and hash
    const timestamp = new Date();
    const hashInput = new git.CommitHashInput(me.username, message, timestamp, currSnapshot, parents);
    const commitHash = await crypto.sha256(hashInput.encode());

    // Build diff against parent snapshot if parent exists
    const commits = await db.readCommits(repoId)

    let parentSnapshot: git.Tab[] = [];
    if (parents.length === 1) {
        const graph = defaultCommitGraph(commits);
        try {
            parentSnapshot = buildSnapshot(graph, parents[0]);
        } catch {
            return err(`Parent commit ${parents[0]} not found while building snapshot`);
        }
    }

    const commitDiff = git.diff(parentSnapshot, currSnapshot);

    const commitObj: git.Commit = git.createCommit(
        commitHash,
        me.username,
        timestamp,
        message,
        commitDiff,
        parents,
    );

    // persist commit and update branch tip
    await db.saveCommitAndUpdateBranch(repoId, commitObj, branchId, null);

    return ok();
}

export async function handleRm(args: string[]): Promise<Result<Unit, string>> {
    // input validation
    console.log("handleRm", args);
    if (args.length < 1 || args[0].trim() === "") {
        return err("Not enough arguments provided for rm command. Expected at least 1 arguments: rm <repoName>");
    }
    if (!stringRegex.test(args[0])) {
        return err("Invalid repository name. Name must be a non-empty string.");
    }

    const repoName = args[0]

    return await rm(repoName);
}

export async function rm(repoName: string): Promise<Result<Unit, string>> {
    console.log("rm", repoName)

    const [currentWindow] = await Promise.all([browserWindow.getCurrentlyFocusedWindow(), db.fetchMe()]);
    if (!currentWindow.id) {
        return err("no currently focused window id?")
    }
    if (!currentWindow.sessionId) {
        console.log("no currently focused session id?")
    }

    const repoIdRes = await db.fetchRepositoryIdByName(repoName);
    if (repoIdRes.isErr) {
        return err(repoIdRes.error);
    }
    const repoId = repoIdRes.value;

    const currentRepoIdRes = await helpers.getCurrentlyFocusedRepoId();
    if (currentRepoIdRes.isErr) {
        return err(currentRepoIdRes.error);
    }

    await db.deleteRepository(repoId)
    await state.deleteRepository(repoId)

    if (repoId === currentRepoIdRes.value) {
        console.log("deleting currently opened repository. opening empty session")
        await browserWindow.clearUnpinnedTabs(currentWindow.id);
    }
    return ok()
}

export async function handleInit(args: string[]): Promise<Result<Unit, string>> {
    // input validation
    console.log("handleInit", args);
    if (args.length < 1 || args[0].trim() === "") {
        return err("Not enough arguments provided for init command. Expected at least 1 arguments: init <repoName>");
    }
    if (!stringRegex.test(args[0])) {
        return err("Invalid repository name. Name must be a non-empty string.");
    }

    const repoName = args[0]

    return await init(repoName);
}

export async function init(repoName: string): Promise<Result<Unit, string>> {
    console.log("init", repoName)

    const [currentWindow, me] = await Promise.all([browserWindow.getCurrentlyFocusedWindow(), db.fetchMe()]);
    if (!currentWindow.id) {
        return err("no currently focused window id?")
    }
    if (!currentWindow.sessionId) {
        console.log("no currently focused session id?")
    }

    const repoId = crypto.uuid();
    const branchId = crypto.uuid();

    console.log("creating repository")
    const repo = git.createRepository(repoId, repoName, me.id);
    console.log("creating branch")
    const branch = git.createBranch(branchId, "main", repoId);

    console.log("storing repository and branch")
    await db.createRepository(repo);
    await db.upsertBranch(branch.id, repoId, branch.name, branch.tipHash);

    console.log("updating window state")
    await state.updateWindowStateForRepo(currentWindow.id, currentWindow.sessionId ?? null, repoId, branchId);

    return ok()
}

export async function handleMv(args: string[]): Promise<Result<Unit, string>> {
    // input validation
    console.log("handleMv", args);
    if (args.length < 2 || args[0].trim() === "" || args[1].trim() === "") {
        return err("Not enough arguments provided for mv command. Expected at least 2 arguments: mv <oldRepoName> <newRepoName>");
    }
    if (!stringRegex.test(args[0]) || !stringRegex.test(args[1])) {
        return err("Invalid repository name(s). Name must be a non-empty string.");
    }

    const oldRepoName = args[0]
    const newRepoName = args[1]

    return await mv(oldRepoName, newRepoName);
}

export async function mv(oldRepoName: string, newRepoName: string): Promise<Result<Unit, string>> {
    console.log("mv", oldRepoName, newRepoName);
    const [currentWindow] = await Promise.all([browserWindow.getCurrentlyFocusedWindow(), db.fetchMe()]);
    if (!currentWindow.id) {
        return err("no currently focused window id?")
    }
    if (!currentWindow.sessionId) {
        console.log("no currently focused session id?")
    }

    const repoIdRes = await db.fetchRepositoryIdByName(oldRepoName);
    if (repoIdRes.isErr) {
        return err(repoIdRes.error);
    }
    const repoId = repoIdRes.value;

    await db.renameRepository(repoId, newRepoName)

    return ok()
}

export async function handleTouch(args: string[]): Promise<Result<string, string>> {
    // input validation
    console.log("handleTouch", args);
    if (args.length < 1 || args[0].trim() === "") {
        return err("Not enough arguments provided for touch command. Expected at least 1 arguments: touch <repoName>");
    }
    if (!stringRegex.test(args[0])) {
        return err("Invalid repository name. Name must be a non-empty string.");
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

    console.log("creating branch in db")
    await db.upsertBranch(branch.id, repoId, branch.name, branch.tipHash);

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
    // this command creates a local repository if not existing, and enters into it
    console.log("touch", repoName)

    const [currentWindow, me] = await Promise.all([browserWindow.getCurrentlyFocusedWindow(), db.fetchMe()]);
    if (!currentWindow.id) {
        return err("no currently focused window id?")
    }
    if (!currentWindow.sessionId) {
        console.log("no currently focused session id?")
    }

    let repoIdRes = await db.fetchRepositoryIdByName(repoName);
    let repoId: string;
    let branchId: string;
    if (repoIdRes.isErr) {
        const newRepoId = crypto.uuid();
        const newBranchId = crypto.uuid();
        const repo = git.createRepository(newRepoId, repoName, me.id);
        const branch = git.createBranch(newBranchId, "main", newRepoId);
        await db.createRepository(repo);
        await db.upsertBranch(branch.id, newRepoId, branch.name, branch.tipHash);
        repoId = newRepoId;
        branchId = newBranchId;
    } else {
        repoId = repoIdRes.value;
        branchId = await state.fetchCurrentlyOpenedBranchForRepo(repoId);
    }

    await state.updateWindowStateForRepo(currentWindow.id, currentWindow.sessionId ?? null, repoId, branchId);
    return ok(repoId)
}

export async function handleEdit(args: string[]): Promise<Result<Unit, string>> {
    // input validation
    console.log("handleEdit", args);
    if (args.length < 1 || args[0].trim() === "") {
        return err("Not enough arguments provided for edit command. Expected at least 1 arguments: edit <repoName>");
    }
    if (!stringRegex.test(args[0])) {
        return err("Invalid repository name. Name must be a non-empty string.");
    }

    const repoName = args[0]

    return await edit(repoName)
}

export async function edit(repoName: string): Promise<Result<Unit, string>> {
    console.log("cd", repoName)

    const [currentWindow] = await Promise.all([browserWindow.getCurrentlyFocusedWindow(), db.fetchMe()]);
    if (!currentWindow.id) {
        return err("no currently focused window id?")
    }
    if (!currentWindow.sessionId) {
        console.log("no currently focused session id?")
    }

    const repoIdRes = await db.fetchRepositoryIdByName(repoName);
    if (repoIdRes.isErr) {
        return err(repoIdRes.error);
    }
    const repoId = repoIdRes.value;

    const currentRepoIdRes = await helpers.getCurrentlyFocusedRepoId();
    if (currentRepoIdRes.isErr) {
        return err(currentRepoIdRes.error);
    }

    if (repoId === currentRepoIdRes.value) {
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

    const tips = await db.readBranchTipsForRepo(repoId);

    if (tips.length === 0) {
        // empty repo: no commits => empty graph
        return ok(`gitGraph TB\ncommit id: "empty"`);
    }

    const commits = await db.readCommits(repoId);
    const commitGraph = defaultCommitGraph(commits);

    const mermaid = git.renderMermaid(commitGraph, tips);
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

const openBranchTabs = async (wid: number, repoId: string, branchId: string) => {
    const branchTip = await db.readBranchTip(branchId);
    if (branchTip.isErr) { // empty repo, no tabs need to open
        throw Error("incorrect branch set for current repo?")
    }
    const commitGraph = defaultCommitGraph(await db.readCommits(repoId));
    const latestSnapshotTabs = branchTip.value ? buildSnapshot(commitGraph, branchTip.value).map((t) => t.url) : []; // if there is no branch tip, then we have no tabs to open because the snapshot is empty
    console.log("clearing unpinned tabs for windowId: ", wid)
    await browserWindow.clearUnpinnedTabs(wid);
    console.log("opening tabs for windowId: ", wid, "repoId: ", repoId, "branchId: ", branchId, "tabs: ", latestSnapshotTabs)
    await browserWindow.createTabs(wid, latestSnapshotTabs);
}

// open specific branch from repo whenever window state changes
state.getHook()("creating", function (wid, obj) {
    console.log("creating window state for windowId: ", wid, "repoId: ", obj.repoId, "branchId: ", obj.branchId)
    if (wid) {
        this.onsuccess = async () => {
            await openBranchTabs(wid, obj.repoId, obj.branchId)
        }
    }
});
