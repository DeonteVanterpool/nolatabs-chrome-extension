import { Commit } from './commit';

export class Repository {
    name: string;
    owner: string;

    public constructor(
       id: number,
       name: string,
       owner: string,
    ) {
        this.name = name;
        this.owner = owner;
    }
}
