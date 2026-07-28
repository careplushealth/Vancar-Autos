import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAvailableCars } from '../../services/dataService';
import './KarmaHero.css';

export default function KarmaHero() {
  const [animate, setAnimate] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Get active cars currently in stock (status === 'available')
  const inStockCars = useMemo(() => {
    const cars = getAvailableCars().filter(c => c.images && c.images.length > 0);
    return cars.length > 0 ? cars : getAvailableCars();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Automatic cycle through available vehicles every 4.5 seconds
  useEffect(() => {
    if (inStockCars.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % inStockCars.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [inStockCars.length, isPaused]);

  const currentCar = inStockCars[currentIndex];

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + inStockCars.length) % inStockCars.length);
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % inStockCars.length);
  };

  const formatPrice = (val) => {
    if (!val) return '£0';
    return `£${Number(val).toLocaleString('en-GB')}`;
  };

  const formatMileage = (val) => {
    if (!val) return '0';
    return `${Number(val).toLocaleString('en-GB')}`;
  };

  return (
    <section className="karma-hero" aria-label="Live Stock Showcase">
      <div className="container">
        <div className="karma-hero__grid">
          {/* Left Column: Text Content & Value Proposition */}
          <div
            className={`karma-hero__content transition-all duration-[1000ms] ease-out ${
              animate ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            {/* Badge */}
            <span className="karma-hero__badge">
              Premium Independent Dealership
            </span>

            {/* Headline */}
            <h1 className="karma-hero__title">
              Find Your Perfect Drive.<br />
              <span>Quality Used Cars, Built to Last.</span>
            </h1>

            {/* Value Proposition Paragraph */}
            <p className="karma-hero__desc">
              Explore our curated showroom of reliable, economical, and thoroughly inspected used vehicles. 
              Every car comes with <strong>30 Days Warranty Included</strong> (optional extended warranty available), history audit, and nationwide delivery.
            </p>

            {/* CTAs */}
            <div className="karma-hero__actions">
              <Link to="/buy" className="btn btn--primary btn--lg shadow-md">
                Browse Full Inventory ({inStockCars.length} In Stock)
              </Link>
              <Link to="/about" className="btn btn--outline btn--lg shadow-md">
                Why Choose Us
              </Link>
            </div>
          </div>

          {/* Right Column: Dynamic Live Stock Vehicle Slider */}
          <div
            className={`karma-hero__visual transition-all duration-[1200ms] ease-out ${
              animate ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {currentCar ? (
              <div className="karma-hero__slider-container">
                {/* Entire Card Clickable -> Navigates directly to Vehicle Details Page */}
                <Link to={`/buy/${currentCar.id}`} className="karma-hero__card-link" title={`View details for ${currentCar.title || `${currentCar.make} ${currentCar.model}`}`}>
                  <div className="karma-hero__image-wrap">
                    <img
                      key={currentCar.id}
                      src={currentCar.images?.[0] || '/hero-car.png'}
                      alt={currentCar.title || `${currentCar.make} ${currentCar.model}`}
                      className="karma-hero__car-img animate-fade-in"
                      loading="eager"
                      decoding="async"
                    />

                    {/* Stock Status Badge */}
                    <span className="karma-hero__stock-tag">
                      <span className="karma-hero__pulse-dot"></span> IN STOCK • READY TODAY
                    </span>

                    {/* Vehicle Overlay Specs Card */}
                    <div className="karma-hero__overlay-card">
                      <div className="karma-hero__overlay-header">
                        <div className="karma-hero__overlay-title-group">
                          <span className="karma-hero__overlay-year">{currentCar.year}</span>
                          <h3 className="karma-hero__overlay-title">
                            {currentCar.make} {currentCar.model}
                          </h3>
                        </div>
                        <span className="karma-hero__overlay-price">
                          {formatPrice(currentCar.price)}
                        </span>
                      </div>

                      {currentCar.trim && (
                        <p className="karma-hero__overlay-trim">{currentCar.trim}</p>
                      )}

                      <div className="karma-hero__overlay-specs">
                        <span>🛣️ {formatMileage(currentCar.mileage)} mi</span>
                        <span>⛽ {currentCar.fuel || 'Petrol'}</span>
                        <span>⚙️ {currentCar.transmission || 'Manual'}</span>
                      </div>

                      <div className="karma-hero__overlay-footer">
                        <span className="karma-hero__warranty-pill">
                          🛡️ 30 Days Warranty Included
                        </span>
                        <span className="karma-hero__cta-button">
                          View Vehicle &rsaquo;
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Carousel Controls */}
                {inStockCars.length > 1 && (
                  <>
                    <button
                      className="karma-hero__nav-btn karma-hero__nav-btn--prev"
                      onClick={handlePrev}
                      aria-label="Previous Vehicle"
                    >
                      &#10094;
                    </button>
                    <button
                      className="karma-hero__nav-btn karma-hero__nav-btn--next"
                      onClick={handleNext}
                      aria-label="Next Vehicle"
                    >
                      &#10095;
                    </button>

                    <div className="karma-hero__dots">
                      {inStockCars.map((car, idx) => (
                        <button
                          key={car.id || idx}
                          className={`karma-hero__dot ${idx === currentIndex ? 'karma-hero__dot--active' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCurrentIndex(idx);
                          }}
                          aria-label={`Go to slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="karma-hero__image-wrap">
                <img
                  src="/hero-car.png"
                  alt="Premium vehicle at Vancar Autos"
                  className="karma-hero__car-img"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

