import React, {useState} from 'react';
import Button from '../../components/Button/Button';
import './Welcome.css';
import LogoIcon from '../../../../assets/img/logo.svg';

interface SetupInfo {
    password: string;
    devMode: boolean;
}

interface Props {
    handleRenderLoginPage: () => void;
    handleSubmit: (info: SetupInfo) => Promise<void>;
}

type Page = "welcome" | "createpassword" | "commandStyle";

const Welcome: React.FC<Props> = ({handleRenderLoginPage, handleSubmit}) => {
    const [currentPage, setCurrentPage] = useState<Page>("welcome");
    const [devMode, setDevMode] = useState<boolean>(false); // Kept strictly as a boolean
    const [password, setPassword] = useState<string>("");

    // Navigation Handlers
    const handleContinue = () => setCurrentPage("commandStyle");
    const handleBack = () => setCurrentPage("welcome");
    const handleCreatePassword = () => setCurrentPage("createpassword");

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
                            <Button onClick={handleRenderLoginPage} label="Yes" />
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
                            You are in full control of your privacy. Your data is encrypted with a
                            password you create, before it's stored on your device or in the cloud.
                            I do not want your data; my goal is to ensure you are the only one who
                            can ever see it. To get started, please create your password.
                        </p>
                        <input
                            type="password"
                            placeholder="Password..."
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoFocus // Automatically regains focus just in case
                        />
                        <Button onClick={handleContinue} label="Continue" />
                        <Button onClick={handleBack} label="Back" />
                    </div>
                );

            case "commandStyle":
                return (
                    <div className="page">
                        <h1>Welcome To</h1>
                        <LogoIcon className="logo" />
                        <p>Which command style feels more natural to you?</p>
                        <div className="yesno">
                        <Button onClick={() => setDevMode(false)} label="Option 1 (Plain)" variant="outlined" />
                        <Button onClick={() => setDevMode(true)} label="Option 2 (Dev)" variant="outlined" />
                    </div>
                        <Button onClick={() => handleSubmit({password, devMode, })} label="Done" />
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
