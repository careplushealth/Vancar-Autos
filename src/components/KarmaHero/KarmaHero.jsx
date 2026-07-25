import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './KarmaHero.css';

export default function KarmaHero() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="karma-hero" aria-label="Premium Dealership Showcase">
      <div className="container">
        <div className="karma-hero__grid">
          {/* Left Column: Conversion-Focused Text Content */}
          <div
            className={`karma-hero__content transition-all duration-[1000ms] ease-out ${
              animate ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            {/* Badge */}
            <span className="karma-hero__badge">
              Premium Independent Dealership
            </span>

            {/* Large Spacious Headline */}
            <h1 className="karma-hero__title">
              Find Your Perfect Drive.<br />
              <span>Quality Used Cars, Built to Last.</span>
            </h1>

            {/* Value Proposition Paragraph */}
            <p className="karma-hero__desc">
              Explore our curated showroom of reliable, economical, and thoroughly inspected used vehicles. 
              Every car comes with a comprehensive warranty, history guarantee, and nationwide delivery.
            </p>

            {/* CTAs */}
            <div className="karma-hero__actions">
              <Link to="/buy" className="btn btn--primary btn--lg shadow-md">
                Browse Vehicles
              </Link>
              <Link to="/about" className="btn btn--outline btn--lg shadow-md">
                Why Choose Us
              </Link>
            </div>
          </div>

          {/* Right Column: Premium Static Car Showcase */}
          <div
            className={`karma-hero__visual transition-all duration-[1200ms] ease-out ${
              animate ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <div className="karma-hero__image-wrap">
              <img
                src="/hero-car.png"
                alt="Premium vehicle at Vancar Autos"
                className="karma-hero__car-img"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
