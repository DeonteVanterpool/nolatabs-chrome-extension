import React, { useEffect, useState } from 'react';
import '../Frontend.css';
import { RepositoryStore } from '../../repository/repository';
import { Repository } from '../../models/repository';
import { CDMessage, CommitMessage, MkDirMessage, MVMessage, RmMessage } from '../../models/messages';
import Sidebar from '../components/Sidebar';

interface Props {}

const Main: React.FC<Props> = () => {
    const [repos, setRepos] = useState<Repository[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<Repository>();

    async function fetchRepos() {
        if (!(await RepositoryStore.initialized(chrome.storage.local))) {
            await RepositoryStore.init(chrome.storage.local);
        }
        const data = await RepositoryStore.read(chrome.storage.local);
        if (data) {
            setRepos(data);
        }
    }

    useEffect(() => {
        fetchRepos();

        function fetchFromUrlParams() {
            const url = window.location.href;
            if (url.includes("?")) {
                const params = new URLSearchParams(url.split("?")[1]);
                if (params.has("repo-name") && params.has("repo-owner")) {
                    const repo: Repository = {
                        owner: params.get("repo-owner")!,
                        name: params.get("repo-name")!,
                        branches: []
                    };
                    setSelectedRepo(repo);
                }
            }
        }
        fetchFromUrlParams();
    }, []);

    const handleInitRepo = async (name: string) => {
        const repo: Repository = { owner: "me", name: name, branches: [] };
        await RepositoryStore.create(chrome.storage.local, repo);
        await handleCommitToRepo(repo);
        await handleOpenRepo(repo);
    };

    const handleMkRepo = async (name: string) => {
        const repo: Repository = { owner: "me", name: name, branches: [] };
        await chrome.runtime.sendMessage(MkDirMessage.new(name));
        await handleOpenRepo(repo);
    };

    const handleRmRepo = async (repo: Repository) => {
        await chrome.runtime.sendMessage(RmMessage.new(repo));
        await fetchRepos();
        
        if (selectedRepo?.name === repo.name && selectedRepo?.owner === repo.owner) {
            setSelectedRepo(undefined);
        }
    };

    const handleOpenRepo = async (repo: Repository) => {
        await chrome.runtime.sendMessage(CDMessage.new(repo));
        
        const url = window.location.href;
        const params = new URLSearchParams(url.split("?")[1] || "");
        params.set("repo-name", repo.name);
        params.set("repo-owner", repo.owner);
        window.location.href = url.split("?")[0] + "?" + params.toString();
        
        return repo;
    };

    const handleMvRepo = async (repo: Repository, newName: string) => {
        await chrome.runtime.sendMessage(MVMessage.new(repo, newName));

        window.location.href = window.location.href.split("?")[0] + "?repo-name=" + newName + "&repo-owner=" + repo.owner;
    };

    const handleCommitToRepo = async (repo: Repository) => {
        await chrome.runtime.sendMessage(CommitMessage.new("just committed", repo));
    };

    const handleCommit = async () => {
        if (selectedRepo) {
            await chrome.runtime.sendMessage(CommitMessage.new("just committed", selectedRepo));
        } else {
            console.warn("Cannot commit: No repository selected");
        }
    };

    return (
        <div className="Main">
            <Sidebar 
                repos={repos} 
                handleNewRepo={handleInitRepo} 
                handleOpenRepo={handleOpenRepo} 
                handleCommit={handleCommit} 
                handleMvRepo={handleMvRepo} 
                handleMkRepo={handleMkRepo} 
                handleInitRepo={handleInitRepo} 
                handleRmRepo={handleRmRepo} 
                selectedRepo={selectedRepo} 
            />
            <div className="content">
                {selectedRepo ? selectedRepo.name : "no repo selected"}
            </div>
        </div>
    );
};

export default Main;
