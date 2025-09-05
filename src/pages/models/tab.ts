export class Tab {
    url: string;
    title: string;
    favicon: string;
    pinned: boolean;

    constructor(
        url: string,
        title: string,
        favicon: string,
        pinned: boolean,
    ) {
        this.url = url;
        this.title = title;
        this.favicon = favicon;
        this.pinned = pinned;
    }

}
