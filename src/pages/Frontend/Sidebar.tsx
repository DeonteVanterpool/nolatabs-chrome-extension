import React, {ChangeEvent, FormEvent, useState} from 'react';
import './Frontend.css';
import {Repository} from '../models/repository';
interface Props {
    repos: Repository[];
    handleNewRepo: (name: string) => void;
    handleOpenRepo: (repository: Repository) => void;
}

const Sidebar: React.FC<Props> = ({repos, handleNewRepo, handleOpenRepo}: Props) => {
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
        <li><input type="text" value={newRepoName} onChange={handleNewRepoNameChange}></input><button onClick={handleClick}>+</button></li>
        {repos.map((repo) => {
            return <li onClick={() => handleRepoClick(repo)}>{repo.name}</li>;
        })}
    </ul>;
};

export default Sidebar;
