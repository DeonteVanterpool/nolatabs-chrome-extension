import { Commit } from './commit';

export class Repository {
    name: string;
    head: string;
    owner: string;

    public constructor(
       id: number,
       name: string,
       head: string,
       owner: string,
    ) {
        this.id = id;
        this.name = name;
        this.head = head;
        this.owner = owner;
    }
}
