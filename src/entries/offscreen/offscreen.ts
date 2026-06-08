
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const iframe = document.getElementById('sandbox') as HTMLIFrameElement;
    if (message.target !== 'offscreen') return;
    if (sender.id !== chrome.runtime.id) return;

    if (!iframe || !iframe.contentWindow) {
        sendResponse({ success: false, error: "Sandbox iframe is not ready or unavailable." });
        return false; 
    }

    const channel = new MessageChannel();
    
    channel.port1.onmessage = (event) => {
        channel.port1.close(); 
        
        sendResponse(event.data); 
    };

    iframe.contentWindow.postMessage(
        message.data, 
        '*',
        [channel.port2]
    );

    return true;
});
