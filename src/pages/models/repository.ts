export class Repository {
    name: string;
    owner: string;

    public constructor(
       name: string,
       owner: string,
    ) {
        this.name = name;
        this.owner = owner;
    }
}
