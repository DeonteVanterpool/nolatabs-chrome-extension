class Tab {
    constructor(
        public readonly id: number,
        public date: Date,
        public url: string,
        public title: string,
        public favicon: string,
        public pinned: boolean,
    ) {}
}
