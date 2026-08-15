import {Dexie, EntityTable} from 'dexie';
Dexie.debug = true;

interface State {
    windowId: number | null,
    sessionId: string | null, // sessionId is null if the window does not have a session id
    repoId: string, // references Repo.id in schema.ts
    branchId: string, // references Branch.id in schema.ts
}

export default class LocalState extends Dexie {
    state!: EntityTable<State, "windowId">;

    constructor() {
        super('NolaTabsState');
        this.version(1).stores({
            state: 'windowId, sessionId, &repoId, &branchId', // one repo per session
        });
    }
}

const db = new LocalState()

export async function fetchCurrentlyOpenedBranchForRepo(repoId: string): Promise<string> {
    const repoState = await db.state.where("repoId").equals(repoId).toArray();
    if (repoState.length === 0) {
        throw new Error(`Repo state not found for repoId: ${repoId}`);
    } else if (repoState.length > 1) {
        throw new Error(`Multiple windows are attached to the same repository`)
    }
    return repoState[0].branchId;
}

export async function fetchCurrentlyOpenedRepositories(): Promise<string[]> {
    const windows = await db.state.toArray();
    return windows.map((w) => w.repoId);
}

export async function deleteRepository(repoId: string) {
    const deleted = await db.state.where("repoId").equals(repoId).delete();
    if (deleted === 0) {
        throw new Error(`Repo state not found for repoId: ${repoId}`);
    } else if (deleted > 1) {
        throw new Error(`Multiple windows are attached to the same repository`)
    }
    return deleted;
}

/** Get hook for the current LocalState */
export function getHook() {
    return db.state.hook;
}

async function normalizeWindowId(windowId: number | null): Promise<number> {
    let min = 0;
    await db.state.where("windowId").below(0).each((state) => {
        if (state.windowId !== null && state.windowId < min) {
            min = state.windowId;
        }
    });
    if (windowId === null) {
        return min - 1;
    }
    return windowId;
}

export async function updateWindowStateForRepo(windowId: number | null, sessionId: string | null, repoId: string, branchId: string) {
    await db.transaction("rw", [db.state], async () => {
        const prev = await db.state.get(windowId);
        if (prev) {
            const normalizedWindowId = await normalizeWindowId(null);
            const alreadyExists = await db.state.get(normalizedWindowId);
            if (alreadyExists) {
                throw new Error(`Window state already exists for normalized windowId: ${normalizedWindowId}. Cannot update to this windowId.`);
            }
            console.log(`Window state already exists for windowId: ${windowId}. Updating to new windowId: ${normalizedWindowId} and clearing sessionId.`);
            await db.state.delete(windowId);
            console.log(`Deleted previous window state for windowId: ${windowId}. Now adding...`);
            await db.state.add({
                ...prev,
                windowId: normalizedWindowId,
                sessionId: null,
            });
        }
        const normalized = await normalizeWindowId(windowId);
        console.log(`Updating window state for repoId: ${repoId}, branchId: ${branchId}, windowId: ${windowId}, normalized: ${normalized} sessionId: ${sessionId}`);
        const alreadyExists = await db.state.get(normalized);
        if (alreadyExists) {
            throw new Error(`Window state already exists for normalized windowId: ${normalized}. See additinoal context: wid: ${alreadyExists.windowId}, repoId: ${alreadyExists.repoId}`)
        }
        const modified = await db.state.where("repoId").equals(repoId).delete()
        await createWindowStateForRepo(normalized, sessionId, repoId, branchId)
        console.log("updated")
        if (!modified || modified > 1) {
            throw new Error("no open window state for given repo, or multiple deletions")
        }
    });
}

/** Returns true if the windowId was updated. Returns false if session id could not be found in db */
export async function updateWindowIdForSession(sessionId: string, windowId: number): Promise<boolean> {
    const modified = await db.state.where("sessionId").equals(sessionId).modify({windowId});
    return !!modified
}

export async function createWindowStateForRepo(windowId: number | null, sessionId: string | null, repoId: string, branchId: string) {
    windowId = await normalizeWindowId(windowId);
    console.log(`Creating window state for repoId: ${repoId}, branchId: ${branchId}, windowId: ${windowId}, sessionId: ${sessionId}`);
    await db.state.add({windowId, sessionId, repoId, branchId});
}

export async function fetchStateForWindow(windowId: number) {
    return await db.state.get(windowId);
}
