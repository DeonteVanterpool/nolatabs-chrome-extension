import * as state from 'src/libs/db/state';
import {Result} from "true-myth";
import * as browserWindow from "src/libs/handlers/browserWindow";
import {err, ok} from "true-myth/result";

export async function getCurrentlyFocusedRepoId(): Promise<Result<string, string>> {
    let currentWindow = browserWindow.getCurrentlyFocusedWindowId();
    if (!currentWindow) {
        return err("No window is currently focused.");
    }
    const windowState = await state.db.windowState.get(currentWindow);
    if (!windowState) {
        return err("Window state not found in storage.");
    }
    return ok(windowState.repoId);
}

export async function getCurrentBranch(repoId: string): Promise<Result<string, string>> {
    return ok("main"); // TODO: implement branch switching and retrieval in state
}
