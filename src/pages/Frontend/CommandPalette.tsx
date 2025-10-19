import React, {ChangeEvent, FormEvent, useEffect, useState} from 'react';
import './Frontend.css';
import {UserService} from '../services/user';
import {UserRepository} from '../repository/user';
import {User} from '../models/user';

interface Props {
    commandHandler: (command: string[]) => void;
    commands: Command[],
    repoNames: string[],
}

export type DataType = "String" | "RepositoryName"

export type Command = {
    name: string,
    args: DataType[],
}

function splitIgnoringQuotes(input: string): string[] {
    const result: string[] = [];
    let current = '';
    let insideQuotes = false;
    
    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        
        if (char === '"') {
            insideQuotes = !insideQuotes;
            continue; // Skip the quote itself
        }
        
        if (char === ' ' && !insideQuotes) {
            if (current !== '') {
                result.push(current);
                current = '';
            }
            continue;
        }
        
        current += char;
    }
    
    // Push the last segment if it exists
    if (current !== '') {
        result.push(current);
    }
    
    return result;
}

const CommandPalette: React.FC<Props> = ({commandHandler, commands, repoNames}: Props) => {
    let [command, setCommand] = useState<string[]>([]);
    let [textInput, setTextInput] = useState<string>("");
    let [suggestions, setSuggestions] = useState<string[]>([]);
    const suggest = (dtype: DataType, text: string): string[] => {
        console.log(repoNames);
        if (dtype === "String") {
            return [];
        } else if (dtype === "RepositoryName") {
            console.log(repoNames.filter((n) => n.startsWith(text)));
            return repoNames.filter((n) => n.startsWith(text));
        } else {
            return [];
        }
    }
    const suggestionHandler = (): string[] => {
        setCommand(splitIgnoringQuotes(textInput));
        if (textInput.split(" ").length <= 1 && (textInput.length === 0 || textInput[0] !== " ")) {
            console.log("bart");
            setSuggestions(commands.map((c) => c.name).filter((n) => n.startsWith(textInput)));
            return commands.map((c) => c.name).filter((n) => n.startsWith(textInput));
        } else {
            let command = commands.find((o) => o.name === textInput.split(" ")[0]);
            console.log("hello");
            if (command) {
                let input = splitIgnoringQuotes(textInput);
                setSuggestions(suggest(command.args[input.length - 2], input[input.length - 1]));
                return suggest(command.args[input.length], input[input.length - 1]);
            }
            setSuggestions([]);
            return []; // invalid command
        }
    }

      // Update suggestions whenever textInput changes
    useEffect(() => {
    }, [textInput, commands, repoNames, suggestions]);

    return <div className="CommandPalette">
        <input value={textInput} autoFocus={true} type="text" className="command-palette" onKeyDown={(e) => {
            if (e.key === "Enter") {
                commandHandler(command);
                setTextInput("");
                setCommand([]);
                setSuggestions([]);

            }
        }} onChange={(e) => {
            setTextInput((e.target as HTMLInputElement).value);
            textInput = (e.target as HTMLInputElement).value; // the input is used in suggestionHandler, so we need to update it manually so it isn't using the old value
            suggestions = suggestionHandler();
        }
        } />

        { /* This span element will have the same text as the input, but be invisible so that we can track the position of certain tokens */}
        <span id="mirror" style={{visibility: "hidden", position: "absolute", whiteSpace: "pre"}}></span>

        {
            suggestions.map((suggestion) => {
                return <div className="suggestions">
                    <div className="suggestion">{suggestion}
                    </div>
                </div>
            })
        }
    </div >;
};

export default CommandPalette;
