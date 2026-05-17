import React, { useState } from 'react';
import '../Frontend.css';

interface SetupInfo {
  password: string;
  devMode: boolean;
}

interface Props {
  handleRenderLoginPage: () => void;
  handleSubmit: (info: SetupInfo) => Promise<void>;
}

type Page = "welcome" | "createpassword" | "commandStyle";

const Welcome: React.FC<Props> = ({ handleRenderLoginPage, handleSubmit }) => {
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
          <div>
            <h1>Welcome To</h1>
            <h2>NolaTabs</h2>
            <p>Do you have a cloud account you want to log into?</p>
            <button onClick={handleRenderLoginPage}>Yes</button>
            <button onClick={handleCreatePassword}>No</button>
          </div>
        );

      case "createpassword":
        return (
          <div>
            <h1>Create Password</h1>
            <h2>NolaTabs</h2>
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
            <button onClick={handleContinue}>Continue</button>
            <button onClick={handleBack}>Back</button>
          </div>
        );

      case "commandStyle":
        return (
          <div>
            <h1>Welcome To</h1>
            <h2>NolaTabs</h2>
            <p>Which command style feels more natural to you?</p>
            {/* Toggling the devMode boolean */}
            <button 
              className={!devMode ? "active" : ""} 
              onClick={() => setDevMode(false)}
            >
              Option 1 (Plain)
            </button>
            <button 
              className={devMode ? "active" : ""} 
              onClick={() => setDevMode(true)}
            >
              Option 2 (Dev)
            </button>
            <button 
              onClick={() => handleSubmit({ 
                password, 
                devMode,
              })}
            >
              Done
            </button>
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
