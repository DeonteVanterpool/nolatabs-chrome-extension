## Commits: storing parents but not children
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

![Image of Incorrect Snapshot Building Dilemma](https://github.com/DeonteVanterpool/nolatabs-chrome-extension/blob/main/documentation/assets/buildingSnapshots.jpg?raw=true)

#### Multiple Paths from Root to Later Node
The first problem is that commit history is a graph, and not a line. This means that "backwards" exists if we store the parents, since the graph is directional and flows one way (toward the root). However, the idea of moving "forwards" in a direct acyclic graph doesn't exists, since there can be multiple paths away from the initial commit. This creates a problem with regards to efficiency because if we want to build a snapshot from the initial commit, we have to know which path to take. Unless we want to try each path until we find the correct one, which is inefficient, we have to store some extra data to know which path to take. Therefore, storing children doesn't actually solve the problem of building snapshots, and makes that algorithm more inefficient since we still have to know which child to take. Nor does it solve the second problem.

#### Redundant Data
The second problem is that there is redundant data in storage (children, and parents). This redundancy leads to:
- **difficulty for others to make changes:** New contributers must know that children and parents must be kept in the same state following each storage operation
- **wasted storage:** You must store the parents and children. If you don't have that data, and you need it, you must get it somehow, which adds unnecessary complexity.

Since we aren't storing children, this isn't without tradeoffs. Building a snapshot from initial commit requires us to know the next child in the path, which can't be derived directly. If this shows to be inefficient, we can store periodic snapshots at intervals. These snapshots can be stored in a cache, so that we don't have to build new snapshots entirely from initial commit. 

This cache, however, adds some extra complexity, and must be maintained. Thankfully, commits are immutable (it is that way in Git). Therefore, there aren't many scenarios in which the snapshot cache would have to be invalidated.

## Using interfaces and types instead of classes for data models

It is important to separate data from behaviour. Using classes for data models can lead to a lot of coupling between the data and the behaviour. Although using classes can help with encapsulation, using classes is unsustainable for the following reasons:
- **Data Passing**: The main reason for using interfaces and types is because in the chrome API, we often need to serialize and deserialize data when storing it in `chrome.storage`, or send it through the `Messing` api. Using classes would make this more difficult, since the behaviour of the classes is lost when serializing and deserializing. Using interfaces and types allows us to easily serialize and deserialize our data without losing any functionality, or having to initialize the classes with redundant data. There is also no warning that behaviour is lost when passing messages containing class instances, which can lead to bugs if not aware of the fact.
- **Testing**: Using interfaces and types makes it easier to mock data for testing. When using classes, you often have to create instances of the classes in order to test them, which can be more difficult and time-consuming than simply creating objects that conform to the interfaces or types. This is especially true when the classes have complex constructors or dependencies. Or you could make interfaces for the class or use abstract classes, but that adds more complexity and boilerplate code. Using interfaces and types allows us to easily create mock data for testing without having to worry about the complexities of class instantiation.

