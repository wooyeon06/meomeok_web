import { Outlet } from 'react-router-dom';
import { useGlobalScrollIntoViewOnFocus } from '../utils/scrollIntoViewWithKeyboard';

export function RootLayout() {
    useGlobalScrollIntoViewOnFocus();
    return <Outlet />;
}
