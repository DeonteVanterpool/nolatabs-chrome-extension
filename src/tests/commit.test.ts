/*
import {Tab, Diff, Addition, Deletion} from '../models/git';
import * as logic from '../libs/logic/git';

test('return 0 deltas on equivalent tab arrays 1', () => {
    let a: Tab[] = [{url: "a"} as Tab];
    let b: Tab[] = [{url: "a"} as Tab];
    expect(logic.diff(a, b)).toEqual({additions: [], deletions: []});
});

test('return 0 deltas on equivalent tab arrays 2', () => {
    let a: Tab[] = [{url: "a"} as Tab, {url: "a"} as Tab];
    let b: Tab[] = [{url: "a"} as Tab, {url: "a"} as Tab];
    expect(logic.diff(a, b)).toEqual({"additions": [], "deletions": []});
});

test('return 0 deltas on equivalent tab arrays 3', () => {
    let a: Tab[] = [];
    let b: Tab[] = [];
    expect(logic.diff(a, b)).toEqual({"additions": [], "deletions": []});
});

test('return 0 deltas on equivalent tab arrays 4', () => {
    let a: Tab[] = [{url: "a"} as Tab, {url: "b"} as Tab];
    let b: Tab[] = [{url: "a"} as Tab, {url: "b"} as Tab];
    expect(logic.diff(a, b)).toEqual({additions: [], deletions: []});
});

test('returns correct delta on two different tab arrays', () => {
    let a: Tab[] = [{url: "a"} as Tab, {url: "b"} as Tab];
    let b: Tab[] = [{url: "b"} as Tab, {url: "c"} as Tab];
    expect(logic.diff(a, b)).toEqual(expect.objectContaining(
        {
            additions: [{tab: {url: "c"}, after: 1}], // index in the original array
            deletions: [{index: 0}]
        })
    );
});

test('returns correct delta with multiple changes on two different tab arrays', () => {
    let a: Tab[] = [{url: "a"} as Tab, {url: "b"} as Tab];
    let b: Tab[] = [{url: "c"} as Tab, {url: "d"} as Tab];
    expect(logic.diff(a, b)).toEqual(expect.objectContaining(
        {
            additions: [{tab: {url: "c"}, after: -1}, {tab: {url: "d"}, after: -1}],
            deletions: [{index: 0}, {index: 1}]
        })
    );
});

test('applies patch correctly', () => {
    let a: Tab[] = [{url: "a"} as Tab, {url: "b"} as Tab];
    let b: Tab[] = [{url: "b"} as Tab, {url: "c"} as Tab];
    const delta: Diff = {
        additions: [{tab: {url: "c"} as Tab, after: 1}],
        deletions: [{index: 0}]
    };
    expect(logic.apply(a, delta)).toEqual(b);
});

test('applies patch correctly with multiple changes', () => {
    let a: Tab[] = [{url: "a"} as Tab, {url: "b"} as Tab];
    let b: Tab[] = [{url: "c"} as Tab, {url: "d"} as Tab];
    const delta: Diff = {
        additions: [{tab: {url: "c"} as Tab, after: 0}, {tab: {url: "d"} as Tab, after: 1}],
        deletions: [{index: 0}, {index: 1}]
    };
    expect(logic.apply(a, delta)).toEqual(b);
});

test('applies patch correctly with interleaved changes', () => {
    let a: Tab[] = [{url: "a"} as Tab, {url: "b"} as Tab, {url: "e"} as Tab];
    let b: Tab[] = [{url: "c"} as Tab, {url: "b"} as Tab, {url: "d"} as Tab];
    const delta: Diff = {
        additions: [{tab: {url: "c"} as Tab, after: 0}, {tab: {url: "d"} as Tab, after: 2}],
        deletions: [{index: 0}, {index: 2}]
    };
    expect(logic.apply(a, delta)).toEqual(b);
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

    const diff = logic.diff(a, b);
    const applied = logic.apply(a, diff);

    expect(applied.map(t => t.url)).toEqual(b.map(t => t.url));
});

test('test false-match corruption bug', () => {
    const a: Tab[] = [
        {url: 'match_early'},
        {url: 'target'},
        {url: 'extra'}
    ] as Tab[];

    const b: Tab[] = [
        {url: 'match_early'},
        {url: 'target'},
        {url: 'inserted_tab'},
        {url: 'extra'}
    ] as Tab[];

    const diff = logic.diff(a, b);
    const applied = logic.apply(a, diff);

    expect(applied.map(t => t.url)).toEqual(b.map(t => t.url));
});

// Force inner loop to see k = -1 (max = 1)
test('inserting into empty original (forces k negative)', () => {
    const a: Tab[] = [];
    const b: Tab[] = [{url: 'x'} as Tab];

    // Expect one addition at the very start: after = -1 (insert before any original)
    expect(logic.diff(a, b)).toEqual(
        expect.objectContaining({
            additions: [{tab: {url: 'x'} as Tab, after: -1}],
            deletions: []
        })
    );
});

// Replace single element: deletion + insertion at start (also forces k = -1)
test('replace single element (delete 0 + add at start) — exercises negative k', () => {
    const a: Tab[] = [{url: 'a'} as Tab];
    const b: Tab[] = [{url: 'b'} as Tab];

    // One deletion at index 0, and one addition inserted at start (after = -1)
    expect(logic.diff(a, b)).toEqual(
        expect.objectContaining({
            additions: [{tab: {url: 'b'} as Tab, after: -1}],
            deletions: [{index: 0}]
        })
    );
});

// Helper
const urls = (...s: string[]) => s.map(u => ({url: u} as Tab));

test('duplicate tabs: only one instance removed', () => {
    const a = urls('x', 'x', 'y');
    const b = urls('x', 'y');
    const d = logic.diff(a, b);
    const applied = logic.apply(a, d);
    expect(applied.map(t => t.url)).toEqual(b.map(t => t.url));
    // Expect one deletion only
    expect(d.deletions.length).toBe(1);
});

test('order-only change: permutation preserved if algorithm treats reorder as no-op', () => {
    const a = urls('a', 'b', 'c');
    const b = urls('c', 'b', 'a');
    const d = logic.diff(a, b);
    const applied = logic.apply(a, d);
    expect(applied.map(t => t.url)).toEqual(b.map(t => t.url));
    // Either empty del/adds or consistent ops — verify round-trip
    expect(logic.apply(applied, logic.diff(applied, a)).map(t => t.url)).toEqual(a.map(t => t.url));
});

test('multiple insertions at same after index keep stable ordering', () => {
    const a = urls('k1', 'k2');
    const b = [
        {url: 'k1'} as Tab,
        {url: 'insA'} as Tab,
        {url: 'insB'} as Tab,
        {url: 'k2'} as Tab
    ];
    const d = logic.diff(a, b);
    const applied = logic.apply(a, d);
    expect(applied.map(t => t.url)).toEqual(b.map(t => t.url));
    // Check inserted order preserved (insA then insB)
    const inserted = d.additions.filter(x => x.tab.url.startsWith('ins')).map(x => x.tab.url);
    expect(inserted).toEqual(['insA', 'insB']);
});

test('concurrent insertion and deletion at same index', () => {
    // delete index 1 and insert after index 0 in same area
    const a = urls('a', 'toDelete', 'c');
    const b = urls('a', 'insAfter0', 'c');
    const d = logic.diff(a, b);
    const applied = logic.apply(a, d);
    expect(applied.map(t => t.url)).toEqual(b.map(t => t.url));
});

test('inserts at boundaries: start (-1), end (last index), and into empty original', () => {
    // start
    let a = urls('m');
    let b = [{url: 'start'} as Tab, ...a];
    let d = logic.diff(a, b);
    expect(d.additions.some(x => x.after === -1 && x.tab.url === 'start')).toBe(true);
    expect(logic.apply(a, d).map(t => t.url)).toEqual(b.map(t => t.url));

    // end
    a = urls('m1', 'm2');
    b = [...a, {url: 'end'} as Tab];
    d = logic.diff(a, b);
    expect(d.additions.some(x => x.after === a.length - 1 && x.tab.url === 'end')).toBe(true);
    expect(logic.apply(a, d).map(t => t.url)).toEqual(b.map(t => t.url));

    // empty original
    a = [];
    b = urls('only');
    d = logic.diff(a, b);
    expect(d.additions.length).toBeGreaterThan(0);
    expect(d.additions[0].after).toBe(-1);
    expect(logic.apply(a, d).map(t => t.url)).toEqual(b.map(t => t.url));
});

test('non-contiguous deletions + interleaved insertions', () => {
    const a = urls('k1', 'x', 'k2', 'y', 'k3');
    const b = urls('k1', 'k2', 'ins', 'k3');
    const d = logic.diff(a, b);
    const applied = logic.apply(a, d);
    expect(applied.map(t => t.url)).toEqual(b.map(t => t.url));
});

test('replace semantics: single element replaced via del+add', () => {
    const a = urls('a');
    const b = urls('b');
    const d = logic.diff(a, b);
    const applied = logic.apply(a, d);
    expect(applied.map(t => t.url)).toEqual(b.map(t => t.url));
    // Expect at least one deletion and one addition
    expect(d.deletions.length).toBeGreaterThanOrEqual(1);
    expect(d.additions.length).toBeGreaterThanOrEqual(1);
});

test('idempotence and round-trip', () => {
    const a = urls('p', 'q', 'r');
    const b = urls('p', 'r', 's');
    const d = logic.diff(a, b);
    const applied = logic.apply(a, d);
    expect(applied.map(t => t.url)).toEqual(b.map(t => t.url));
    // diff(a,a) empty
    expect(logic.diff(a, a)).toEqual({additions: [], deletions: []});
    // diff(b,a) applied after applying d should return original a
    const back = logic.apply(b, logic.diff(b, a));
    expect(back.map(t => t.url)).toEqual(a.map(t => t.url));
});

test('moderate large array round-trip (performance/regression smoke)', () => {
    const n = 500;
    const a = Array.from({length: n}, (_, i) => ({url: `u${i}`} as Tab));
    // make some deletes and inserts
    const b = a.filter((_, i) => i % 10 !== 0).slice(); // delete every 10th
    b.splice(5, 0, {url: 'ins1'} as Tab);
    b.splice(200, 0, {url: 'ins2'} as Tab);
    const d = logic.diff(a, b);
    const applied = logic.apply(a, d);
    expect(applied.map(t => t.url)).toEqual(b.map(t => t.url));
});
*/
