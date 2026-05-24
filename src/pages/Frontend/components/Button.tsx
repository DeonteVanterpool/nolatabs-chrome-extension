import React from "react";

interface Props {
    style?: "contained" | "outlined",
    text?: string,
    icon?: string, // svg path
    onClick: () => void;
}

const Button: React.FC<Props> = ({text, onClick}: Props) => {
    return <div><button onClick={onClick}>{text}</button></div>
};

export default Button;
