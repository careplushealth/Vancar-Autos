import { useEffect, useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import './KarmaHero.css';

// Lazy-load the Three.js canvas showroom to keep the main bundle light and optimize performance
const ThreeShowroom = lazy(() => import('./ThreeShowroom'));

export default function KarmaHero() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Fade-in animation trigger
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="karma-hero" aria-label="Premium Dealership Showcase">
      <div className="container">
        <div className="karma-hero__grid">
          {/* Left Column: Spacious Conversion-Focused Text Content */}
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

          {/* Right Column: Code-Split 3D Canvas Showcase */}
          <Suspense fallback={
            <div className="karma-hero__visual flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
            </div>
          }>
            <ThreeShowroom />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
