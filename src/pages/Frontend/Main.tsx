import React, {ChangeEvent, FormEvent, useEffect, useState} from 'react';
import './Frontend.css';
import Sidebar from './Sidebar';
import {RepositoryService} from '../services/repository';
import {RepositoryRepository} from '../repository/repository';
import {Repository} from '../models/repository';
import {CDMessage, CommitMessage} from '../models/messages';
import {CommitRepository} from '../repository/commit';
import CommandPalette from './CommandPalette';

interface Props {
}

const Main: React.FC<Props> = ({}: Props) => {
    const [repos, setRepos] = useState<Repository[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<Repository>();

    useEffect(() => {
        async function fetchRepos() {
            let repo = new RepositoryRepository(chrome.storage.local);
            if (!(await repo.initialized())) {
                await repo.init();
            }
            setRepos(await (new RepositoryRepository(chrome.storage.local).read()!));
            console.log(repos);
        }
        fetchRepos();
    }, []);

    useEffect(() => {
        async function setRepositories() {
            setRepos(repos);
        }
        setRepositories();
    }, [repos]);

    const handleInitRepo = async (name: string) => {
        let repo: Repository = {owner: "me", name: name} // me is the default for the current user
        await new RepositoryRepository(chrome.storage.local).create(repo);
        setRepos([...repos, repo]);
        setSelectedRepo(repo);
        await handleCommitToRepo(repo);
        await handleOpenRepo(repo);
    }

    const handleMkRepo = async (name: string) => {
        let repo: Repository = {owner: "me", name: name} // me is the default for the current user
        await new RepositoryRepository(chrome.storage.local).create(repo);
        setRepos([...repos, repo]);
        setSelectedRepo(repo);
        await handleOpenRepo(repo);
    }
    const handleOpenRepo = async (repo: Repository) => {
        setSelectedRepo(repo);
        await chrome.runtime.sendMessage(CDMessage.new(repo));
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
        </div>
        <CommandPalette commandHandler={async (command: string[]) => {
            console.log(command);
            if (command[0] === "mkrepo") {
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
                    await new RepositoryRepository(chrome.storage.local).delete(repo);
                    setRepos(repos.filter((r) => r.name !== command[1]));
                    if (selectedRepo?.name === command[1]) {
                        setSelectedRepo(undefined);
                    }
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
                name: "mkrepo",
                args: ["String"],
            }
        ]} repoNames={repos.map((r) => r.name)} />
    </div>;
};

export default Main;
