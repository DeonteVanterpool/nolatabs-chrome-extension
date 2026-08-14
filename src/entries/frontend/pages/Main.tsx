import React, {useEffect, useMemo, useState} from 'react';
import './Main.css'
import Sidebar from '../components/Sidebar/Sidebar';
import {useLocation, useNavigate} from 'react-router-dom';
import CommandPalette from '../components/CommandPalette';
import {Command} from 'src/models/messages';
import * as db from 'src/libs/db/storage';
import {Repository} from 'src/models/git';

interface Props {}

const Main: React.FC<Props> = () => {
    const [repos, setRepos] = useState<Repository[]>([]);

    const navigate = useNavigate();
    const {search} = useLocation();

    const searchParams = new URLSearchParams(search);
    const repoId = searchParams.get("repo-id");
    const selectedRepo = useMemo(() => {
        if (!repoId) return undefined;
        return repos.find((r) => r.id === repoId);
    }, [repoId, repos]);

    async function fetchRepos() {
        const data = await db.fetchRepositories();
        if (data) {
            setRepos(data);
        }
    }

    useEffect(() => {
        fetchRepos();
    }, []);

    useEffect(() => {
        if (selectedRepo !== undefined ) {
            chrome.runtime.sendMessage({kind: "command", action: "cd", args: [selectedRepo.id]} satisfies Command);
        }
    }, [selectedRepo]);

    let pallete = <CommandPalette commands={[
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
    ]}
        apply={(exec) => {
            chrome.runtime.sendMessage({kind: "command", action: exec.command, args: exec.args} satisfies Command);
        }}
        repoNames={repos.map((r) => r.name)} />

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
