import React from "react";

interface Props {
    text: string,
    onClick: () => void;
}

const Button: React.FC<Props> = ({text, onClick}: Props) => {
    return <button onClick={onClick}>{text}</button>
};

export default Button;
