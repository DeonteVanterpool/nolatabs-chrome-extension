import React, {useState} from 'react';
import '../Frontend.css';

interface Command {
    name: string,
    args: DataType[],
}

interface Execution {
    command: string,
    args: string[],
}

interface Props {
    commands: Command[],
    repoNames: string[],
    apply: (exec: Execution) => (void | Promise<void>),
}

export type DataType = "String" | "RepositoryName"

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

const CommandPalette: React.FC<Props> = ({commands, repoNames, apply}: Props) => {
    let [textInput, setTextInput] = useState<string>("");
    let command = (splitIgnoringQuotes(textInput));
    let args = command.slice(1);
    let suggestions: string[] = []

    const suggest = (dtype: DataType, text: string): string[] => {
        if (dtype === "String") {
            return [];
        } else if (dtype === "RepositoryName") {
            return repoNames.filter((n) => n.startsWith(text));
        } else {
            return [];
        }
    }

    if (args.length === 0 && (textInput.length === 0 || !(["\"", " "].includes(textInput[textInput.length - 1])))) { // if no arguments, and first argument not started typing yet
        suggestions = commands.map((c) => c.name).filter((n) => n.startsWith(textInput.trim()));
    } else {
        let currentCommand = commands.filter((c) => c.name === command[0]);
        if (currentCommand.length > 0) {
            let text = textInput[textInput.length - 1] === " " ? "" : args[args.length - 1]; // get last argument, or a blank string if the last text was a space
            let dtype = textInput[textInput.length - 1] === " " ?
                currentCommand[0].args[args.length] : // if on a space, get the dtype for next token
                currentCommand[0].args[args.length - 1]; // dtype for current token
            suggestions = suggest(dtype, text);
        }
    }


    return <div className="CommandPalette">
        <input value={textInput} autoFocus={true} type="text" className="command-palette" onKeyDown={(e) => {
            if (e.key === "Enter") {
                console.log(command.slice(1));
                commands.filter((c) => c.name === command[0]).forEach((v) => apply({
                    command: v.name,
                    args: command.slice(1),
                }));
                setTextInput("");
            }
        }} onChange={(e) => {
            setTextInput((e.target as HTMLInputElement).value); // trigger a rerender on state change
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
