import React, {ChangeEvent, FormEvent, useState} from 'react';
import './Frontend.css';
import {UserService} from '../services/user';
import {UserRepository} from '../repository/user';

interface Props {

}

const Frontend: React.FC<Props> = ({}: Props) => {
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
        await new UserService(new UserRepository(chrome.storage.local)).signup(name, password);
        console.log("User created: ", await new UserService(new UserRepository(chrome.storage.local)).get());
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
