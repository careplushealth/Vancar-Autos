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
                            <p className="footer__contact-info">
                                <span>Phone: <a href="tel:07386533337">07386 533337</a></span><br/>
                                <span>Email: <a href="mailto:hellovancarautos@gmail.com">hellovancarautos@gmail.com</a></span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="footer__legal-disclaimer">
                    <p>
                        Vancar Autos Limited is authorised and regulated by the Financial Conduct Authority (FCA Registered Number: 16593644). We act as a credit broker and not a lender. We can introduce you to a limited number of finance providers who may be able to offer you finance facilities for your purchase. We may receive a commission payment or other benefits from finance providers should you decide to enter into an agreement with them.
                    </p>
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
