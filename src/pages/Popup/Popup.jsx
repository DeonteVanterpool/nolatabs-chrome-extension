import React from 'react';
import logo from '../../assets/img/logo.svg';
import Greetings from '../../containers/Greetings/Greetings';
import './Popup.css';

const Popup = () => {
    return (
        <label>Nolatabs Command Pallete
            <input type='text' name='Nolatabs Command Pallete' id='nolatabs-command-pallete' autoFocus />
        </label>
    );
};

export default Popup;
