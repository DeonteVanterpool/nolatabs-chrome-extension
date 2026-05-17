import React, {ChangeEvent, FormEvent, useState} from 'react';
import '../Frontend.css';
import {UserService} from '../../services/user';
import {User} from '../../models/user';
import {LoginMessage} from '../../models/messages';

interface Props {
    onLogin: (user: User) => void;
    renderSignup: () => void;
}

const Login: React.FC<Props> = ({onLogin, renderSignup}: Props) => {
    const [password, setPassword] = useState('');

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (await UserService.authenticate(chrome.storage.local, password) === true) {
            onLogin((await UserService.get(chrome.storage.local))!);
            chrome.runtime.sendMessage(LoginMessage.new(password)); // Notify background script of login. Ideally this message should never be intercepted by anything other than the background script, but we should probably add some sort of type field to the message to be safe
        }
    }

    return <div className="SignUpPage">
        <h1>Login</h1>
        <h2>NolaTabs</h2>
        <form onSubmit={handleLogin}>
            <label>Password:
                <input autoFocus={true} type="password" onChange={handlePasswordChange}></input>
            </label>
            <button type="submit">Log In</button>
        </form>
        Need an account? <button onClick={renderSignup}>Sign Up</button>
    </div>;
};

export default Login;
