import React, {useEffect, useState} from 'react';
import '../Frontend.css';
import {RepositoryStore} from '../../repository/repository';
import {Repository} from '../../models/repository';
import {CDMessage, CommitMessage, MkDirMessage, RmMessage} from '../../models/messages';
import CommandPalette from '../components/CommandPalette';
import Sidebar from '../components/Sidebar';

interface Props {
}

const Main: React.FC<Props> = ({}: Props) => {
    const [repos, setRepos] = useState<Repository[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<Repository>();

    useEffect(() => {
        async function fetchRepos() {
            let repo = new RepositoryStore(chrome.storage.local);
            if (!(await repo.initialized())) {
                await repo.init();
            }
            setRepos(await (new RepositoryStore(chrome.storage.local).read()!));
            console.log(repos);
        }
        fetchRepos();
        async function fetchFromUrlParams() {
            console.log("fetching from url params");
            let url = window.location.href;
            let params = new URLSearchParams(url.split("?")[1]);
            if (params.has("repo-name") && params.has("repo-owner")) {
                let repo: Repository = { owner: params.get("repo-owner")!, name: params.get("repo-name")! };
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
        let repo: Repository = {owner: "me", name: name} // me is the default for the current user
        await new RepositoryStore(chrome.storage.local).create(repo);
        setRepos([...repos, repo]);
        setSelectedRepo(repo);
        await handleCommitToRepo(repo);
        await handleOpenRepo(repo);
    }

    const handleMkRepo = async (name: string) => {
        let repo: Repository = {owner: "me", name: name}
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
                } else {
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
