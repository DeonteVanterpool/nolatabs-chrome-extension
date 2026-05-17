import React, {useEffect, useState} from 'react';
// import init, { greet } from '../../wasm/mls/pkg/mls';
import './Frontend.css';
import {User} from '../models/user';
import {UserService} from '../services/user';
import {UserStore} from '../repository/user';
import ViewSwitcher from './components/ViewSwitcher';
import Main from './pages/Main';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Signup from './pages/Signup';
import {LoggedInMessage, WelcomedMessage, WelcomeMessage} from '../models/messages';

type page = "signup" | "login" | "main" | "welcome"

interface Props {}

const Frontend: React.FC<Props> = ({}: Props) => {
    const [user, setCurrentUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState(user ? "login" : "signup");

    const storage = chrome.storage.local;

    // On component mount, check if user is logged in (we want this to be async)
    useEffect(() => {
        const init = async () => {
            if (await chrome.runtime.sendMessage(WelcomedMessage.new()) === false) {
                setCurrentPage("welcome");
            } else if (await chrome.runtime.sendMessage(LoggedInMessage.new()) === true) { // check if user is logged in with background script. The background script is more reliable for this because it will persist across page reloads, while the content script will not
                console.log("loading main")
                setCurrentPage("main");
                setCurrentUser(await UserService.get(storage))
            } else if (await UserService.get(chrome.storage.local) !== null) {
                console.log("loading login")
                setCurrentPage("login");
            }        }
        init();
    }, []);

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

    async function handleWelcome(password: string, devMode: boolean) {
        await chrome.runtime.sendMessage(WelcomeMessage.new(password, devMode));
        setCurrentPage("main")
    }

    /*
    async function loadWasm() {
        await init('./mls_bg.wasm');  // Path relative to extension root
        // Now you can use your Rust functions
        // greet("deonte")
    }
     */

    const SignUpComponent = () => <Signup handleSignup={handleSignup} handleRenderLoginPage={handleRenderLoginPage}></Signup>;
    const LoginComponent = () => <Login onLogin={handleLogin} renderSignup={handleRenderSignupPage}></Login>;
    const MainComponent = () => <Main></Main>;
    const WelcomeComponent = () => <Welcome handleSubmit={info => handleWelcome(info.password, info.devMode)} handleRenderLoginPage={function (): void {
        handleRenderLoginPage()
    } }></Welcome>;

    return <ViewSwitcher pages={[
        {name: "signup", component: SignUpComponent},
        {name: "login", component: LoginComponent},
        {name: "main", component: MainComponent},
        {name: "welcome", component: WelcomeComponent},
    ]} selectedPage={currentPage}></ViewSwitcher>
};

export default Frontend;
