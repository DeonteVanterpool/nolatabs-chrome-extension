import React, {ChangeEvent, useState} from 'react';
import Logo from '../../../../assets/img/logo.svg';
import {Repository} from '../../../models/repository';
import CommandPalette from '../CommandPalette';
import './Sidebar.css';
import Button from '../Button/Button';

interface Props {
    repos: Repository[];
    commandPalette: React.JSX.Element;
    selectedRepo: Repository | undefined;
}

const Sidebar: React.FC<Props> = ({repos, commandPalette, selectedRepo}: Props) => {
    let [newRepoName, setNewRepoName] = useState("");
    const handleNewRepoNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setNewRepoName(e.target.value);
    };

    return <div className="sidebar">
        <Logo className="logo" />
        {commandPalette}
        <div className="repositories">
            Repositories:
        </div>
        <ul className="Sidebar">
            {repos.map((repo) => {
                if (selectedRepo && repo.name === selectedRepo.name && repo.owner === selectedRepo.owner) {
                    return <li className="selected">{repo.name}</li>
                }
                return <li>{repo.name}</li>;
            })}
        </ul>
        <div className="bottom">
            <Button onClick={() => {}} label="Settings" variant="borderless" theme="foreground" />
            <Button onClick={() => {}} label="Log Out" variant="borderless" theme="primary" />
        </div>
    </div>;
};

export default Sidebar;
