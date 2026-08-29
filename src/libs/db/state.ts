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
        const normalized = await normalizeWindowId(windowId);

        // If this window was previously attached to a *different* repo,
        // that row is now stale — remove it so we don't leave orphaned state.
        await db.state.delete(normalized);

        // Enforce "one window per repo": if some other window was
        // previously attached to this repo, that mapping is now stale too.
        const modified = await db.state.where("repoId").equals(repoId).delete();

        await createWindowStateForRepo(normalized, sessionId, repoId, branchId);

        if (modified > 1) {
            throw new Error("multiple windows were attached to the same repo");
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
