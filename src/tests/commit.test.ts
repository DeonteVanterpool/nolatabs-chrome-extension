import {Tab} from '../pages/models/tab';
import {CommitDiff, Addition, Deletion} from '../pages/models/commit';
import {Commit, commits} from '../pages/models/commit';

test('return 0 deltas on equivalent tab arrays 1', () => {
    let a: Tab[] = [{url: "a"} as Tab];
    let b: Tab[] = [{url: "a"} as Tab];
    expect(CommitDiff.diff(a, b)).toEqual({"additions": [], "deletions": []});
});

test('return 0 deltas on equivalent tab arrays 2', () => {
    let a: Tab[] = [{url: "a"} as Tab, {url: "a"} as Tab];
    let b: Tab[] = [{url: "a"} as Tab, {url: "a"} as Tab];
    expect(CommitDiff.diff(a, b)).toEqual({"additions": [], "deletions": []});
});

test('return 0 deltas on equivalent tab arrays 3', () => {
    let a: Tab[] = [];
    let b: Tab[] = [];
    expect(CommitDiff.diff(a, b)).toEqual({"additions": [], "deletions": []});
});

test('return 0 deltas on equivalent tab arrays 4', () => {
    let a: Tab[] = [{url: "a"} as Tab, {url: "b"} as Tab];
    let b: Tab[] = [{url: "a"} as Tab, {url: "b"} as Tab];
    expect(CommitDiff.diff(a, b)).toEqual({"additions": [], "deletions": []});
});

test('returns correct delta on two different tab arrays', () => {
    let a: Tab[] = [{url: "a"} as Tab, {url: "b"} as Tab];
    let b: Tab[] = [{url: "b"} as Tab, {url: "c"} as Tab];
    expect(CommitDiff.diff(a, b)).toEqual(expect.objectContaining(
        {
            "additions": [new Addition({"url": "c"} as Tab, 1)], // index in the original array
            "deletions": [new Deletion(0)]
        })
    );
});

test('returns correct delta with multiple changes on two different tab arrays', () => {
    let a: Tab[] = [{url: "a"} as Tab, {url: "b"} as Tab];
    let b: Tab[] = [{url: "c"} as Tab, {url: "d"} as Tab];
    expect(CommitDiff.diff(a, b)).toEqual(expect.objectContaining(
        {
            "additions": [new Addition({"url": "c"} as Tab, -1), new Addition({"url": "d"} as Tab, -1)],
            "deletions": [new Deletion(0), new Deletion(1)]
        })
    );
});

test('applies patch correctly', () => {
    let a: Tab[] = [{url: "a"} as Tab, {url: "b"} as Tab];
    let b: Tab[] = [{url: "b"} as Tab, {url: "c"} as Tab];
    let delta: CommitDiff = new CommitDiff(
        [new Addition({"url": "c"} as Tab, 1)],
        [new Deletion(0)]
    );
    expect(delta.apply(a)).toEqual(b);
});

test('applies patch correctly with multiple changes', () => {
    let a: Tab[] = [{url: "a"} as Tab, {url: "b"} as Tab];
    let b: Tab[] = [{url: "c"} as Tab, {url: "d"} as Tab];
    let delta: CommitDiff = new CommitDiff(
        [new Addition({"url": "c"} as Tab, 0), new Addition({"url": "d"} as Tab, 1)],
        [new Deletion(0), new Deletion(1)]
    );
    expect(delta.apply(a)).toEqual(b);
});

test('applies patch correctly with interleaved changes', () => {
    let a: Tab[] = [{url: "a"} as Tab, {url: "b"} as Tab, {url: "e"} as Tab];
    let b: Tab[] = [{url: "c"} as Tab, {url: "b"} as Tab, {url: "d"} as Tab];
    let delta: CommitDiff = new CommitDiff(
        [new Addition({"url": "c"} as Tab, 0), new Addition({"url": "d"} as Tab, 2)],
        [new Deletion(0), new Deletion(2)]
    );
    expect(delta.apply(a)).toEqual(b);
});

test('multiple deletions + insertion: catches off-by-diagonal/add-after bugs', () => {
    const a: Tab[] = [
        {url: 'k1'}, // 0
        {url: 'x'}, // 1 -> deleted
        {url: 'k2'}, // 2 (we will insert after this original index)
        {url: 'k3'}, // 3
        {url: 'y'}, // 4 -> deleted
        {url: 'k4'}  // 5
    ] as Tab[];
    const b: Tab[] = [
        {url: 'k1'},
        {url: 'k2'},
        {url: 'ins1'}, // inserted after original index 2
        {url: 'k3'},
        {url: 'k4'}
    ] as Tab[];

    const diff = CommitDiff.diff(a, b);
    const applied = diff.apply(a);

    expect(applied.map(t => t.url)).toEqual(b.map(t => t.url));
});

// Force inner loop to see k = -1 (max = 1)
test('inserting into empty original (forces k negative)', () => {
    const a: Tab[] = [];
    const b: Tab[] = [{url: 'x'} as Tab];

    // Expect one addition at the very start: after = -1 (insert before any original)
    expect(CommitDiff.diff(a, b)).toEqual(
        expect.objectContaining({
            additions: [new Addition({url: 'x'} as Tab, -1)],
            deletions: []
        })
    );
});

// Replace single element: deletion + insertion at start (also forces k = -1)
test('replace single element (delete 0 + add at start) — exercises negative k', () => {
    const a: Tab[] = [{url: 'a'} as Tab];
    const b: Tab[] = [{url: 'b'} as Tab];

    // One deletion at index 0, and one addition inserted at start (after = -1)
    expect(CommitDiff.diff(a, b)).toEqual(
        expect.objectContaining({
            additions: [new Addition({url: 'b'} as Tab, -1)],
            deletions: [new Deletion(0)]
        })
    );
});

test('get common ancestor of merge commit', async () => {
    //      A
    //     / \
    //    B   C
    //     \ /
    //      D

    let A = await Commit.init("a", new Date(), "A", [{url: "a"} as Tab], []);
    commits.set(A.hash, A);
    let B = await Commit.init("b", new Date(), "B", [{url: "a"} as Tab, {url: "b"} as Tab], [A]);
    commits.set(B.hash, B);
    let C = await Commit.init("c", new Date(), "C", [{url: "a"} as Tab, {url: "c"} as Tab], [A]);
    commits.set(C.hash, C);
    let D = await Commit.init("d", new Date(), "D", [{url: "a"} as Tab, {url: "b"} as Tab, {url: "c"} as Tab], [B, C]);
    commits.set(D.hash, D);
    expect(Commit.getCommonAncestor(B, C)).toBe(A.hash);
});
