import React, {ChangeEvent, FormEvent, useState} from 'react';
import {UserService} from '../../../services/user';
import {User} from '../../../models/user';
import {LoginMessage} from '../../../models/messages';
import Button from '../../components/Button/Button';
import Logo from '../../../../assets/img/logo.svg';

import './Login.css'

interface Props {
    onLogin: (user: User) => void;
    renderSignup: () => void;
}

const Login: React.FC<Props> = ({onLogin, renderSignup}: Props) => {
    const [password, setPassword] = useState('');

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        if (await UserService.authenticate(chrome.storage.local, password) === true) {
            await chrome.runtime.sendMessage(LoginMessage.new(password)); // Notify background script of login. Ideally this message should never be intercepted by anything other than the background script, but we should probably add some sort of type field to the message to be safe
            onLogin((await UserService.get(chrome.storage.local))!);
        }
    }

    return <div className="page">
        <h1>Login</h1>
        <Logo className="logo" />
        <form onSubmit={handleLogin}>
            <label>Password:
            </label>
            <input autoFocus={true} type="password" onChange={handlePasswordChange}></input>
            <Button onClick={() => {}} label="Log In" />
        </form>
    </div>;
};

export default Login;
