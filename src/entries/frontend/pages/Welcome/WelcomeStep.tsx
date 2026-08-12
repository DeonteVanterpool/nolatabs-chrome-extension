import LogoIcon from 'src/assets/img/logo.svg';
import Button from '../../components/Button/Button';
import React from 'react';

type Option = "createpassword" | "cloudlogin";

interface Props {
    select: (option: Option) => void;
};

const WelcomeStep: React.FC<Props> = ({select}) => {
    return (
        <div className="page">
            <h1>Welcome To</h1>
            <LogoIcon className="logo" />
            <p>Do you have a cloud account you want to log into?</p>
            <div className="yesno">
                <Button onClick={() => select("cloudlogin")} label="Yes" />
                <Button onClick={() => select("createpassword")} label="No" />
            </div>
        </div>
    );
};

export default WelcomeStep;

