import React, {useEffect, useState} from 'react';
import {createHashRouter, RouterProvider, Navigate, Outlet, useLocation} from "react-router-dom";
import {handleIsLoggedIn, hookLogin} from "src/libs/handlers/cryptography";
import Main from './pages/Main';
import Welcome from './pages/Welcome/Welcome';
import Login from './pages/Login/Login';
import {CheckWelcomeStatusMessage} from 'src/models/messages';
import {hookCreateUser} from 'src/libs/db/storage';
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
    }>({isWelcomed: false, isLoggedIn: false, isLoading: false});

    // hook to set auth state on mount
    useEffect(() => { // on mount
        let counter = 0;
        const checkLoggedIn = async () => {
            const loggedIn = await handleIsLoggedIn();
            setAuthState(prev => ({...prev, isLoggedIn: loggedIn, isLoading: (++counter >= 2)}));
        };
        const checkWelcomeStatus = async () => {
            let welcomeStatus: boolean = await chrome.runtime.sendMessage({kind: "checkWelcomeStatus"} satisfies CheckWelcomeStatusMessage);
            setAuthState(prev => ({...prev, isWelcomed: welcomeStatus, isLoading: (++counter >= 2)}))
        };

        checkLoggedIn();
        checkWelcomeStatus();
    }, []);

    // hook to set auth state when db state changes
    useEffect(() => {
        const unsubscribeLogin = hookLogin(() => setAuthState(prev => ({...prev, isLoggedIn: true})));
        const updateWelcomed = () => setAuthState(prev => ({...prev, isWelcomed: true}));
        hookCreateUser.subscribe(updateWelcomed);
        const cleanup = () => {
            unsubscribeLogin?.();
            hookCreateUser.unsubscribe(updateWelcomed);
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
