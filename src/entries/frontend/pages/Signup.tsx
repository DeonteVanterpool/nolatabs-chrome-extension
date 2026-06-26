import React, {ChangeEvent, FormEvent, useState} from 'react';
import '../Frontend.css';
import {UserService} from 'src/libs/services/user';
import {User} from 'src/models/user';

interface Props {
    handleSignup: (user: User) => void;
}

const Frontend: React.FC<Props> = ({ handleSignup: onSignUp}: Props) => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');

    const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    };
    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        UserService.signup(chrome.storage.local, name, password);
        onSignUp((await UserService.get(chrome.storage.local))!);
    }

    return <div className="SignUpPage">
        <h1>Welcome To</h1>
        <h2>NolaTabs</h2>
        <form onSubmit={handleSubmit}>
            <label>Name:
                <input type="text" onChange={handleNameChange}></input>
            </label>
            <label>Password
                <input type="password" onChange={handlePasswordChange}></input>
            </label>
            <button type="submit">Sign Up</button>
        </form>
    </div>;
};

export default Frontend;
