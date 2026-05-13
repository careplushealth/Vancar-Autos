import { Link } from 'react-router-dom';
import './StickyActionBar.css';

export default function StickyActionBar() {
    return (
        <div className="sticky-bar">
            <div className="sticky-bar__inner">
                <Link to="/buy" className="sticky-bar__item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <span>View available cars</span>
                </Link>

                <div className="sticky-bar__divider" />

                <Link to="/buy" className="sticky-bar__item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    <span>View latest offers</span>
                </Link>

                <div className="sticky-bar__divider" />

                <Link to="/buy" className="sticky-bar__item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="1" y="3" width="15" height="13" />
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                        <circle cx="5.5" cy="18.5" r="2.5" />
                        <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    <span>Explore the range</span>
                </Link>
            </div>
        </div>
    );
}
