import React, {useEffect, useState} from 'react';
import '../Frontend.css';
import {RepositoryStore} from '../../repository/repository';
import {Repository} from '../../models/repository';
import {CDMessage, CommitMessage, MkDirMessage, MVMessage, RmMessage} from '../../models/messages';
import CommandPalette from '../components/CommandPalette';
import Sidebar from '../components/Sidebar';

interface Props {
}

const Main: React.FC<Props> = ({}: Props) => {
    const [repos, setRepos] = useState<Repository[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<Repository>();

    useEffect(() => {
        async function fetchRepos() {
            if (!(await RepositoryStore.initialized(chrome.storage.local))) {
                await RepositoryStore.init(chrome.storage.local);
            }
            setRepos(await (RepositoryStore.read(chrome.storage.local)!));
            console.log(repos);
        }
        fetchRepos();
        async function fetchFromUrlParams() {
            console.log("fetching from url params");
            let url = window.location.href;
            let params = new URLSearchParams(url.split("?")[1]);
            if (params.has("repo-name") && params.has("repo-owner")) {
                let repo: Repository = { owner: params.get("repo-owner")!, name: params.get("repo-name")!, branches: [] };
                setSelectedRepo(repo);
            }
        }
        fetchFromUrlParams();
    }, []);

    useEffect(() => {
        async function setRepositories() {
            setRepos(repos);
        }
        setRepositories();
    }, [repos]);

    const handleInitRepo = async (name: string) => {
        let repo: Repository = {owner: "me", name: name, branches: []} // me is the default for the current user
        await RepositoryStore.create(chrome.storage.local, repo);
        setRepos([...repos, repo]);
        setSelectedRepo(repo);
        await handleCommitToRepo(repo);
        await handleOpenRepo(repo);
    }

    const handleMkRepo = async (name: string) => {
        let repo: Repository = {owner: "me", name: name, branches: []}
        await chrome.runtime.sendMessage(MkDirMessage.new(name));
        setRepos([...repos, repo]);
        setSelectedRepo(repo);
        await handleOpenRepo(repo);
    }

    const handleRmRepo = async (repo: Repository) => {
        await chrome.runtime.sendMessage(RmMessage.new(repo));
        setRepos(repos.filter((r) => r.name !== repo.name || r.owner !== repo.owner));
        setSelectedRepo(repo);
    }

    const handleOpenRepo = async (repo: Repository) => {
        setSelectedRepo(repo);
        await chrome.runtime.sendMessage(CDMessage.new(repo));
        let url = window.location.href;
        let params = new URLSearchParams(url.split("?")[1]);
        params.set("repo-name", repo.name);
        params.set("repo-owner", repo.owner);
        window.location.href = url.split("?")[0] + "?" + params.toString();
        return repo;
    }

    const handleMvRepo = async (repo: Repository, newName: string) => {
        await chrome.runtime.sendMessage(MVMessage.new(repo, newName));
        window.location.href = window.location.href.split("?")[0] + "?repo-name=" + newName + "&repo-owner=" + repo.owner;
        setRepos(repos.map((r) => r.name === repo.name && r.owner === repo.owner ? {name: newName, owner: r.owner, branches: []} : r));
        if (selectedRepo && selectedRepo.name === repo.name && selectedRepo.owner === repo.owner) {
            setSelectedRepo({name: newName, owner: selectedRepo.owner, branches: []});
        }
    }

    const handleCommitToRepo = async (repo: Repository) => {
        console.log(selectedRepo);
        await chrome.runtime.sendMessage(CommitMessage.new("just commited", repo));
    }
    const handleCommit = async () => {
        console.log(selectedRepo);
        await chrome.runtime.sendMessage(CommitMessage.new("just commited", selectedRepo!));
    }

    return <div className="Main">
        <Sidebar repos={[...repos]} handleNewRepo={handleInitRepo} handleOpenRepo={handleOpenRepo} />
        <div className="content">
            {selectedRepo ? selectedRepo.name : "no repo selected"}
            <button onClick={handleCommit}>Commit</button>
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
        </div>
    </div>;
};

export default Main;
