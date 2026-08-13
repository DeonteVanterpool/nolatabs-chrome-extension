import LogoIcon from 'src/assets/img/logo.svg';
import BackIcon from 'src/assets/img/back-arrow.svg';
import React, {useState} from "react"
import Button from '../../components/Button/Button';
import Textbox from '../../components/Textbox/Textbox';
import {WelcomeForm} from './Welcome';
import * as crypto from 'src/libs/handlers/cryptography';

type Option = "welcome" | "commandStyle";

interface Props {
    select: (option: Option) => void;
    form: WelcomeForm;
    setform: (form: WelcomeForm) => void,
}

const CreatePasswordStep: React.FC<Props> = ({select, setform, form}) => {
    const [password, setPassword] = useState<string>("");

    const handleSubmit = async () => {
        const passwordBytes = crypto.encode(password);
        const salt = crypto.generateSalt(16);
        form.passwordHash = crypto.uint8ArrayToBase64(await crypto.argon2HashMasterKey(passwordBytes, salt));
        form.passwordSalt = crypto.uint8ArrayToBase64(salt);
        setform(form);
        passwordBytes.fill(0);
        select("commandStyle");
    }

    return (
        <div className="page">
            <h1>Create Password</h1>
            <LogoIcon className="logo" />
            <p>
                Your data is encrypted with a password, before it's stored on your device or in the cloud. I don't want your data. I just want to ensure you are the only one who can ever see it. To get started, please create your password.
            </p>
            <form>
                <div className="password-input">
                    <Textbox variant="password" placeholder="Password..." onChange={(e) => {setPassword(e.target.value);}} onSubmit={handleSubmit} />
                </div>
                <div className="continue-button">
                    <Button onClick={handleSubmit} label="Continue" />
                </div>
            </form>
            <div className="back-button">
                <Button onClick={() => select("welcome")} variant="borderless" icon={<BackIcon />} label="Back" />
            </div>
        </div>
    )
}

export default CreatePasswordStep;

