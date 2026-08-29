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

const base_url = new URL("https://api.granolatabs.com")

export async function signup(display_name: string, email: string): Promise<Result<string, string>> {
    const url = new URL("/auth/signup", base_url);
    let timestamp_secs = Date.now() / 1000;
    const buffer = new ArrayBuffer(4);
    const view: DataView<ArrayBuffer> = new DataView(buffer);
    view.setUint32(0, timestamp_secs);
    const payload: SignupPayload = {
        username: display_name || "",
        email: email || "",
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

type AuthenticationPayload = {
    public_key: string;
    signature: string;
    timestamp: number;
};

export async function start_checkout(type: 1 | 2, months: number): Promise<Result<string, string>> {
    const url = new URL("/payment/checkout", base_url);
    const auth: AuthenticationPayload = {
        public_key: crypto.public_key(),
        signature: crypto.sign_message(new Uint8Array(Date.now())),
        timestamp: Date.now() / 1000,
    };
    let headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Bearer ${auth}`);
    const jsonPayload = JSON.stringify({
        months: months,
        subscription_type: type === 1 ? "cloudsync" : "synccollaborate",
    });
    let response = await fetch(url.toString(), {
        method: "POST",
        headers: headers,
        body: jsonPayload,
    });
    
    if (!response.ok) {
        return err(`HTTP error! status: ${response.status}`);
    }
    return ok(await response.text());
}

