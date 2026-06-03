import React, {useEffect, useState} from 'react';
import '../Frontend.css';

export type Page = {
    name: string,
    component: React.FC,
}

interface Props {
    pages: Page[],
    selectedPage?: string,
}

const ViewSwitcher: React.FC<Props> = ({pages, selectedPage}: Props) => {
    const [currentPage, setCurrentPage] = useState<string>(pages.find(page => page.name === selectedPage)?.name || pages[0].name);

    useEffect(() => {
        if (selectedPage && pages.some(page => page.name === selectedPage)) {
            setCurrentPage(selectedPage);
        }
    }, [pages, selectedPage]);


    const CurrentComponent = pages.find(page => page.name === currentPage)?.component || (() => <div>Page not found</div>);
    return <CurrentComponent />;
};

export default ViewSwitcher;
