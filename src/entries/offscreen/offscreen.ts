const iframe = document.getElementById('sandbox') as HTMLIFrameElement;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target !== 'offscreen') return;

    // Create a private channel for a secure callback response
    const channel = new MessageChannel();
    
    channel.port1.onmessage = (event) => {
        sendResponse(event.data); 
    };

    iframe.contentWindow!.postMessage(
        message.data, 
        '*', 
        [channel.port2] // Give the sandbox a return address port
    );

    return true; // Keep the Chrome runtime message channel open
});
