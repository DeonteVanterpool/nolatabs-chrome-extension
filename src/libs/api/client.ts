import {User} from "firebase/auth";
import {Result} from "true-myth";
import {err, ok} from "true-myth/result";
import * as crypto from 'src/libs/handlers/cryptography';

type SignupPayload = {
    username: string;
    email: string;
    account_salt: Uint8Array;
    uuid: string;
    device_id: string;
    public_key: string;
    signature: string;
    timestamp: number;
};

const base_url = new URL("https://popsicle-dimmer-trash.ngrok-free.dev/api")

export async function signup(user: User): Promise<Result<string, string>> {
    const url = new URL("/auth/signup", base_url);
    let timestamp_secs = Date.now() / 1000;
    const buffer = new ArrayBuffer(4);
    const view: DataView<ArrayBuffer> = new DataView(buffer);
    view.setUint32(0, timestamp_secs);
    const payload: SignupPayload = {
        username: user.displayName || "",
        email: user.email || "",
        account_salt: crypto.generateSalt(16),
        uuid: crypto.uuid(),
        device_id: crypto.uuid(), // Replace with actual device ID logic
        public_key: crypto.public_key(),
        signature: crypto.sign_message(new Uint8Array(view.buffer)),
        timestamp: timestamp_secs,
    };

    try {
        const response = await fetch(url.toString(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            return err(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return ok(data.message || "Signup successful");
    } catch (error) {
        return err(`Network error: ${error}`);
    }
}
