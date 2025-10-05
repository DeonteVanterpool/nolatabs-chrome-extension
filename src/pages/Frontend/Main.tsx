import React, {ChangeEvent, FormEvent, useEffect, useState} from 'react';
import './Frontend.css';
import Sidebar from './Sidebar';
import {RepositoryService} from '../services/repository';
import {RepositoryRepository} from '../repository/repository';
import {Repository} from '../models/repository';
import {CDMessage, CommitMessage} from '../models/messages';
import {CommitRepository} from '../repository/commit';

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
            setRepos((await new RepositoryService(new RepositoryRepository(chrome.storage.local)).list()!));
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

    const handleNewRepo = (name: string) => {
        let repo: Repository = {owner: "me", name: name} // me is the default for the current user
        new RepositoryService(new RepositoryRepository(chrome.storage.local)).new(repo);
        setRepos([...repos, repo]);
    }

    const handleOpenRepo = async (repo: Repository) => {
        setSelectedRepo(repo);
        await chrome.runtime.sendMessage(CDMessage.new(repo));
        return repo;
    }

    const handleCommit = async () => {
        await chrome.runtime.sendMessage(CommitMessage.new("just commited", selectedRepo!));
    }

    return <div className="Main">
        <Sidebar repos={[...repos]} handleNewRepo={handleNewRepo} handleOpenRepo={handleOpenRepo} />
        <div className="content">
        {selectedRepo ? selectedRepo.name : "no repo selected"}
        <button onClick={handleCommit}>Commit</button>
        </div>
    </div>;
};

export default Main;
