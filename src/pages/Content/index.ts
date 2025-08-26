console.log('Content script works!');
console.log('Must reload extension for modifications to take effect.');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "showCommandPallete") {
        // Code to display a custom UI on the current page
        console.log("Displaying custom palette on this page.");
        // Example: Create a div element and append it to the body
        // const paletteDiv = document.createElement('div');
        // paletteDiv.textContent = 'My Custom Palette';
        // document.body.appendChild(paletteDiv);
      }
    });
