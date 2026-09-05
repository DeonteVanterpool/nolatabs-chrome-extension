import React, {useEffect, useState} from 'react';
import {createHashRouter, RouterProvider, Navigate, Outlet, useLocation} from "react-router-dom";
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


    const checkLoggedIn = async () => {
        let loggedIn = await chrome.runtime.sendMessage(
            {kind: "checkLoggedIn"} satisfies CheckLoggedIn
        );
        if (loggedIn === undefined) {
            setTimeout(async () => {
                loggedIn = await chrome.runtime.sendMessage(
                    {kind: "checkLoggedIn"} satisfies CheckLoggedIn
                );
            }, 200);
            if (loggedIn === undefined) {
                return false;
            }
        }
        return loggedIn.loggedIn;
    };

    const checkWelcomeStatus = async () => {
        const welcomeStatus = await chrome.runtime.sendMessage(
            {kind: "checkWelcomeStatus"} satisfies CheckWelcomeStatusMessage
        );
        return welcomeStatus;
    };


    useEffect(() => {
        (async () => {
            const [loggedIn, welcomeStatus] = await Promise.all([
                checkLoggedIn(),
                checkWelcomeStatus(),
            ]);

            setAuthState({
                isWelcomed: welcomeStatus,
                isLoggedIn: loggedIn,
                isLoading: false,
            });
        })();
    }, []);

    useEffect(() => {
        const callBack = async (message: {kind: "hookCreateUser" | "hookLoggedIn"}) => {
            if (message.kind === "hookCreateUser") {
                setAuthState(prev => ({...prev, isWelcomed: true}));
                return;
            }

            if (message.kind === "hookLoggedIn") {
                // IMPORTANT: re-check source of truth after the hook
                const loggedIn = await checkLoggedIn();
                setAuthState(prev => ({...prev, isLoggedIn: loggedIn}));
                return;
            }
        };

        chrome.runtime.onMessage.addListener(callBack);
        return () => chrome.runtime.onMessage.removeListener(callBack);
    }, []);

    const location = useLocation();
    if (authState.isLoading) {
        return <div>Loading...</div>
    }

    console.log("authstate: ", authState);
    let correctPath: string;
    if (!authState.isWelcomed) {
        correctPath = "/welcome";
    } else if (!authState.isLoggedIn) {
        correctPath = "/login";
    } else { // if user is welcomed and signed in
        console.log("last path")
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
