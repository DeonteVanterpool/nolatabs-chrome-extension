## Commits
```
Commit {
    hash: string;
    author: string;
    timestamp: Date;
    message: string;
    deltas: CommitDiff;
    base: string | null = null; // hash of parent commit, null if no parent (initial commit)
}
```

This is the structure of a commit as of `2025-08-30`. You maybe wondering why we don't store the children of each commit. It isn't uncommon to want to move forward in commit history. For example, building snapshots requires you to go from the root, and continually move forward while applying deltas to the current commit's state. Storing children seems like it would help with that, but this (mostly) an illusion.

![Image of Incorrect Snapshot Building Dillemma]

#### Problem 1
The first problem is that commit history is a graph, and not a line. "Backwards" exists if we store the parents, since the graph is directional and flows one way (toward the root). However, "forwards" doesn't theoretically exist, since there are multiple paths away from the initial commit. This means that you can't theoretically go backwards to the initial commit, then build the snapshots without doing one of the following options:
- traversing the entire graph until you find the original commit
- store the previous nodes of each commit in a list
- store the beginning of each new branch, or the index of previous commit when a commit with multiple children

Each of these three options is either inefficient, or adds a lot more complexity. 

#### Problem 2
The second problem is that there is redundant data in storage (children, and parents). This redundancy leads to:
- **difficulty for others to make changes:** New contributers must know that children and parents must be kept in a correct and valid state following each storage operation
- **wasted storage:** You must store the parents and children. If you don't store the children (or the parents), in order to build a proper commit object, you will have to search for other commits where the current commit is the parent, which is inefficient, and complex, and forces more coupling

Since we aren't storing children, this isn't without tradeoffs. Building a snapshot from initial commit requires us to know the next child in the path, which can't be derived easily. If this shows to be inefficient, we can store periodic snapshots at intervals. These snapshots can be stored in a cache, so that we don't have to build new snapshots entirely from initial commit. 

This cache, however, adds some extra complexity, and must be maintained. Thankfully, commits are immutable (it is that way in Git). Therefore, there aren't many scenarios in which the snapshot cache would have to be invalidated.

