import { Outlet } from 'react-router-dom';
import { DockBar } from '../components/DockBar';
import useScrollHide from '../hooks/useScrollHide';

export function DockLayout() {
    const isVisible = useScrollHide();
    return (
        <>
            <Outlet />
            {isVisible && <DockBar />}
        </>
    );
}
