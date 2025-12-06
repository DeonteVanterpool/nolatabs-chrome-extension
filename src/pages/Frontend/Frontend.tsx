import React, {useEffect, useState} from 'react';
// import init, { greet } from '../../wasm/mls/pkg/mls';
import './Frontend.css';
import {User} from '../models/user';
import {UserService} from '../services/user';
import {UserRepository} from '../repository/user';
import ViewSwitcher from './components/ViewSwitcher';
import {CommitRepository} from '../repository/commit';
import {RepositoryRepository} from '../repository/repository';
import Main from './pages/Main';
import Login from './pages/Login';
import Signup from './pages/Signup';

type page = "signup" | "login" | "main"

interface Props { }

const Frontend: React.FC<Props> = ({}: Props) => {
    const [user, setCurrentUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState(user ? "login" : "signup");

    const storage = chrome.storage.local;

    const userRepository = new UserRepository(storage);
    const commitRepository = new CommitRepository(storage);
    const repositoryRepository = new RepositoryRepository(storage);

    const [userService] = useState<UserService>(new UserService(new UserRepository(chrome.storage.local)));

    // On component mount, check if user is logged in (we want this to be async)
    useEffect(() => {
        const init = async () => {
            if (await userService.get() !== null) {
                setCurrentPage("login");
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
