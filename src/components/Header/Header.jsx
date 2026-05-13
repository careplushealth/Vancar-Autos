import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import Logo from '../Logo/Logo';
import './Header.css';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    // Close menu when route changes
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location]);

    // Lock body scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMenuOpen]);

    return (
        <header className={`header ${isMenuOpen ? 'header--menu-open' : ''}`}>
            <div className="header__container container">
                {/* Menu Toggle (Left) */}
                {!isMenuOpen ? (
                    <button className="header__menu-btn" onClick={() => setIsMenuOpen(true)}>
                        <span className="header__menu-icon">☰</span>
                        <span className="header__menu-text">Menu</span>
                    </button>
                ) : (
                    <button className="header__menu-btn header__menu-btn--close" onClick={() => setIsMenuOpen(false)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        <span className="header__menu-text">Close</span>
                    </button>
                )}

                {/* Center Logo */}
                <Link to="/" className="header__logo-link">
                    <Logo />
                </Link>

                {/* Right Actions */}
                <div className="header__actions">
                    <Link to="/buy" className="header__action-icon" aria-label="Search">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </Link>
                    <Link to="/admin" className="header__action-icon" aria-label="Account">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </Link>
                </div>
            </div>

            {/* Full Screen Slide-down Menu */}
            <div className={`header__overlay ${isMenuOpen ? 'header__overlay--open' : ''}`}>
                <div className="container">
                    <nav className="header__nav">
                        <ul className="header__nav-list">
                            <li className="header__nav-item">
                                <NavLink to="/buy" className="header__nav-link">
                                    <span>Models & Inventory</span>
                                    <span className="header__nav-arrow">›</span>
                                </NavLink>
                            </li>
                            <li className="header__nav-item">
                                <NavLink to="/buy" className="header__nav-link">
                                    <span>Find & Buy</span>
                                    <span className="header__nav-arrow">›</span>
                                </NavLink>
                            </li>
                            <li className="header__nav-item">
                                <NavLink to="/sell" className="header__nav-link">
                                    <span>Sell Your Car</span>
                                    <span className="header__nav-arrow">›</span>
                                </NavLink>
                            </li>
                            <li className="header__nav-item">
                                <NavLink to="/about" className="header__nav-link">
                                    <span>About Us</span>
                                    <span className="header__nav-arrow">›</span>
                                </NavLink>
                            </li>
                            <li className="header__nav-item">
                                <NavLink to="/blog" className="header__nav-link">
                                    <span>News & Reviews</span>
                                    <span className="header__nav-arrow">›</span>
                                </NavLink>
                            </li>
                            <li className="header__nav-item">
                                <NavLink to="/contact" className="header__nav-link">
                                    <span>Contact</span>
                                    <span className="header__nav-arrow">›</span>
                                </NavLink>
                            </li>
                        </ul>
                    </nav>

                    <div className="header__overlay-footer">
                        <button className="header__location-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            Select Centre
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
