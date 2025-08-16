import { Commit } from './commit';

class Repo {
    id: number;
    name: string;
    commits: Commit[];

    constructor(
       id: number,
       name: string,
       commits: Commit[],
    ) {
        this.id = id;
        this.name = name;
        this.commits = commits;
    }
}
