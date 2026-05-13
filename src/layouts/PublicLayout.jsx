import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import StickyActionBar from '../components/StickyActionBar/StickyActionBar';

const SHOW_ACTION_BAR = ['/', '/buy'];

export default function PublicLayout() {
    const location = useLocation();
    const showActionBar = SHOW_ACTION_BAR.includes(location.pathname) ||
        location.pathname.startsWith('/buy/');

    return (
        <div className="public-layout">
            <Header />
            <main className="public-layout__main" style={{ paddingTop: 'var(--header-height)' }}>
                <Outlet />
            </main>
            <Footer />
            {showActionBar && <StickyActionBar />}
        </div>
    );
}
