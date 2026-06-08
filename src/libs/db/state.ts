import { Dexie, EntityTable } from 'dexie';

interface State {
    sessionId: string,
    repoId: string, // references Repo.id in schema.ts
}

export default class LocalDB extends Dexie {
    state!: EntityTable<State, "sessionId">;

    constructor() {
        super('NolaTabsState');
        this.version(1).stores({
            state: 'sessionId, &repoId', // one repo per session
        });
    }
}
