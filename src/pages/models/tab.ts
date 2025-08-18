class Tab {
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

class TabNode {
    tab: Tab;
    next: TabNode | null;
    prev: TabNode | null;
    
    constructor(
        tab: Tab,
    ) {
        this.tab = tab;
        this.next = null;
        this.prev = null;
    }
}

// We store an array here because we will need to perform multiple sets of insertions and deletions, and we want to keep this in linear time. Patching would require an O(n) insertion per index with an array. If we keep an extra reference to the nodes, we may even be able to delete in constant time! This can be done using a map to the id
class TabList {
    head: TabNode | null;

    constructor() {
        this.head = null;
    }
}
