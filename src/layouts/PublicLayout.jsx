import { Outlet, useLocation } from 'react-router-dom';
import KarmaNavbar from '../components/KarmaNavbar/KarmaNavbar';
import Footer from '../components/Footer/Footer';
import CompareDrawer from '../components/CompareDrawer/CompareDrawer';

export default function PublicLayout() {
    const location = useLocation();
    const isHomePage = location.pathname === '/';

    return (
        <div className="public-layout">
            <KarmaNavbar />
            <main className="public-layout__main" style={{ paddingTop: isHomePage ? '0' : 'var(--header-height)' }}>
                <Outlet />
            </main>
            <Footer />
            <CompareDrawer />
        </div>
    );
}
