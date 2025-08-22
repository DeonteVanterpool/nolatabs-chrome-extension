export class Tab {
    id: number;
    date: Date;
    url: string;
    title: string;
    favicon: string;
    pinned: boolean;

    constructor(
        id: number,
        date: Date,
        url: string,
        title: string,
        favicon: string,
        pinned: boolean,
    ) {
        this.id = id;
        this.date = date;
        this.url = url;
        this.title = title;
        this.favicon = favicon;
        this.pinned = pinned;
    }
}
