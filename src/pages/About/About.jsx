import './About.css';

export default function About() {
    return (
        <div className="about">
            <section className="about__hero">
                <div className="container">
                    <h1 className="about__hero-title">About VANCAR AUTOS LIMITED</h1>
                    <p className="about__hero-text">A family-run dealership with a passion for quality cars and exceptional customer service since 2010.</p>
                </div>
            </section>

            <section className="about__story section">
                <div className="container">
                    <div className="about__story-grid">
                        <div className="about__story-content">
                            <h2>Our Story</h2>
                            <p>VANCAR AUTOS LIMITED was founded with a simple vision: to make buying and selling used cars a transparent, enjoyable experience. From our humble beginnings as a small forecourt operation, we've grown into one of the region's most trusted dealerships.</p>
                            <p>We hand-pick every vehicle in our inventory, ensuring each car meets our exacting standards for quality, reliability, and value. Our team of experienced professionals is dedicated to finding you the perfect car at the right price.</p>
                        </div>
                        <div className="about__story-image">
                            <img src="/images/car-sedan.png" alt="Our showroom" />
                        </div>
                    </div>
                </div>
            </section>

            <section className="about__values section">
                <div className="container">
                    <h2 className="section-title">Our Values</h2>
                    <div className="about__values-grid">
                        <div className="about__value-card">
                            <div className="about__value-icon">🤝</div>
                            <h3>Trust & Transparency</h3>
                            <p>Every vehicle comes with a full history check and honest assessment. No hidden surprises, ever.</p>
                        </div>
                        <div className="about__value-card">
                            <div className="about__value-icon">⭐</div>
                            <h3>Quality Assured</h3>
                            <p>Each car undergoes a rigorous multi-point inspection before it reaches our showroom floor.</p>
                        </div>
                        <div className="about__value-card">
                            <div className="about__value-icon">💰</div>
                            <h3>Fair Pricing</h3>
                            <p>Competitive, market-informed pricing with flexible finance options to suit every budget.</p>
                        </div>
                        <div className="about__value-card">
                            <div className="about__value-icon">🛡️</div>
                            <h3>Peace of Mind</h3>
                            <p>Comprehensive warranty packages and aftercare support for complete confidence in your purchase.</p>
                        </div>
                    </div>
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
            <section className="about__location section">
                <div className="container">
                    <h2 className="section-title">Our Location</h2>
                    <div className="about__location-content">
                        <div className="about__location-info">
                            <h3>VANCAR AUTOS LIMITED</h3>
                            <p><strong>Registration No:</strong> 16593644</p>
                            <p>14 MIDLAND STREET<br />MANCHESTER<br />M12 6LB</p>

                            <a href="/contact" className="btn btn--primary">Get Directions</a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
