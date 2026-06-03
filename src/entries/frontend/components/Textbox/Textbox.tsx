import React, {ChangeEvent, useState} from "react";

import './Textbox.css'

interface Props {
    variant: "text" | "password",
    placeholder?: string,
    value?: string,
    onSubmit: (text: string) => void,
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void,
}

const Textbox: React.FC<Props> = ({variant, placeholder, onSubmit, value, onChange}: Props) => {
    let [val, setVal] = useState(value ? value : "");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVal(e.target.value)
        if (onChange) {
            onChange(e)
        }
    }

    switch (variant) {
        case "text":
            return <input
                type="text"
                placeholder={placeholder}
                value={val}
                onChange={handleChange}
                onSubmit={e => onSubmit(val)}
                autoFocus // Automatically regains focus just in case
            />
        case "password":
            return <input
                type="password"
                placeholder={placeholder}
                value={val}
                onChange={handleChange}
                onSubmit={e => onSubmit(val)}
                autoFocus // Automatically regains focus just in case
            />
    }
};

export default Textbox;
