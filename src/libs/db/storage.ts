import { Dexie, EntityTable } from 'dexie';
import {CommitMode} from 'src/models/user';

interface UserInfo {
    name: string,
    email: string,
    premium: boolean,
}

interface UserSettings {
    devMode: boolean,
    autoCommit: boolean,
    commitIntervalTime: number,
    commitMode: CommitMode,
}

interface Repo {
    id: string,
    name: string,
    owner: string,
}

interface Branch {
    name: string,
    repoId: string, // references Repo.id
}

interface Commit {
    hash: string,
    repoId: string, // references Repo.id
    author: string,
    timestamp: number,
    message: string,
}

interface CommitParent {
    commitId: string, // references Commit.hash
    parentId: string, // references Commit.hash
}

interface Addition {
    commitId: string, // references Commit.hash
    tabId: number, // references Tab.id
    after: number,
}

interface Deletion {
    commitId: string, // references Commit.hash
    index: number,
}

interface Tab {
    id: number,
    url: string,
    title: string,
    favicon: string,
    pinned: boolean,
}

type Singleton = "global_config";

export default class LocalDB extends Dexie {
    userInfo!: Dexie.Table<UserInfo, Singleton>;
    userSettings!: Dexie.Table<UserSettings, Singleton>
    repos!: EntityTable<Repo, "id">;
    branches!: Dexie.Table<Branch, [string, string]>; // compound index on name and repoId
    commits!: EntityTable<Commit, "hash">;
    commitsParents!: Dexie.Table<CommitParent, [string, string]> // compound index on commitId and parentId
    additions!: Dexie.Table<Addition, number>
    deletions!: Dexie.Table<Deletion, number>
    tabs!: EntityTable<Tab, "id">;

    constructor() {
        super('NolaTabsStorage');
        this.version(1).stores({
            userInfo: '',
            userSettings: '',
            repos: '&id, name, owner',
            branches: '[name+repoId]',
            commits: '&hash, repoId, author, timestamp, message',
            commitsParents: '[commitId+parentId]',
            additions: '++,commitId, tabId, after',
            deletions: '++,commitId, index',
            tabs: '++id, url, title, pinned'
        });
    }
}
