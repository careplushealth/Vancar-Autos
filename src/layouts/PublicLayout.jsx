import { Outlet, useLocation } from 'react-router-dom';
import KarmaNavbar from '../components/KarmaNavbar/KarmaNavbar';
import Footer from '../components/Footer/Footer';
import StickyActionBar from '../components/StickyActionBar/StickyActionBar';

const SHOW_ACTION_BAR = ['/', '/buy'];

export default function PublicLayout() {
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    const showActionBar = SHOW_ACTION_BAR.includes(location.pathname) ||
        location.pathname.startsWith('/buy/');

    return (
        <div className="public-layout">
            <KarmaNavbar />
            <main className="public-layout__main" style={{ paddingTop: isHomePage ? '0' : 'var(--header-height)' }}>
                <Outlet />
            </main>
            <Footer />
            {showActionBar && <StickyActionBar />}
        </div>
    );
}
