import React from "react";

import './Button.css'

interface Props {
    variant?: "contained" | "outlined" | "borderless",
    label?: string,
    icon?: React.ReactNode,
    theme?: "primary" | "secondary" | "foreground",
    onClick: () => void;
}

const Button: React.FC<Props> = ({label, onClick, variant = "contained", icon, theme = "primary"}: Props) => {
    return !icon ? <button onClick={onClick} className={[variant, theme].join(" ")}>{label}</button> : <button onClick={onClick} className={[variant, theme].join(" ")}>{icon}{label}</button>
};

export default Button;
