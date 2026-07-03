import React, {FormEvent, useState} from 'react';
import Button from '../../components/Button/Button';
import LogoIcon from 'src/assets/img/logo.svg';
import BackIcon from 'src/assets/img/back-arrow.svg';
import Textbox from '../../components/Textbox/Textbox';
import {CloudLoginMessage, WelcomeMessage} from 'src/models/messages';
import {argon2Hash} from 'src/libs/handlers/cryptography';

import './Welcome.css';

interface SetupInfo {
    password: string;
    devMode: boolean;
}

interface Props {
}

type Page = "welcome" | "createpassword" | "cloudlogin" | "commandStyle";

const Welcome: React.FC<Props> = ({}) => {
    const [currentPage, setCurrentPage] = useState<Page>("welcome");
    const [devMode, setDevMode] = useState<boolean>(false); // Kept strictly as a boolean
    const [password, setPassword] = useState<string>("");
    const [email, setEmail] = useState<string>("");

    // Navigation Handlers
    const handleContinue = () => setCurrentPage("commandStyle");
    const handleBack = () => setCurrentPage("welcome");
    const handleCreatePassword = () => setCurrentPage("createpassword");
    const handleCloudLogin = () => setCurrentPage("cloudlogin");

    // Directly rendering JSX based on the state to preserve input focus
    const renderPageContent = () => {
        switch (currentPage) {
            case "welcome":
                return (
                    <div className="page">
                        <h1>Welcome To</h1>
                        <LogoIcon className="logo" />
                        <p>Do you have a cloud account you want to log into?</p>
                        <div className="yesno">
                            <Button onClick={handleCloudLogin} label="Yes" /> {/* TODO: complete this part */}
                            <Button onClick={handleCreatePassword} label="No" />
                        </div>
                    </div>
                );

            case "createpassword":
                return (
                    <div className="page">
                        <h1>Create Password</h1>
                        <LogoIcon className="logo" />
                        <p>
                            Your data is encrypted with a password, before it's stored on your device or in the cloud. I don't want your data. I just want to ensure you are the only one who can ever see it. To get started, please create your password.
                        </p>
                        <form>
                            <div className="password-input">
                                <Textbox variant="password" placeholder="Password..." onChange={(e) => setPassword(e.target.value)} onSubmit={(text) => {setPassword(text); handleContinue()}} />
                            </div>
                            <div className="continue-button">
                                <Button onClick={() => cloudLoginCallback(password, email)} label="Continue" />
                            </div>
                        </form>
                        <div className="back-button">
                            <Button onClick={handleBack} variant="borderless" icon={<BackIcon />} label="Back" />
                        </div>
                    </div>
                );

            case "cloudlogin":
                const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
                    e.preventDefault();

                    const form = e.currentTarget;
                    const formData = new FormData(form);
                    const password = formData.get("password");
                    const email = formData.get("email");
                    if (typeof email !== "string" || typeof password !== "string") {
                        return;
                    };

                    const encoder = new TextEncoder();
                    const passwordBytes = encoder.encode(password as string);

                    cloudLoginCallback(passwordBytes, email).finally(() => passwordBytes.fill(0));
                }
                return (
                    <div className="page">
                        <h1>Cloud Login</h1>
                        <LogoIcon className="logo" />
                        <form onSubmit={handleSubmit}>
                            <input type="text" placeholder="Email..." name="email" />
                            <input type="password" placeholder="Password..." name="password" />
                            <button type="submit">Continue</button>
                        </form>
                        <div className="back-button">
                            <Button onClick={handleBack} variant="borderless" icon={<BackIcon />} label="Back" />
                        </div>
                    </div>
                );

            case "commandStyle":
                return (
                    <div className="page">
                        <h1>Welcome To</h1>
                        <LogoIcon className="logo" />
                        <p>Which command style feels more natural to you?</p>
                        <div className="yesno">
                            <Button onClick={() => setDevMode(false)} label="Option 1 (Plain)" variant={!devMode ? "contained" : "outlined"} theme="secondary" />
                            <Button onClick={() => setDevMode(true)} label="Option 2 (Dev)" variant={devMode ? "contained" : "outlined"} theme="secondary" />
                        </div>
                        <Button onClick={() => welcomeCallback(password, devMode)} label="Done" />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="welcome-container">
            {renderPageContent()}
        </div>
    );
};

export default Welcome;

const welcomeCallback = async (password: Uint8Array, devMode: boolean) => {
    const arr = new Uint8Array(16);
    const salt = crypto.getRandomValues(arr);
    await chrome.runtime.sendMessage({kind: "welcome", devMode: devMode, passwordHash: await argon2Hash(password, salt)} satisfies WelcomeMessage);
};

const cloudLoginCallback = async (password: Uint8Array, email: string) => {
    const arr = new Uint8Array(16);
    const salt = crypto.getRandomValues(arr);
    const passwordHash = await argon2Hash(password, salt);
    password.fill(0);
    await chrome.runtime.sendMessage({kind: "cloudlogin", email, passwordHash} satisfies CloudLoginMessage);
};
