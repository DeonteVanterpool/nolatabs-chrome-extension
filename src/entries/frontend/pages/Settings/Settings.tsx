import React, {ChangeEvent, FormEvent, useState} from 'react';
import './Settings.css';
import {UserSettings} from 'src/pages/models/user';

interface Props {
    handleSave: (arg0: UserSettings) => void | Promise<void>;
}

const Settings: React.FC<Props> = ({ handleSave }: Props) => {
    return <div>hello world</div>
};

export default Settings;
