import { Commit } from './commit';

export class Repository {
    id: number;
    name: string;
    head: Commit;

    public constructor(
       id: number,
       name: string,
       head: Commit,
    ) {
        this.id = id;
        this.name = name;
        this.head = head;
    }
}
