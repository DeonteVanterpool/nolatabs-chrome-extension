import React, {ChangeEvent, useState} from 'react';
import Button from 'src/entries/frontend/components/Button/Button';
import Logo from 'src/assets/img/logo.svg';
import { LocalLoginMessage } from 'src/models/messages';
import * as crypto from 'src/libs/handlers/cryptography';

import './Login.css'
import {authenticate} from 'src/libs/handlers/local_auth';

interface Props {
}

const Login: React.FC<Props> = ({}: Props) => {
    const [password, setPassword] = useState('');

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleLogin = async () => {
        const success = await chrome.runtime.sendMessage({kind: "locallogin", password: password} satisfies LocalLoginMessage);
        console.log("Login success:", success);
    }

    return <div className="page">
        <h1>Login</h1>
        <Logo className="logo" />
        <form onSubmit={handleLogin}>
            <label>Password:
            </label>
            <input autoFocus={true} type="password" onChange={handlePasswordChange}></input>
            <Button onClick={() => handleLogin()} label="Log In" />
        </form>
    </div>;
};

export default Login;
