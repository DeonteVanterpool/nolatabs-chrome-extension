import React, {useEffect, useState} from 'react';
import '../Frontend.css';
import {RepositoryStore} from '../../repository/repository';
import {Repository} from '../../models/repository';
import {CDMessage, CommitMessage, MkDirMessage, MVMessage, RmMessage} from '../../models/messages';
import Sidebar from '../components/Sidebar/Sidebar';
import {useLocation, useNavigate} from 'react-router-dom';

interface Props {}

const Main: React.FC<Props> = () => {
    const [repos, setRepos] = useState<Repository[]>([]);

    const navigate = useNavigate();
    const {search} = useLocation();

    const searchParams = new URLSearchParams(search);
    const owner = searchParams.get("repo-owner");
    const name = searchParams.get("repo-name");

    const selectedRepo: Repository | undefined = name && owner ? {owner, name, branches: []} : undefined;

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
    }, []);

    useEffect(() => {
        if (selectedRepo) {
            chrome.runtime.sendMessage(CDMessage.new(selectedRepo));
        }
    }, [name, owner]);

    const handleInitRepo = async (repoName: string) => {
        const repo: Repository = {owner: "me", name: repoName, branches: []};
        await RepositoryStore.create(chrome.storage.local, repo);
        await handleCommitToRepo(repo);
        await handleOpenRepo(repo);
    };

    const handleMkRepo = async (repoName: string) => {
        const repo: Repository = {owner: "me", name: repoName, branches: []};
        await chrome.runtime.sendMessage(MkDirMessage.new(repoName));
        await handleOpenRepo(repo);
    };

    const handleRmRepo = async (repo: Repository) => {
        await chrome.runtime.sendMessage(RmMessage.new(repo));
        await fetchRepos();

        if (name === repo.name && owner === repo.owner) {
            navigate("");
        }
    };

    const handleOpenRepo = async (repo: Repository) => {
        await chrome.runtime.sendMessage(CDMessage.new(repo));

        navigate(`?repo-name=${encodeURIComponent(repo.name)}&repo-owner=${encodeURIComponent(repo.owner)}`);
        return repo;
    };

    const handleMvRepo = async (repo: Repository, newName: string) => {
        await chrome.runtime.sendMessage(MVMessage.new(repo, newName));
        await fetchRepos();

        navigate(`?repo-name=${encodeURIComponent(newName)}&repo-owner=${encodeURIComponent(repo.owner)}`);
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
