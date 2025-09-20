import React from 'react';
import './Frontend.css';
import {UserService} from '../services/user';
import {UserRepository} from '../repository/user';
import Signup from './Signup';

type page = "signup" | "login" | "main"

interface Props {
    page: page;
}

let user = new UserService(new UserRepository(chrome.storage.local));

const Frontend: React.FC<Props> = ({ page }: Props) => {
    // return <div className="FrontendContainer">{user ? "signup" : "login"} Page</div>;
  return <Signup></Signup>
};

export default Frontend;
