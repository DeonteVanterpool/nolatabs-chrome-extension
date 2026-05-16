## src/pages 
This directory contains most of actual code that is ran by the extension, including the main extension frontend page.

`src/pages/Background`
This directory contains all the code that is ran in the background. This includes keeping the extension page open, and executing commands.

`src/pages/Content`
This directory has all the code that needs to run on the webpage that you're currently on.

`src/pages/Frontend`
This contains the extension's webpage, built using React.

`src/pages/Options` 
This contains the extension's settings page.

`src/pages/models`
This directory has the domain models.

`src/pages/repository`
This project uses the repository pattern. Repository files handle external data accesses and mutation.

`src/pages/services`
This project uses the Functional Core, Imperative Shell design pattern. This directory is the imperative shell. It is the part of the business logic that deals with side effects.

`src/pages/logic`
This directory is the functional core of the project. It has all the pure functions for the project. Unit tests should be on the functions in this file.

## src/wasm
This project uses webassembly. Any libraries in Webassembly will go here.

## src/tests
This directory contains all the tests for the frontend of the project

## Backend
For the backend, please look at [Nolatabs Backend](https://github.com/DeonteVanterpool/nolatabs-backend)
