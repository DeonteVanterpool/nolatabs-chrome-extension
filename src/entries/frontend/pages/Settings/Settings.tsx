import React from 'react';
import './Settings.css';
import {UserSettings} from 'src/models/user';
import Button from '../../components/Button/Button';
import {signup, start_checkout} from 'src/libs/api/client';

interface Props {
    handleSave: (arg0: UserSettings) => void | Promise<void>;
}

const Settings: React.FC<Props> = ({handleSave}: Props) => {
    const handleStartCheckout = async () => {
        try {
            const result = await start_checkout(1, 1);
            if (result.isOk) {
                console.log("Checkout started successfully:", result.value);
                window.open(result.value, "_blank");
            } else {
                console.error("Error starting checkout:", result.error);
            }
        } catch (error) {
            console.error("Unexpected error:", error);
        }
    }
    const handleStartCheckoutSyncCollab = async () => {
        try {
            const result = await start_checkout(2, 1);
            if (result.isOk) {
                console.log("Checkout started successfully:", result.value);
                window.open(result.value, "_blank");
            } else {
                console.error("Error starting checkout:", result.error);
            }
        } catch (error) {
            console.error("Unexpected error:", error);
        }
    }
    const handleSignup = async () => {
        try {
            const result = await signup("Deonte Vanterpool", "deonte.vanterpool@outlook.com")
            if (result.isOk) {
                console.log("Signed up successfully:", result.value);
            } else {
                console.error("Error signing up:", result.error);
            }
        } catch (error) {
            console.error("Unexpected error:", error);
        }
    }
    return <div><Button label={"purchase cloudSync"} onClick={handleStartCheckout}></Button><Button label={"purchase SyncCollabroate"} onClick={handleStartCheckoutSyncCollab}></Button><Button label={"signup"} onClick={handleSignup}></Button></div>
};

export default Settings;
