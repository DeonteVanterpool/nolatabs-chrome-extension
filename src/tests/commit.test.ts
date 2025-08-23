import {Tab} from '../pages/models/tab';
import {CommitDiff, Addition, Deletion} from '../pages/models/commit';

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
    { url: 'k1' }, // 0
    { url: 'x'  }, // 1 -> deleted
    { url: 'k2' }, // 2 (we will insert after this original index)
    { url: 'k3' }, // 3
    { url: 'y'  }, // 4 -> deleted
    { url: 'k4' }  // 5
  ] as Tab[];
  const b: Tab[] = [
    { url: 'k1' },
    { url: 'k2' },
    { url: 'ins1' }, // inserted after original index 2
    { url: 'k3' },
    { url: 'k4' }
  ] as Tab[];

  const diff = CommitDiff.diff(a, b);
  const applied = diff.apply(a);

  expect(applied.map(t => t.url)).toEqual(b.map(t => t.url));
});
