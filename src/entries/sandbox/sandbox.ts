import init, {load_credentials} from 'src/wasm/mls/pkg/mls';
import wasmUrl from 'src/wasm/mls/pkg/mls_bg.wasm';

// Securely grab the Extension ID passed through the initialization URL
const urlParams = new URLSearchParams(window.location.search);
const EXTENSION_ID = urlParams.get('id');

const wasmReady = (async () => {
    try {
        await init(wasmUrl);
    } catch (err) {
        console.error("WASM failed to initialize inside sandbox:", err);
    }
})();

// Listen for postMessage streams sent down by offscreen.ts
window.addEventListener('message', async (event) => {

    if (!EXTENSION_ID || event.origin !== `chrome-extension://${EXTENSION_ID}`) return;

    await wasmReady;

    try {
        switch (event.data.action) {
            case "set_provider_state":
                let success = load_credentials(event.data.state);

                const replyPort = event.ports[0];
                if (replyPort) {
                    replyPort.postMessage({success: true, data: success});
                    replyPort.close()
                }
                break;
            default:
                throw new Error("invalid action or no action presented")
        }
    } catch (error) {
        const replyPort = event.ports[0];
        if (replyPort) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            replyPort.postMessage({ success: false, error: errorMessage });
            replyPort.close()
        }
    }
});
