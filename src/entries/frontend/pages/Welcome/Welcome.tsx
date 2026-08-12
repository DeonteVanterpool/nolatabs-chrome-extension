import React, {FormEvent, useState} from 'react';
import {CloudLoginMessage, WelcomeMessage} from 'src/models/messages';
import * as crypto from 'src/libs/handlers/cryptography';
import {argon2HashMasterKey} from 'src/libs/handlers/cryptography';

import './Welcome.css';
import WelcomeStep from './WelcomeStep';
import CreatePasswordStep from './CreatePasswordStep';
import CommandStyleStep from './CommandStyleStep';
import CloudLoginStep from './CloudLoginStep';

interface SetupInfo {
    password: string;
    devMode: boolean;
}

interface Props {
}

export interface WelcomeForm {
    devMode: boolean;
    passwordHash: string;
    email: string;
}

type Page = "welcome" | "createpassword" | "cloudlogin" | "commandStyle";

const Welcome: React.FC<Props> = ({}) => {
    const [currentPage, setCurrentPage] = useState<Page>("welcome");

    const [form, setform] = useState<WelcomeForm>({devMode: false, passwordHash: "", email: ""});

    // Navigation Handlers
    const handleContinue = () => setCurrentPage("commandStyle");
    const handleBack = () => setCurrentPage("welcome");

    const handleSelect = (page: Page) => {
        setCurrentPage(page);
    }

    // Directly rendering JSX based on the state to preserve input focus
    const renderPageContent = () => {
        switch (currentPage) {
            case "welcome":
                return <WelcomeStep select={handleSelect} />;

            case "createpassword":
                return <CreatePasswordStep select={handleSelect} form={form} />;

            case "cloudlogin":
                return <CloudLoginStep select={handleSelect} />

            case "commandStyle":
                return <CommandStyleStep form={form} />
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

