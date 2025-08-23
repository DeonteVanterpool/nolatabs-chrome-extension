import { Tab } from '../pages/models/tab';
import { CommitDiff } from '../pages/models/commit';

test('return 0 deltas on equivalent tab arrays 1', () => {
    let a: Tab[] = [{url: "a" } as Tab];
    let b: Tab[] = [{url: "a" } as Tab];
    expect(CommitDiff.diff(a, b)).toEqual({"additions": [], "deletions": []});
})

test('return 0 deltas on equivalent tab arrays 2', () => {
    let a: Tab[] = [{url: "a" } as Tab, {url: "a" } as Tab];
    let b: Tab[] = [{url: "a" } as Tab, {url: "a" } as Tab];
    expect(CommitDiff.diff(a, b)).toEqual({"additions": [], "deletions": []});
})

test('return 0 deltas on equivalent tab arrays 3', () => {
    let a: Tab[] = [];
    let b: Tab[] = [];
    expect(CommitDiff.diff(a, b)).toEqual({"additions": [], "deletions": []});
})

test('return 0 deltas on equivalent tab arrays 4', () => {
    let a: Tab[] = [{url: "a" } as Tab, {url: "b" } as Tab];
    let b: Tab[] = [{url: "a" } as Tab, {url: "b" } as Tab];
    expect(CommitDiff.diff(a, b)).toEqual({"additions": [], "deletions": []});
})
