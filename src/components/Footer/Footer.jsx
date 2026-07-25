import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer__top">
                    <Link to="/" className="footer__logo">
                        <img src="/images/logo.png" alt="Vancar Autos" className="h-10 w-auto" />
                    </Link>
                    <button className="footer__back-top" onClick={scrollToTop}>
                        Back to top 
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1.5 inline"><polyline points="18 15 12 9 6 15"/></svg>
                    </button>
                </div>

                <div className="footer__main">
                    <div className="footer__grid">
                        <div className="footer__col">
                            <h4 className="footer__heading">Browse Vehicles</h4>
                            <ul className="footer__list">
                                <li><Link to="/buy?bodyType=SUV">Used SUVs</Link></li>
                                <li><Link to="/buy?bodyType=Saloon">Used Saloons</Link></li>
                                <li><Link to="/buy?bodyType=Hatchback">Used Hatchbacks</Link></li>
                                <li><Link to="/buy?bodyType=Estate">Used Estates</Link></li>
                                <li><Link to="/buy?bodyType=Sport">Performance Cars</Link></li>
                            </ul>
                        </div>
                        
                        <div className="footer__col">
                            <h4 className="footer__heading">Buying Options</h4>
                            <ul className="footer__list">
                                <li><Link to="/buy">Search Used Stock</Link></li>
                                <li><Link to="/sell">Value Your Vehicle</Link></li>
                                <li><Link to="/about">Our Quality Standards</Link></li>
                                <li><Link to="/buy">Affordable Used Cars</Link></li>
                                <li><Link to="/contact">Part Exchange Enquiry</Link></li>
                            </ul>
                        </div>

                        <div className="footer__col">
                            <h4 className="footer__heading">Customer Care</h4>
                            <ul className="footer__list">
                                <li><Link to="/about">Our Story</Link></li>
                                <li><Link to="/blog">Dealership News</Link></li>
                                <li><Link to="/contact">Get in Touch</Link></li>
                                <li><Link to="/contact">Location & Directions</Link></li>
                                <li><Link to="/admin">Staff Login</Link></li>
                            </ul>
                        </div>

                        <div className="footer__col">
                            <h4 className="footer__heading">Opening Hours</h4>
                            <ul className="footer__hours-list">
                                <li><span>Monday - Friday:</span> <span>09:00 - 18:00</span></li>
                                <li><span>Saturday:</span> <span>09:00 - 17:00</span></li>
                                <li><span>Sunday:</span> <span>10:00 - 16:00</span></li>
                                <li className="text-[var(--color-accent)] font-medium"><span>Bank Holidays:</span> <span>Closed</span></li>
                            </ul>
                        </div>

                        <div className="footer__col">
                            <h4 className="footer__heading">Contact & Location</h4>
                            <p className="footer__contact-text">
                                <strong>Vancar Autos Showroom</strong><br/>
                                14 Midland Street<br/>
                                Manchester, M12 6LB
                            </p>
                            <ul className="footer__contact-info-list">
                                <li className="footer__contact-item">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="footer__contact-icon">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                    <a href="tel:07386533337">07386 533337</a>
                                </li>
                                <li className="footer__contact-item">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="footer__contact-icon">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                    <a href="mailto:hellovancarautos@gmail.com">hellovancarautos@gmail.com</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="footer__bottom">
                    <div className="footer__bottom-inner">
                        <p className="footer__copyright">
                            © {new Date().getFullYear()} Vancar Autos Limited. All rights reserved. Registered in England & Wales. Company Reg No: 16593644.
                        </p>
                        <div className="footer__legal">
                            <a href="#">Privacy Policy</a>
                            <a href="#">Terms & Conditions</a>
                            <a href="#">Cookie Policy</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
