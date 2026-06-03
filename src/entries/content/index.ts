console.log('Content script works!');
console.log('Must reload extension for modifications to take effect.');

let displayPallete: boolean = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showCommandPallete") {
        // Code to display a custom UI on the current page
        console.log("Displaying custom palette on this page.");
        if (!displayPallete) {
            document.body.insertAdjacentHTML('beforeend', `
<div id="nolatabs-overlay" style="width: 100vw; height: 100vh; position: fixed; top: 0; left: 0; z-index: 999; display: flex; justify-content: center; align-items: top; background: transparent; border: 0;">
<iframe id="nolatabs-iframe" style="border: 1px solid grey; background: white; padding: 10px; height: 5em; width: 500px; z-index=999999; margin-top: 30vh;" srcdoc="<body style='margin: 0;'>
<label style='background: white; display: block; width: 100%;'>Nolatabs Command Pallete
<input type='text' name='Nolatabs Command Pallete' id='nolatabs-command-pallete' style='display: block; border: 2px solid black; border-radius: 2px; outline: none; width: 100%; box-sizing: border-box; height: 2em; padding: 0;' autofocus/>
</label>
</div></body>"
></iframe>
</div>
                                         `)
            displayPallete = true;
            let element2: HTMLIFrameElement = document.getElementById("nolatabs-iframe") as HTMLIFrameElement;
            element2.onload = () => {
                if (element2 && element2.contentDocument) {
                    element2.focus();
                    let element = (element2.contentWindow as Window).document.getElementById("nolatabs-command-pallete");
                    if (element) {
                        element.focus();
                        element.addEventListener('blur', () => {
                            let element = document.getElementById("nolatabs-overlay");
                            if (element) {
                                element.remove();
                            }
                            displayPallete = false;
                        });
                    }
                }
            }
        } else {
            let element = document.getElementById("nolatabs-overlay");
            if (element) {
                element.remove();
            }
            displayPallete = false;
        }
        // Example: Create a div element and append it to the body
        // const paletteDiv = document.createElement('div');
        // paletteDiv.textContent = 'My Custom Palette';
        // document.body.appendChild(paletteDiv);
    }
});

