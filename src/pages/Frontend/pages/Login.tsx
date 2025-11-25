import React, {ChangeEvent, FormEvent, useState} from 'react';
import '../Frontend.css';
import {UserService} from '../../services/user';
import {User} from '../../models/user';

interface Props {
    onLogin: (user: User) => void;
    renderSignup: () => void;
    userService: UserService;
}

const Login: React.FC<Props> = ({onLogin, renderSignup, userService}: Props) => {
    const [password, setPassword] = useState('');

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (await userService.authenticate(password) === true) {
            onLogin((await userService.get())!);
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
