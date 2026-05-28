import React, {useEffect, useState} from 'react';
import {RepositoryStore} from '../../repository/repository';
import './Main.css'
import {Repository} from '../../models/repository';
import {CDMessage, CommitMessage, MkDirMessage, MVMessage, RmMessage} from '../../models/messages';
import Sidebar from '../components/Sidebar/Sidebar';
import {useLocation, useNavigate} from 'react-router-dom';
import CommandPalette from '../components/CommandPalette';

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
        if (selectedRepo && (owner !== selectedRepo.owner || name !== selectedRepo.name)) {
            chrome.runtime.sendMessage(CDMessage.new(selectedRepo));
        }
    }, [name, owner]);

    const handleInitRepo = async (args: string[]) => {
        const repo: Repository = {owner: "me", name: args[0], branches: []};
        await RepositoryStore.create(chrome.storage.local, repo);
        await fetchRepos();
        await handleCommitToRepo(args);
        await handleOpenRepo(args);
    };

    const handleMkRepo = async (args: string[]) => {
        let repoName = args[0];
        await chrome.runtime.sendMessage(MkDirMessage.new(repoName));
        await handleOpenRepo(args);
    };

    const handleRmRepo = async (args: string[]) => {
        let repo = repos.find((r) => r.name === args[0])!;
        await chrome.runtime.sendMessage(RmMessage.new(repo));
        await fetchRepos();

        if (name === repo.name && owner === repo.owner) {
            navigate("");
        }
    };

    const handleOpenRepo = async (args: string[]) => {
        let repo = repos.find((r) => r.name === args[0])!;
        await chrome.runtime.sendMessage(CDMessage.new(repo));

        navigate(`?repo-name=${encodeURIComponent(repo.name)}&repo-owner=${encodeURIComponent(repo.owner)}`);
    };

    const handleMvRepo = async (args: string[]) => {
        let repo = repos.find((r) => r.name === args[0])!;
        let newName = args[1];
        await chrome.runtime.sendMessage(MVMessage.new(repo, newName));
        await fetchRepos();

        await navigate(`?repo-name=${encodeURIComponent(newName)}&repo-owner=${encodeURIComponent(repo.owner)}`);
    };

    const handleCommitToRepo = async (args: string[]) => {
        let repo = repos.find((r) => r.name === args[0])!;
        await chrome.runtime.sendMessage(CommitMessage.new("just committed", repo));
    };

    const handleCommit = async () => {
        if (selectedRepo) {
            await chrome.runtime.sendMessage(CommitMessage.new("just committed", selectedRepo));
        } else {
            console.warn("Cannot commit: No repository selected");
        }
    };

    let pallete = <CommandPalette commands={[
        {
            name: "commit",
            args: ["String"],
            apply: handleCommit,
        },
        {
            name: "cd",
            args: ["RepositoryName"],
            apply: handleOpenRepo,
        },
        {
            name: "rm",
            args: ["RepositoryName"],
            apply: handleRmRepo,
        },
        {
            name: "init",
            args: ["String"],
            apply: handleInitRepo,
        },
        {
            name: "mkdir",
            args: ["String"],
            apply: handleMkRepo,
        }
    ]} repoNames={repos.map((r) => r.name)} />

    return (
        <div className="Main">
            <Sidebar
                repos={repos}
                commandPalette={pallete}
                selectedRepo={selectedRepo}
            />
            <div className="content">
                <h1>{selectedRepo ? selectedRepo.name : "no repo selected"}</h1>
            </div>
        </div>
    );
};

export default Main;
