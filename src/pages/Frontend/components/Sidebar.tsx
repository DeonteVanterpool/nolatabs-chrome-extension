import React, {ChangeEvent, FormEvent, useState} from 'react';
import '../Frontend.css';
import {Repository} from '../../models/repository';
import CommandPalette from './CommandPalette';
interface Props {
    repos: Repository[];
    handleNewRepo: (name: string) => void;
    handleOpenRepo: (repository: Repository) => Promise<Repository>;
    handleMkRepo: (name: string) => Promise<void>;
    handleInitRepo: (name: string) => Promise<void>;
    handleCommit: () => Promise<void>;
    handleRmRepo: (repo: Repository) => void;
    handleMvRepo: (repo: Repository, name: string) => Promise<void>;
    selectedRepo: Repository | undefined;
}

const Sidebar: React.FC<Props> = ({repos, handleNewRepo, handleOpenRepo, handleMkRepo, handleInitRepo, handleCommit, handleRmRepo, handleMvRepo, selectedRepo}: Props) => {
    let [newRepoName, setNewRepoName] = useState("");
    const handleNewRepoNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setNewRepoName(e.target.value);
    };
    const handleClick = () => {
        let repoName = newRepoName;
        handleNewRepo(repoName);
        setNewRepoName("")
    }

    const handleRepoClick = (repo: Repository) => {
        handleOpenRepo(repo);
    }

    return <ul className="Sidebar">
            <CommandPalette commandHandler={async (command: string[]) => {
                console.log(command);
                if (command[0] === "mkdir") {
                    await handleMkRepo(command[1]);
                } else if (command[0] === "init") {
                    await handleInitRepo(command[1]);
                } else if (command[0] === "cd") {
                    let repo = repos.find((r) => r.name === command[1]);
                    if (repo) {
                        await handleOpenRepo(repo);
                    } else {
                        alert("Repository not found");
                    }
                } else if (command[0] === "commit") {
                    await handleCommit();
                } else if (command[0] === "rm") {
                    let repo = repos.find((r) => r.name === command[1]);
                    if (repo) {
                        handleRmRepo(repo);
                    } else {
                        alert("Repository not found");
                    }
                } else if (command[0] === "help") {
                    alert("Available commands:\n- mkdir [name]: create a new repository\n- init [name]: create a new repository and commit the current tabs\n- cd [name]: open a repository\n- rm [name]: delete a repository\n- commit: commit the current tabs to the currently opened repository");
                } else if (command[0] === "mv") {
                    let repo = repos.find((r) => r.name === command[1]);
                    if (command[1] === ".") {
                        repo = selectedRepo;
                    }

                    if (repo) {
                        await handleMvRepo(repo, command[2]);
                    } else {
                        alert("Repository not found");
                    }
                }
                else {
                    alert("Unknown command");
                }
            }} commands={[
                {
                    name: "commit",
                    args: ["String"],
                },
                {
                    name: "cd",
                    args: ["RepositoryName"],
                },
                {
                    name: "rm",
                    args: ["RepositoryName"],
                },
                {
                    name: "init",
                    args: ["String"],
                },
                {
                    name: "mkdir",
                    args: ["String"],
                }
            ]} repoNames={repos.map((r) => r.name)} />
        {repos.map((repo) => {
            return <li onClick={() => handleRepoClick(repo)}>{repo.name}</li>;
        })}
    </ul>;
};

export default Sidebar;
