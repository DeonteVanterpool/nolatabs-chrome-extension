# NolaTabs Chrome Extension

## Installation

### Build Procedure

1. Check if your [Node.js](https://nodejs.org/) version is >= **18**.
2. Clone this repository.
3. Change the package's `name`, `description`, and `repository` fields in `package.json`.
4. Change the name of your extension on `src/manifest.json`.
5. Run `npm install` to install the dependencies.
6. Run `npm start`
7. Load your extension on Chrome following:
   1. Access `chrome://extensions/`
   2. Check `Developer mode`
   3. Click on `Load unpacked extension`
   4. Select the `build` folder.
8. Happy hacking.

## Usage
The extension will open a new tab when you click on install. First, sign up by entering a username and password. These are necessary to ensure your data is encrypted correctly. Afterwards, you should be able to login using your password.

You can then use the command pallete on the right to manage repositories. Supported commands are listed below:

### commit
Creates a new commit / localsave on your computer.
aliases: localsave (main)

### cd
Clear tabs and change to a different repository
aliases: open (main)

### init
Creates a new repository from the current window's tabs
aliases: initialize (main)

### mkdir
Clear tabs and create new repository in current window
aliases: new (main)

### status
Displays changes since last commit
aliases: changes (main)

# Future Commands
- branch
- checkout

### push
Pushes and saves the last commit / localsave online
aliases: upload (main)

### pull
Pulls the latest changes from online
aliases: download (main)

### sync
pull followed by push

## Features
- `Version Control:` Users can save the current state of their tabs as a "commit" graph.
- `Encryption:` Tab data is encrypted using the Web Crypto API and argon2-browser to ensure user privacy and security.
- `Storage Migrations:` The extension supports storage migrations to handle changes in the data schema over time, ensuring that users' tab data remains intact and accessible.
- `Diff Based Storage:` Only changes (diffs) between tab states are stored, optimizing storage usage and performance. Also potentially reducing the amount of data sent to the server if a cloud sync feature is implemented in the future.

## Contributing

All source code is located in in the `src` folder. Documentatino about how to contribute to this boilerplate is available in the `documentation` folder.

## Webpack auto-reload and HRM

To make workflow much more efficient this boilerplate uses the [webpack server](https://webpack.github.io/docs/webpack-dev-server.html) to development (started with `npm start`) with auto reload feature that reloads the browser automatically every time that you save some file in your editor.

## Resources:

- [Webpack documentation](https://webpack.js.org/concepts/)
- [Chrome Extension documentation](https://developer.chrome.com/extensions/getstarted)

---

Credit: The Boilerplate for adding React and Webpack support as well as typescript was provided by [Chrome Extension Boilerplate React](https://github.com/lxieyang/chrome-extension-boilerplate-react)

Deonte Vanterpool | [Website](https://deontevanterpool.com)
