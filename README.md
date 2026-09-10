# GranolaTabs
GranolaTabs is a Chromium/Firefox extension that allows you to manage your tabs in the same way that you would manage a git repository. The syntax behind it is somewhat based on Unix and Git commands.

## Installation

Chrome:
1. Download `chrome.zip` from the latest release
2. Unzip the files into its own folder
3. Open up the page `chrome://extensions`
4. Enable developer mode
5. Click "load unpacked"
6. Select the folder

Firefox:
1. Download `firefox.zip` from the latest release
2. Unzip the files into its own folder
3. Open up the page `about:debugging`
4. Click "This Firefox"
5. Click "load temporary add on"
6. Select the folder

## Build Procedure
1. Check if your [Node.js](https://nodejs.org/) version is >= **18**.
2. Clone this repository.
3. Run `npm install` to install the dependencies.
4. Install [wasm-pack](https://wasm-bindgen.github.io/wasm-pack/)
5. Run `pnpm run build:<firefox|chrome>`

## Usage
The extension will open a new pinned tab when you install it.
1. First, sign up by entering password. Although free users don't have data sent to the cloud (unless working on someone else's cloud repo), a password is still needed to encrypt sensitive data (tab urls) on your hard drive properly. 
2. Choose whether you want Unix / Terminal style language, or if you want the UI to be written in Plain English. 
3. You should be able to login using your password.

You can then use the command pallete sidebar the left sidebar to manage repositories. Supported commands are listed below:

### touch <name>
Create a new repository in the current window. Clears the current tabs.

### init <name>
Create a new repository in the window. Does not clear the current tabs

### commit "<message>"
Commit the current window state to the currently opened repository and branch. 

### branch <branchname>
Creates a branch with branchname if it doesn't exist. 

### checkout <branchname>
Opens the tabs in the branch with the name <branchname>.

## Features
- `Version Control:` Users can save the current state of their tabs as a "commit" graph.
- `Encryption:` Tab data is encrypted using a WASM Library written in Rust to ensure user privacy and security.
- `Storage Migrations:` The extension supports storage migrations to handle changes in the data schema over time, ensuring that users' tab data remains intact and accessible. Migrations are handled by `Dexie.js`.
- `Diff Based Storage:` Only changes (diffs) between tab states are stored, rather than snapshots, optimizing storage usage and performance. Also potentially reducing the amount of data sent to the server if a cloud sync feature is implemented in the future.

## Contributing
All source code is located in in the `src` folder. Documentatino about how to contribute to this boilerplate is available in the `documentation` folder.

## Resources:
- [Webpack documentation](https://webpack.js.org/concepts/)
- [Chrome Extension documentation](https://developer.chrome.com/extensions/getstarted)

---

Credit: The Boilerplate for adding React and Webpack support as well as typescript was provided by [Chrome Extension Boilerplate React](https://github.com/lxieyang/chrome-extension-boilerplate-react)

## Future Roadmap
- [ ] Cloud signups
- [ ] Backups on the cloud
- [ ] End to end encrypted collaboration
- [ ] List current tabs in UI

Deonte Vanterpool | [Website](https://deontevanterpool.com)
