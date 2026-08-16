import React, {useEffect, useMemo, useState} from 'react';
import MermaidDiagram from '../components/MermaidDiagram';
import mermaid from 'mermaid';
import './Main.css'
import Sidebar from '../components/Sidebar/Sidebar';
import {useLocation, useNavigate} from 'react-router-dom';
import CommandPalette from '../components/CommandPalette';
import {Command, Message, RenderMermaidMessage} from 'src/models/messages';
import * as db from 'src/libs/db/storage';
import {getCurrentlyFocusedRepoId} from 'src/libs/helpers';
import {Repository} from 'src/models/git';
import {callbackify} from 'util';
import {fetchCurrentlyOpenedBranchForRepo} from 'src/libs/db/state';

interface Props {}

const Main: React.FC<Props> = () => {
    let [repos, setRepos] = useState<Repository[]>([]);
    let [chart, setChart] = useState<string>("no chart to render");

    const navigate = useNavigate();

    const [selectedRepo, setSelectedRepo] = useState<Repository | undefined>(undefined);
    const [selectedBranch, setSelectedBranch] = useState<string | undefined>(undefined);
    const [availableBranches, setAvailableBranches] = useState<string[]>([]);

    async function fetchRepos() {
        const data = await db.fetchRepositories();
        console.log("data", data);
        if (data) {
            setRepos(data);
            repos = data;
        }
    }

    const callBack = async (message: any) => {
        if (message.kind === "hookCommandExecuted" || message === "init") {
            console.log("command executed")
            await fetchRepos();
            console.log(repos);
            getCurrentlyFocusedRepoId().then((result) => {
                console.log("repo id: ", result);
                if (result.isOk) {
                    const repo = repos.find((r) => r.id === result.value);
                    navigate(`/?repo-id=${result.value}`);
                    db.fetchBranchesForRepo(result.value).then((branches) => {
                        if (branches.isOk) {
                            setAvailableBranches(branches.value.map((b) => b.name));
                        }
                    })
                    setSelectedRepo(repo);
                    fetchCurrentlyOpenedBranchForRepo(result.value).then((branchResult) => {
                        db.fetchBranchById(branchResult).then((branch) => {
                            if (branch.isOk) {
                                setSelectedBranch(branch.value.name);
                            }
                        })
                    })
                    console.log(repos);
                    console.log("found: ", repos.find((r) => r.id === result.value));
                }
            });
            chrome.runtime.sendMessage({kind: "rendermermaid"} satisfies RenderMermaidMessage).then((mermaidResult: {success: boolean, error?: string, diagram?: string}) => {
                if (mermaidResult.success) {
                    chart = mermaidResult.diagram!
                    setChart(mermaidResult.diagram!)
                } else {
                    chart = "Could not render commit graph for some reason"
                    setChart("Could not render commit graph for some reason")
                    console.log(mermaidResult.error)
                }
            });
            console.log("chart: ", chart)
        }
    }
    useEffect(() => {
        mermaid.initialize({startOnLoad: true});
        callBack("init");
        console.log("initialized")
        fetchRepos();
        console.log(repos);
        chrome.runtime.sendMessage({kind: "rendermermaid"} satisfies RenderMermaidMessage).then((mermaidResult: {success: boolean, error?: string, diagram?: string}) => {
            if (mermaidResult.success) {
                setChart(mermaidResult.diagram!)
            } else {
                setChart("Could not render commit graph for some reason")
                console.log(mermaidResult.error)
            }
        });
        console.log("chart: ", chart)
        chrome.runtime.onMessage.addListener(callBack);
        return () => chrome.runtime.onMessage.removeListener(callBack);
    }, []);

    let pallete = <CommandPalette commands={[
        {
            name: "commit",
            args: ["String"],
        },
        {
            name: "rm",
            args: ["RepositoryName"],
        },
        {
            name: "edit",
            args: ["String"],
        },
        {
            name: "touch",
            args: ["String"],
        },
        {
            name: "init",
            args: ["String"],
        },
        {
            name: "mv",
            args: ["RepositoryName", "String"],
        },
        {
            name: "branch",
            args: ["String"],
        },
        {
            name: "checkout",
            args: ["String"],
        },
        {
            name: "merge",
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
                <span><h2>{selectedBranch ? selectedBranch : "no branch selected"}</h2> | {availableBranches.length > 0 ? availableBranches.filter((b) => b !== selectedBranch).join(" ") : "no branches available"}</span>
                <div className="repo-content">
                    <MermaidDiagram chart={chart} className="mermaid_diagram" />
                </div>
            </div>
        </div>
    );
};

export default Main;
