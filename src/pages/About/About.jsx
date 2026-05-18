import { Link } from 'react-router-dom';
import './About.css';

export default function About() {
    return (
        <div className="about">
            <section className="about__hero">
                <div className="container">
                    <span className="about__badge">About Vancar Autos</span>
                    <h1 className="about__hero-title">Driven by Trust.<br/><span className="highlight">Powered by Quality.</span></h1>
                    <p className="about__hero-text">
                        At Vancar Autos, we believe buying a car should be simple, transparent, and stress-free. We're committed to helping drivers find high-quality, affordable vehicles they can rely on — backed by honest advice and exceptional customer service.
                    </p>
                    <p className="about__hero-text">
                        Whether you're purchasing your first car, upgrading your family vehicle, or searching for something practical and dependable, our team is here to help you every step of the way.
                    </p>
                </div>
            </section>

            <section className="about__stats section">
                <div className="container">
                    <div className="about__stats-grid">
                        <div className="about__stat">
                            <span className="about__stat-number">15+</span>
                            <span className="about__stat-label">Years of Experience</span>
                        </div>
                        <div className="about__stat">
                            <span className="about__stat-number">5,000+</span>
                            <span className="about__stat-label">Happy Customers</span>
                        </div>
                        <div className="about__stat">
                            <span className="about__stat-number">200+</span>
                            <span className="about__stat-label">Cars in Stock</span>
                        </div>
                        <div className="about__stat">
                            <span className="about__stat-number">4.8★</span>
                            <span className="about__stat-label">Average Rating</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="about__story section">
                <div className="container">
                    <div className="about__story-grid">
                        <div className="about__story-content">
                            <h2 className="section-title">Our Story</h2>
                            <p>Our journey began back in 2010 with a simple vision: to create a dealership built on trust, quality, and genuine customer care.</p>
                            <p>What started as a small independent business with a passion for great cars quickly grew through hard work, dedication, and the loyalty of satisfied customers who valued our honest approach.</p>
                            <p>Over the years, we've built a reputation for carefully selecting quality vehicles, offering competitive prices, and making the buying process as straightforward as possible.</p>
                            <p>Today, Vancar Autos continues to serve drivers with the same values we started with — integrity, reliability, and a commitment to helping every customer drive away with confidence.</p>
                        </div>
                        <div className="about__story-image">
                            <img src="https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80" alt="Vancar Autos Showroom" />
                            <div className="about__story-overlay"></div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="about__why section">
                <div className="container">
                    <h2 className="section-title text-center">Why Choose Us?</h2>
                    <div className="about__values-grid">
                        <div className="about__value-card">
                            <div className="about__value-icon">🔍</div>
                            <h3>Carefully Selected</h3>
                            <p>Every vehicle is handpicked and thoroughly inspected to ensure quality, reliability, and value.</p>
                        </div>
                        <div className="about__value-card">
                            <div className="about__value-icon">🏷️</div>
                            <h3>Honest Pricing</h3>
                            <p>No hidden surprises — just fair, competitive pricing you can trust.</p>
                        </div>
                        <div className="about__value-card">
                            <div className="about__value-icon">🤝</div>
                            <h3>Customer-First</h3>
                            <p>We take pride in providing friendly, professional guidance tailored to your needs.</p>
                        </div>
                        <div className="about__value-card">
                            <div className="about__value-icon">💰</div>
                            <h3>Affordable Finance</h3>
                            <p>Flexible finance solutions designed to make owning your next car simple and accessible.</p>
                        </div>
                        <div className="about__value-card">
                            <div className="about__value-icon">⭐</div>
                            <h3>Trusted Experience</h3>
                            <p>With over 15 years of experience, we understand what drivers are looking for and deliver with confidence.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="about__mission section">
                <div className="container">
                    <div className="about__mission-box">
                        <h2>Our Mission</h2>
                        <h3 className="mission-statement">"To make quality cars affordable and car buying enjoyable."</h3>
                        <p>We're passionate about connecting people with vehicles that fit their lifestyle and budget while delivering a dealership experience built on trust and transparency.</p>
                    </div>
                </div>
            </section>

            <section className="about__cta section">
                <div className="container text-center">
                    <h2>Visit Us Today</h2>
                    <p className="about__cta-text">Discover why so many drivers choose Vancar Autos for quality used cars and exceptional service. Browse our latest stock or get in touch with our team today — we're here to help you find the perfect car for your journey ahead.</p>
                    <div className="about__cta-buttons">
                        <Link to="/buy" className="btn btn--primary">Browse Stock</Link>
                        <Link to="/contact" className="btn btn--outline">Contact Us</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
