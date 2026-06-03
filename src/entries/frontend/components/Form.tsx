import React from 'react';
import '../Frontend.css';

type data = string | number | boolean

type FormInfo = {
    [key: string]: data
}

interface Props {
    onSubmit: (info: FormInfo) => void;
}

const Form: React.FC<Props> = ({onSubmit}: Props) => {
    throw Error("Unimplemented!");

    /*
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
     */
};

export default Form;
