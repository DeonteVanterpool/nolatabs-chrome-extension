import React, {useEffect, useState} from 'react';
import {createHashRouter, RouterProvider, Navigate, Outlet, useLocation} from "react-router-dom";
import {isLoggedIn, hookLogin} from "src/libs/handlers/cryptography";
import Main from './pages/Main';
import Welcome from './pages/Welcome/Welcome';
import Login from './pages/Login/Login';
import {CheckLoggedIn, CheckWelcomeStatusMessage} from 'src/models/messages';
import './Frontend.css';
import './theme.css';

interface Props {}

const LoginWrapper: React.FC = () => {
    return <Login />;
};

const WelcomeWrapper: React.FC = () => {
    return <Welcome />;
};

const AuthGuard: React.FC = () => {
    const [authState, setAuthState] = useState<{
        isWelcomed: boolean;
        isLoggedIn: boolean;
        isLoading: boolean;
    }>({isWelcomed: false, isLoggedIn: false, isLoading: true});

    // hook to set auth state on mount
    useEffect(() => { // on mount
        let counter = 0;
        const checkLoggedIn = async () => {
            console.log("checking that user is logged in ")
            const loggedIn = await chrome.runtime.sendMessage({kind: "checkLoggedIn"} satisfies CheckLoggedIn);
            setAuthState(prev => {
                let tmp = ({...prev, isLoggedIn: loggedIn, isLoading: (++counter < 2)})
                return tmp;
            });
        };
        const checkWelcomeStatus = async () => {
            let welcomeStatus: boolean = await chrome.runtime.sendMessage({kind: "checkWelcomeStatus"} satisfies CheckWelcomeStatusMessage);
            setAuthState(prev => {
                let tmp = ({...prev, isWelcomed: welcomeStatus, isLoading: (++counter < 2)})
                return tmp;
            })
        };

        checkLoggedIn();
        checkWelcomeStatus();
    }, []);

    // hook to set auth state when db state changes
    useEffect(() => {
        const unsubscribeLogin = hookLogin(() => setAuthState(prev => ({...prev, isLoggedIn: true})));
        const updateWelcomed = () => {
            console.log("createUser event detected, updating auth state to welcomed.");
            setAuthState(prev => ({...prev, isWelcomed: true}));
        };
        const callBack = (message: {kind: "hookCreateUser"}) => {
            console.log("Received message from background script:", message);
            if (message.kind === "hookCreateUser") {
                updateWelcomed();
            }
        }
        chrome.runtime.onMessage.addListener(callBack);
        const cleanup = () => {
            chrome.runtime.onMessage.removeListener(callBack);
            unsubscribeLogin();
        }
        return () => {
            cleanup();
        };
    }, []);

    const location = useLocation();
    if (authState.isLoading) {
        return <div>Loading...</div>
    }

    let correctPath: string;
    if (!authState.isWelcomed) {
        correctPath = "/welcome";
    } else if (!authState.isLoggedIn) {
        correctPath = "/login";
    } else { // if user is welcomed and signed in
        correctPath = ["/welcome", "/login"].includes(location.pathname) ? "/" : location.pathname;
    }

    if (location.pathname !== correctPath) {
        return <Navigate to={correctPath} replace />;
    }

    return <Outlet />;
};

const router = createHashRouter([
    {
        path: "/",
        element: <AuthGuard />,
        children: [
            {
                index: true,
                element: <Main />
            },
            {
                path: "login",
                element: <LoginWrapper />
            },
            {
                path: "welcome",
                element: <WelcomeWrapper />
            }
        ]
    }
]);

const Frontend: React.FC<Props> = () => {
    return <RouterProvider router={router} />;
};

export default Frontend;
