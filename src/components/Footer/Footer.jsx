import './Footer.css';

export default function Footer() {
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer__top">
                    <button className="footer__back-top" onClick={scrollToTop}>Back to top ↑</button>
                </div>

                <div className="footer__main">
                    <div className="footer__grid">
                        <div className="footer__col">
                            <h4 className="footer__heading">Models</h4>
                            <ul className="footer__list">
                                <li><a href="/buy?bodyType=SUV">SUVs</a></li>
                                <li><a href="/buy?bodyType=Saloon">Saloons</a></li>
                                <li><a href="/buy?bodyType=Sport">Sport</a></li>
                                <li><a href="/buy?bodyType=Electric">Electric</a></li>
                            </ul>
                        </div>
                        <div className="footer__col">
                            <h4 className="footer__heading">Buying & Selling</h4>
                            <ul className="footer__list">
                                <li><a href="/buy">Find a Car</a></li>
                                <li><a href="/sell">Sell Your Car</a></li>
                                <li><a href="/buy">Finance Calculator</a></li>
                                <li><a href="/buy">Part Exchange</a></li>
                            </ul>
                        </div>
                        <div className="footer__col">
                            <h4 className="footer__heading">About Us</h4>
                            <ul className="footer__list">
                                <li><a href="/about">Our Story</a></li>
                                <li><a href="/blog">News & Reviews</a></li>
                                <li><a href="/contact">Contact Us</a></li>
                                <li><a href="/about">Careers</a></li>
                            </ul>
                        </div>
                        <div className="footer__col">
                            <h4 className="footer__heading">Follow Us</h4>
                            <div className="footer__social">
                                <a href="#" className="footer__social-link">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                                </a>
                                <a href="#" className="footer__social-link">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                                </a>
                                <a href="#" className="footer__social-link">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" /></svg>
                                </a>
                                <a href="#" className="footer__social-link">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.35 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></svg>
                                </a>
                            </div>
                        </div>
                        <div className="footer__col">
                            <h4 className="footer__heading">Visit Us</h4>
                            <p className="footer__text">
                                14 MIDLAND STREET<br />
                                MANCHESTER<br />
                                M12 6LB<br />
                                Reg. No: 16593644
                            </p>
                        </div>
                    </div>
                </div>

                <div className="footer__bottom">
                    <div className="footer__bottom-inner">
                        <p className="footer__copyright">© {new Date().getFullYear()} VANCAR AUTOS LIMITED. Reg. No 16593644. All rights reserved.</p>
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
