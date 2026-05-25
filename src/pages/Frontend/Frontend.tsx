import React, { useEffect, useState } from 'react';
import { createHashRouter, RouterProvider, Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import './Frontend.css';import './theme.css';
import './theme.css';
import { User } from '../models/user';
import { UserService } from '../services/user';
import Main from './pages/Main';
import Welcome from './pages/Welcome/Welcome';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { LoggedInMessage, WelcomedMessage, WelcomeMessage } from '../models/messages';

interface Props {}

const SignupWrapper: React.FC = () => {
    const navigate = useNavigate();
    
    const handleSignup = async (user: User) => {
        // Force a hard check or pass state if your backend requires it
        navigate("/", { replace: true });
    };

    return <Signup handleSignup={handleSignup} handleRenderLoginPage={() => navigate("/login")} />;
};

const LoginWrapper: React.FC = () => {
    const navigate = useNavigate();
    return <Login onLogin={() => navigate("/", { replace: true })} renderSignup={() => navigate("/signup")} />;
};

const WelcomeWrapper: React.FC = () => {
    const navigate = useNavigate();

    const handleWelcome = async (info: { password: string; devMode: boolean }) => {
        await chrome.runtime.sendMessage(WelcomeMessage.new(info.password, info.devMode));
        navigate("/", { replace: true });
    };

    return <Welcome handleSubmit={handleWelcome} handleRenderLoginPage={() => navigate("/login")} />;
};

const AuthGuardian: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [authState, setAuthState] = useState<{
        isWelcomed: boolean;
        isLoggedIn: boolean;
        hasSavedUser: boolean;
    }>({ isWelcomed: false, isLoggedIn: false, hasSavedUser: false });

    const location = useLocation();

    useEffect(() => {
        const checkAuthStatus = async () => {
            const storage = chrome.storage.local;
            
            try {
                const isWelcomed = await chrome.runtime.sendMessage(WelcomedMessage.new());
                const isLoggedIn = await chrome.runtime.sendMessage(LoggedInMessage.new());
                const savedUser = await UserService.get(storage);

                setAuthState({
                    isWelcomed: !!isWelcomed,
                    isLoggedIn: !!isLoggedIn,
                    hasSavedUser: savedUser !== null
                });
            } catch (error) {
                console.error("Failed to initialize auth state:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, [location.pathname]); // Re-run evaluation whenever the route changes!

    if (isLoading) {
        return <div className="loading-screen">Loading secure environment...</div>; 
    }

    // Determine the absolute ground-truth destination based on actual status
    let correctPath = "/signup";
    if (!authState.isWelcomed) {
        correctPath = "/welcome";
    } else if (authState.isLoggedIn) {
        correctPath = "/";
    } else if (authState.hasSavedUser) {
        correctPath = "/login";
    }

    // If the user is at the root "/" but shouldn't be, redirect them
    if (location.pathname === "/" && !authState.isLoggedIn) {
        return <Navigate to={correctPath} replace />;
    }

    // If they are trying to access auth pages (login/signup) but are already logged in, send them home
    if (location.pathname !== "/" && authState.isLoggedIn) {
        return <Navigate to="/" replace />;
    }

    // Otherwise, render the requested nested route
    return <Outlet />;
};

const router = createHashRouter([
    {
        path: "/",
        element: <AuthGuardian />,
        children: [
            {
                index: true,
                element: <Main />
            },
            {
                path: "signup",
                element: <SignupWrapper />
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
