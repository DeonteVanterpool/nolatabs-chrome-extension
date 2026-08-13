import React from 'react';
import Logo from 'src/assets/img/logo.svg';
import {Repository} from 'src/models/git';
import './Sidebar.css';
import Button from '../Button/Button';

interface Props {
    repos: Repository[];
    commandPalette: React.JSX.Element;
    selectedRepo: Repository | undefined;
}

const Sidebar: React.FC<Props> = ({repos, commandPalette, selectedRepo}: Props) => {
    return <div className="sidebar">
        <Logo className="logo" />
        {commandPalette}
        <div className="repositories">
            Repositories:
        </div>
        <ul>
            {repos.map((repo) => {
                if (selectedRepo && repo.name === selectedRepo.name && repo.ownerId === selectedRepo.ownerId) {
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
