// sandbox.ts (Compiled to sandbox.js via your Webpack setup)
import init, { load_credentials } from '../../wasm/mls/pkg/mls';

const wasmReady = (async () => {
    try {
        await init("./mls_bg.wasm");
    } catch (err) {
        console.error("WASM failed to initialize inside sandbox:", err);
    }
})();

// Listen for postMessage streams sent down by offscreen.js
window.addEventListener('message', async (event) => {
    await wasmReady;

    try {
        // Run your OpenMLS execution inside the memory-isolated heap
        const encrypted = load_credentials(event.data);
        
        // Find the reply port passed down by the parent window
        const replyPort = event.ports[0];
        if (replyPort) {
            replyPort.postMessage({ success: true, data: encrypted });
        }
    } catch (error) {
        const replyPort = event.ports[0];
        if (replyPort) {
            replyPort.postMessage({ success: false, error: error.message });
        }
    }
});
