import React, {ChangeEvent, FormEvent, useState} from 'react';
import './Frontend.css';
import {UserService} from '../services/user';
import {UserRepository} from '../repository/user';
import {User} from '../models/user';

interface Props {
    commandHandler: (command: string[]) => void;
}

let commands = [
    {
        name: "commit",
        args: "message: String",
    },
    {
        name: "open",
        args: "RepositoryName",
    },
    {
        name: "delete",
        args: "RepositoryName",
    },
    {
        name: "init",
        args: "repoName: String",
    },
    {
        name: "mkrepo",
        args: "repoName: String",
    }
]

const Frontend: React.FC<Props> = ({commandHandler: commandHandler}: Props) => {
    let [command, setCommand] = useState<string[]>([]);
    let [textInput, setTextInput] = useState<string[]>([]);
    let suggestions: string[] = [];
    const suggestionHandler = () => {
    }
    return <div className="SignUpPage">
        <input type="text" className="command-palette" onInput={() => commandHandler(command)} onClick={() => commandHandler(command)} onKeyDown={() => suggestions = suggestionHandler()} value={textInput} />

        { /* This span element will have the same text as the input, but be invisible so that we can track the position of certain tokens */}
        <span id="mirror" style="visibility: hidden; position: absolute; white-space: pre;"></span>

        {
            suggestions.map((suggestion) => {
                return <div className="suggestions">
                    <div className="suggestion">{suggestion}
                    </div>
                </div>
            })
        }
    </div>;
};

export default Frontend;
