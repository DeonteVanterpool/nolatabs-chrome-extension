import React, { useState } from 'react';
import '../Frontend.css';
import ViewSwitcher from '../components/ViewSwitcher';

interface Props {
  handleRenderLoginPage: () => void;
}

type Page = "welcome" | "createpassword" | "commandStyle";

const Welcome: React.FC<Props> = ({ handleRenderLoginPage }) => {
  const [currentPage, setCurrentPage] = useState<Page>("welcome");

  // Navigation Handlers
  const handleContinue = () => {
    setCurrentPage("commandStyle");
  };

  const handleBack = () => {
    setCurrentPage("welcome");
  };

  const handleCreatePassword = () => {
    setCurrentPage("createpassword");
  };

  // View Components
  const welcome = () => (
    <div>
      <h1>Welcome To</h1>
      <h2>NolaTabs</h2>
      <p>Do you have a cloud account you want to log into?</p>
      <button onClick={handleRenderLoginPage}>Yes</button>
      <button onClick={handleCreatePassword}>No</button>
    </div>
  );

  const commandStyle = () => (
    <div>
      <h1>Welcome To</h1>
      <h2>NolaTabs</h2>
      <p>Which command style feels more natural to you?</p>
      <button onClick={() => {}}>Option 1</button>
      <button onClick={() => {}}>Option 2</button>
    </div>
  );

  const createPassword = () => (
    <div>
      <h1>Create Password</h1>
      <h2>NolaTabs</h2>
      <p>
        You are in full control of your privacy. Your data is encrypted with a
        password you create, before it's stored on your device or in the cloud.
        I do not want your data; my goal is to ensure you are the only one who
        can ever see it. To get started, please create your password.
      </p>
      <input type="password" placeholder="Password..." />
      <button onClick={handleContinue}>Continue</button>
      <button onClick={handleBack}>Back</button>
    </div>
  );

  return (
    <ViewSwitcher
      pages={[
        { name: "createpassword", component: createPassword },
        { name: "welcome", component: welcome },
        { name: "commandStyle", component: commandStyle },
      ]}
      selectedPage={currentPage}
    />
  );
};

export default Welcome;
