import React, {useEffect, useState} from 'react';
// import init, { greet } from '../../wasm/mls/pkg/mls';
import './Frontend.css';
import {User} from '../models/user';
import {UserService} from '../services/user';
import {UserStore} from '../repository/user';
import ViewSwitcher from './components/ViewSwitcher';
import Main from './pages/Main';
import Login from './pages/Login';
import Signup from './pages/Signup';
import {LoggedInMessage} from '../models/messages';

type page = "signup" | "login" | "main"

interface Props {}

const Frontend: React.FC<Props> = ({}: Props) => {
    const [user, setCurrentUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState(user ? "login" : "signup");

    const storage = chrome.storage.local;

    const [userService] = useState<UserService>(new UserService(new UserStore(chrome.storage.local)));

    // On component mount, check if user is logged in (we want this to be async)
    useEffect(() => {
        const init = async () => {
            if (await userService.get() !== null) {
                setCurrentPage("login");
            }
            console.log(await chrome.runtime.sendMessage(LoggedInMessage.new()));
            if (await chrome.runtime.sendMessage(LoggedInMessage.new()) === true) { // check if user is logged in with background script. The background script is more reliable for this because it will persist across page reloads, while the content script will not
                setCurrentPage("main");
                setCurrentUser(await userService.get())

            }
        }
        init();
    }, [userService]);

    function handleLogin() {
        setCurrentPage("main");
    }
    function handleSignup(user: User) {
        setCurrentUser(user);
        handleLogin();
    }
    function handleRenderSignupPage() {
        setCurrentPage("signup");
    }
    function handleRenderLoginPage() {
        setCurrentPage("login");
    }

    /*
    async function loadWasm() {
        await init('./mls_bg.wasm');  // Path relative to extension root
        // Now you can use your Rust functions
        // greet("deonte")
    }
     */

    const SignUpComponent = () => <Signup handleSignup={handleSignup} handleRenderLoginPage={handleRenderLoginPage} userService={userService}></Signup>;
    const LoginComponent = () => <Login onLogin={handleLogin} renderSignup={handleRenderSignupPage} userService={userService}></Login>;
    const MainComponent = () => <Main></Main>;

    return <ViewSwitcher pages={[
        {name: "signup", component: SignUpComponent},
        {name: "login", component: LoginComponent},
        {name: "main", component: MainComponent},
    ]} selectedPage={currentPage}></ViewSwitcher>
};

export default Frontend;
