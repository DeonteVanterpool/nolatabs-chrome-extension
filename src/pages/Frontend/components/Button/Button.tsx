import React from "react";

import './Button.css'

interface Props {
    variant?: "contained" | "outlined",
    label?: string,
    icon?: string, // svg path
    onClick: () => void;
}

const Button: React.FC<Props> = ({label, onClick, variant = "contained"}: Props) => {
    return <button onClick={onClick} className={variant}>{label}</button>
};

export default Button;
