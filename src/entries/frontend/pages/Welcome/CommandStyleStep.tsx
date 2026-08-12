import React, {useState} from "react";
import LogoIcon from 'src/assets/img/logo.svg';
import Button from "../../components/Button/Button";
import {WelcomeForm} from "./Welcome";
import { WelcomeMessage } from "src/models/messages";

interface Props {
    form: WelcomeForm;
}

const CommandStyleStep: React.FC<Props> = ({form}) => {
    const [devMode, setDevMode] = useState<boolean>(false);
    const welcomeCallback = async () => {
        form.devMode = devMode;
        const message: WelcomeMessage = {
            devMode: form.devMode,
            passwordHash: form.passwordHash,
            kind: "welcome"
        }
        await chrome.runtime.sendMessage(message);
    }
    return (
        <div className="page">
            <h1>Welcome To</h1>
            <LogoIcon className="logo" />
            <p>Which command style feels more natural to you?</p>
            <div className="yesno">
                <Button onClick={() => setDevMode(false)} label="Option 1 (Plain)" variant={!devMode ? "contained" : "outlined"} theme="secondary" />
                <Button onClick={() => setDevMode(true)} label="Option 2 (Dev)" variant={devMode ? "contained" : "outlined"} theme="secondary" />
            </div>
            <Button onClick={welcomeCallback} label="Done" />
        </div>
    );
}

export default CommandStyleStep;
