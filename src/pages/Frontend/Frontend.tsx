import React from 'react';
import './Frontend.css';

interface Props {
  title: string;
}

const Frontend: React.FC<Props> = ({ title }: Props) => {
  return <div className="FrontendContainer">{title} Page</div>;
};

export default Frontend;
