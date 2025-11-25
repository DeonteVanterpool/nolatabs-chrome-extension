import React, {ChangeEvent, FormEvent, useState} from 'react';
import '../Frontend.css';
import {UserService} from '../../services/user';
import {User} from '../../models/user';

interface Props {
    handleSignup: (user: User) => void;
    handleRenderLoginPage: () => void;
    userService: UserService;
}

const Frontend: React.FC<Props> = ({ handleSignup: onSignUp, handleRenderLoginPage: renderLogin, userService}: Props) => {
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
        userService.signup(name, password);
        onSignUp((await userService.get())!);
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
        Already signed up? <button onClick={renderLogin}>Login</button>
    </div>;
};

export default Frontend;
