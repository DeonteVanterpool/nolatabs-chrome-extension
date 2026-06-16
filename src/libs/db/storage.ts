import {Dexie, EntityTable} from 'dexie';
import {CommitDiff} from 'src/models/commit';
import {CommitMode, User} from 'src/models/user';
import * as commit from 'src/models/commit';
import {Repository} from 'src/models/repository';
import Result, {err, ok} from 'true-myth/result';
import {Unit} from 'true-myth';

interface UserInfo {
    username: string,
    id: string,
    email: string,
    premium: boolean,
}

interface UserSettings {
    devMode: boolean,
    autoCommit: boolean,
    commitIntervalTime: number,
    commitMode: CommitMode,
    autoPush: boolean,
}

interface Repo {
    id: string,
    name: string,
    ownerId: string,
}

interface Branch {
    id: string,
    name: string,
    repoId: string, // references Repo.id
    tip: string | null, // references Commit.hash
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
    branches!: Dexie.Table<Branch, string>;
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
            repos: '&id, &name, ownerId',
            branches: 'id, name, repoId',
            commits: '&hash, repoId, author, timestamp, message',
            commitsParents: '[commitId+parentId]',
            additions: '++,commitId, tabId, after',
            deletions: '++,commitId, index',
            tabs: '++id, url, title, pinned'
        });
    }
}

const db = new LocalDB()

// repos ON DELETE, CASCADE to commits
db.repos.hook("deleting", function (repoId, _obj, transaction) {
    transaction.table("commits").where("repoId").equals(repoId).delete();
    transaction.table("branches").where("repoId").equals(repoId).delete();
});

// commits ON DELETE, CASCADE to commitsParents
db.commits.hook("deleting", function (commitId, _obj, transaction) {
    transaction.table("commitsParents").where("commitId").equals(commitId).or("parentId").equals(commitId).delete();
    transaction.table("additions").where("commitId").equals(commitId).delete();
    transaction.table("deletions").where("commitId").equals(commitId).delete();
});

export const readCommits = async (repoId: string) => await db.transaction('r', [db.commits, db.additions, db.deletions, db.commitsParents, db.tabs], async () => {
    return await Promise.all((await db.commits.where("repoId").equals(repoId).toArray()).map(async (c) => {
        let [additions, deletions, parents] = await Promise.all([
            db.additions.where("commitId").equals(c.hash).toArray(),
            db.deletions.where("commitId").equals(c.hash).toArray(), db.commitsParents.where("commitId").equals(c.hash).toArray()]);
        let diff = ({
            additions: await Promise.all(additions.map(async (a) => {return {tab: (await db.tabs.get(a.tabId))!, after: a.after} satisfies commit.Addition})),
            deletions: deletions.map((d) => {return {index: d.index}})
        }) satisfies (CommitDiff);
        return ({hash: c.hash, author: c.author, timestamp: new Date(c.timestamp), message: c.message, diff: diff, parents: parents.map(cp => cp.parentId)} satisfies commit.Commit);
    }));
});

export const readBranchTip = async (branchId: string): Promise<Result<string | null, string>> => {
    const branch = await db.branches.get(branchId);
    if (!branch) {
        return err("no branch for given id: " + branchId)
    }
    return ok(branch?.tip);
}

export const readRepoFromCommitHash = async (commitHash: string): Promise<Repo | undefined> => {
    let commit = await db.commits.get(commitHash);
    if (!commit) {
        return undefined;
    }
    return await db.repos.get(commit.repoId);
}

export const createCommit = async (repoId: string, commit: commit.Commit) => await db.transaction('rw', [db.commits, db.additions, db.deletions, db.commitsParents, db.tabs], async () => {
    await db.commits.add({hash: commit.hash, repoId: repoId, author: commit.author, timestamp: commit.timestamp.getTime(), message: commit.message});
    await Promise.all(commit.diff.additions.map(async (a) => {
        let tabId = await db.tabs.add(a.tab);
        await db.additions.add({commitId: commit.hash, tabId: tabId, after: a.after});
    }));
    await Promise.all(commit.diff.deletions.map(async (d) => {
        await db.deletions.add({commitId: commit.hash, index: d.index});
    }));
    await Promise.all(commit.parents.map(async (p) => {
        await db.commitsParents.add({commitId: commit.hash, parentId: p});
    }));
});

export const upsertBranch = async (id: string, repoId: string, branchName: string, tipHash: string | null) => {
    const existingBranch = await db.branches.get(id);
    if (existingBranch) {
        await db.branches.update(id, {tip: tipHash, name: branchName, repoId});
    } else {
        await db.branches.add({name: branchName, id, repoId: repoId, tip: tipHash});
    }
}

export const fetchMe = async (): Promise<User> => {
    const userInfo = await db.userInfo.get("global_config");
    if (!userInfo) {
        throw new Error("User info not found in storage.");
    }
    const userSettings = await db.userSettings.get("global_config");
    if (!userSettings) {
        throw new Error("User settings not found in storage")
    }
    return {
        username: userInfo.username,
        email: userInfo.email,
        id: userInfo.id,
        premium: userInfo.premium,
        settings: {
            ...userSettings
        }
    } satisfies User;
}

export const createRepository = async (repo: Repository) => {
    await db.repos.add({ ...repo } satisfies Repo)
}

export const fetchRepositories = async (): Promise<Repository[]> => {
    return await db.transaction('r', [db.repos, db.branches], async () => {
        const [repos, allBranches] = await Promise.all([
            db.repos.toArray(),
            db.branches.toArray()
        ]);

        const branchesByRepoId = new Map<string, Branch[]>();
        for (const branch of allBranches) {
            if (!branchesByRepoId.has(branch.repoId)) {
                branchesByRepoId.set(branch.repoId, []);
            }
            branchesByRepoId.get(branch.repoId)!.push(branch);
        }

        return repos.map(r => ({
            id: r.id,
            name: r.name,
            ownerId: r.ownerId,
        }));
    });
}

export const fetchRepositoryIdByName = async (name: string): Promise<Result<string, string>> => {
    const id = await db.repos.where("name").equals(name).toArray();
    if (id.length > 1) {
        return err("multiple repositories with same name");
    }
    if (id.length < 1) {
        return err("no repository of name: " + name);
    }
    return ok(id[0].id);
}


export const deleteRepository = async (repoId: string): Promise<Result<Unit, string>> => {
    // these are to handle cascading deletes
    const affectedTables = [
        db.repos,
        db.commits,
        db.branches,
        db.commitsParents,
        db.additions,
        db.deletions
    ];

    await db.transaction('rw', affectedTables, async () => {
        await db.repos.delete(repoId);
    });
    return ok()
}

export const createUser = async (user: User): Promise<Result<Unit, string>> => {
    if (await db.userInfo.get("global_config")) { // user present already in database
        return err("user already exists")
    }
    await db.userInfo.add({
        ...user
    } satisfies UserInfo);

    await db.userSettings.add({
        ...user.settings
    });

    return ok()
}

export const saveCommitAndUpdateBranch = async (repoId: string, commit: commit.Commit, branchId: string) => {
    return await db.transaction('rw', [db.commits, db.branches, db.additions, db.deletions, db.commitsParents, db.tabs], async () => {
        await createCommit(repoId, commit);
        await upsertBranch(branchId, repoId, branchId, commit.hash);
    });
};

