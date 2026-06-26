import React, {ChangeEvent, FormEvent, useState} from 'react';
import Button from 'src/entries/frontend/components/Button/Button';
import Logo from 'src/assets/img/logo.svg';
import * as cryptography from 'src/libs/handlers/cryptography';

import './Login.css'

interface Props {
}

const Login: React.FC<Props> = ({onLogin}: Props) => {
    const [password, setPassword] = useState('');

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        if (await cryptography.passwordVerify(password)) {
            // TODO: Authenticate user
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
