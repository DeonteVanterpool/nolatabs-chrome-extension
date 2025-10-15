import React, {useEffect, useState} from 'react';
import './Frontend.css';
import Signup from './Signup';
import {User} from '../models/user';
import Login from './Login';
import Main from './Main';
import {UserService} from '../services/user';
import {UserRepository} from '../repository/user';

type page = "signup" | "login" | "main"

interface Props { }

const Frontend: React.FC<Props> = ({}: Props) => {
    const [user, setCurrentUser] = useState<User | null>(null);
    // return <div className="FrontendContainer">{user ? "signup" : "login"} Page</div>;
    const [currentPage, setCurrentPage] = useState(user ? "login" : "signup");

    let userService = new UserService(new UserRepository(chrome.storage.local));
    async function userExists() {
        if (!user && await userService.get() !== null) {
            setCurrentPage("login");
        }
    }

    useEffect(() => {
        userExists();
    });

    function handleSignup(user: User) {
        setCurrentPage("main");
        setCurrentUser(user);
    }

    function renderLogin() {
        setCurrentPage("login");
    }
    function handleLogin() {
        setCurrentPage("main");
        setCurrentUser(user);
    }

    function renderSignup() {
        setCurrentPage("signup");
    }
    switch (currentPage) {
        case "signup":
            return (<>
                <Signup onSignup={handleSignup} renderLogin={renderLogin}></Signup></>);
        case "login":
            return (<>
                <Login onLogin={handleLogin} renderSignup={renderSignup}></Login></>);
        case "main":
            return (<>
                <Main></Main></>);
        default:
            throw new Error("unexpected case");
    }
};

export default Frontend;
