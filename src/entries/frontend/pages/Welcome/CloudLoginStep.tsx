import React, {useState} from "react";
import LogoIcon from 'src/assets/img/logo.svg';
import BackIcon from 'src/assets/img/back-arrow.svg';
import Button from "../../components/Button/Button";

type Option = "welcome" | "commandStyle";

interface cloudLoginForm {
    email: string,
    password: string,
}

interface Props {
    select: (option: Option) => void;
}

const cloudlogin = (form: cloudLoginForm) => {
    console.error("unimplemented!");
}

const CloudLoginStep: React.FC<Props> = ({select}) => {
    const [password, setPassword] = useState<string>("")
    const [email, setEmail] = useState<string>("")
    const handleSubmit = async () => {
        cloudlogin({email, password});
        select("commandStyle");
    }

    return (
        <div className="page">
            <h1>Cloud Login</h1>
            <LogoIcon className="logo" />
            <form onSubmit={handleSubmit}>
                <input onChange={(e) => setEmail(e.target.value)} type="text" placeholder="Email..." name="email" />
                <input onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password..." name="password" />
                <button onSubmit={handleSubmit} type="submit">Continue</button>
            </form>
            <div className="back-button">
                <Button onClick={() => select("welcome")} variant="borderless" icon={<BackIcon />} label="Back" />
            </div>
        </div>
    );
}

export default CloudLoginStep;

