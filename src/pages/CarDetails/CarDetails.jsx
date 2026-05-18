import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import CarCard from '../../components/CarCard/CarCard';
import { getCarById, getSimilarCars } from '../../services/dataService';
import './CarDetails.css';

export default function CarDetails() {
    const { id } = useParams();
    const car = useMemo(() => getCarById(id), [id]);
    const similar = useMemo(() => getSimilarCars(id, 3), [id]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);

    // Lock page scrolling when lightbox is active
    useEffect(() => {
        if (isZoomed) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isZoomed]);

    const galleryImages = useMemo(() => {
        if (!car) return [];
        return car.images && car.images.length > 0 ? car.images : ['/images/car-sedan.png'];
    }, [car]);

    const handlePrev = () => {
        setActiveIdx((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setActiveIdx((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
    };

    if (!car) {
        return (
            <div className="car-details container">
                <div className="car-details__not-found">
                    <h2>Car not found</h2>
                    <p>The vehicle you're looking for is no longer available.</p>
                    <Link to="/buy" className="btn btn--primary">Browse all cars</Link>
                </div>
            </div>
        );
    }

    const formatPrice = (price) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(price);
    const formatMileage = (m) => new Intl.NumberFormat('en-GB').format(m);

    const monthlyPayment = Math.round(car.price / 48);

    return (
        <div className="car-details">
            {/* Interactive Image Gallery */}
            <div className="car-details__hero">
                <img 
                    src={galleryImages[activeIdx]} 
                    alt={`${car.title} - View ${activeIdx + 1}`} 
                    className="car-details__hero-img animate-fade-in car-details__hero-img--zoomable" 
                    key={activeIdx}
                    onClick={() => setIsZoomed(true)}
                />
                
                {/* Arrow Navigation */}
                <button 
                    onClick={handlePrev} 
                    className="car-details__nav-btn car-details__nav-btn--prev"
                    aria-label="Previous image"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <button 
                    onClick={handleNext} 
                    className="car-details__nav-btn car-details__nav-btn--next"
                    aria-label="Next image"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>

                {/* Click to Zoom Indicator Tag */}
                <button 
                    onClick={() => setIsZoomed(true)} 
                    className="car-details__zoom-indicator-btn"
                    aria-label="Zoom image"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="11" y1="8" x2="11" y2="14" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                    <span>Click to Zoom</span>
                </button>

                {/* Thumbnails Tray Overlay */}
                <div className="car-details__thumbnails">
                    {galleryImages.map((img, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveIdx(index)}
                            className={`car-details__thumb-btn ${index === activeIdx ? 'car-details__thumb-btn--active' : ''}`}
                            aria-label={`View image ${index + 1}`}
                        >
                            <img src={img} alt="Thumbnail view" className="car-details__thumb-img" />
                        </button>
                    ))}
                </div>

                <div className="car-details__hero-overlay" />
            </div>

            <div className="container">
                {/* Breadcrumb */}
                <nav className="car-details__breadcrumb">
                    <Link to="/">Home</Link> <span>›</span>
                    <Link to="/buy">Used Cars</Link> <span>›</span>
                    <span>{car.make} {car.model}</span>
                </nav>

                <div className="car-details__layout">
                    {/* Main Content */}
                    <div className="car-details__main">
                        <h1 className="car-details__title">{car.title}</h1>
                        <p className="car-details__subtitle">{car.trim}</p>

                        <div className="car-details__price-row">
                            <span className="car-details__price">{formatPrice(car.price)}</span>
                            <span className="car-details__monthly">From ~{formatPrice(monthlyPayment)}/mo (PCP est.)</span>
                        </div>

                        {/* Specs Grid */}
                        <div className="car-details__specs">
                            <div className="car-details__spec-card">
                                <span className="car-details__spec-label">Year</span>
                                <span className="car-details__spec-value">{car.year}</span>
                            </div>
                            <div className="car-details__spec-card">
                                <span className="car-details__spec-label">Mileage</span>
                                <span className="car-details__spec-value">{formatMileage(car.mileage)} mi</span>
                            </div>
                            <div className="car-details__spec-card">
                                <span className="car-details__spec-label">Fuel</span>
                                <span className="car-details__spec-value">{car.fuel}</span>
                            </div>
                            <div className="car-details__spec-card">
                                <span className="car-details__spec-label">Transmission</span>
                                <span className="car-details__spec-value">{car.transmission}</span>
                            </div>
                            <div className="car-details__spec-card">
                                <span className="car-details__spec-label">Engine</span>
                                <span className="car-details__spec-value">{car.engine}</span>
                            </div>
                            <div className="car-details__spec-card">
                                <span className="car-details__spec-label">Body Type</span>
                                <span className="car-details__spec-value">{car.bodyType}</span>
                            </div>
                            <div className="car-details__spec-card">
                                <span className="car-details__spec-label">Colour</span>
                                <span className="car-details__spec-value">{car.colour}</span>
                            </div>
                            <div className="car-details__spec-card">
                                <span className="car-details__spec-label">Doors</span>
                                <span className="car-details__spec-value">{car.doors}</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="car-details__description">
                            <h3>Description</h3>
                            <p>{car.description}</p>
                        </div>

                        {/* Features */}
                        {car.features?.length > 0 && (
                            <div className="car-details__features">
                                <h3>Key Features</h3>
                                <div className="car-details__features-grid">
                                    {car.features.map(f => (
                                        <span key={f} className="car-details__feature-tag">✓ {f}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Actions */}
                    <aside className="car-details__sidebar">
                        <div className="car-details__action-card">
                            <h3>Interested?</h3>
                            <p>Get in touch with our team about this vehicle.</p>
                            <div className="car-details__action-buttons">
                                <Link to="/contact" className="btn btn--primary" style={{ width: '100%' }}>Enquire Now</Link>
                                <Link to="/contact" className="btn btn--outline" style={{ width: '100%' }}>Reserve This Car</Link>
                                <a href="tel:01onal" className="btn btn--secondary" style={{ width: '100%' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                    Call Us
                                </a>
                            </div>
                        </div>

                        <div className="car-details__finance-card">
                            <h4>Finance Estimate</h4>
                            <div className="car-details__finance-detail">
                                <span>Monthly from</span>
                                <strong>{formatPrice(monthlyPayment)}/mo</strong>
                            </div>
                            <div className="car-details__finance-detail">
                                <span>Deposit (10%)</span>
                                <strong>{formatPrice(Math.round(car.price * 0.1))}</strong>
                            </div>
                            <div className="car-details__finance-detail">
                                <span>Term</span>
                                <strong>48 months</strong>
                            </div>
                            <small className="car-details__finance-disclaimer">
                                Representative example. Subject to status. T&Cs apply.
                            </small>
                        </div>
                    </aside>
                </div>

                {/* Similar Cars */}
                {similar.length > 0 && (
                    <div className="car-details__similar section">
                        <h2 className="car-details__similar-title">Similar vehicles</h2>
                        <div className="car-details__similar-grid">
                            {similar.map(c => <CarCard key={c.id} car={c} />)}
                        </div>
                    </div>
                )}
            </div>

            {/* Fullscreen Lightbox Modal */}
            {isZoomed && (
                <div 
                    className="car-details__lightbox"
                    onClick={() => setIsZoomed(false)}
                >
                    {/* Lightbox Header Close button */}
                    <button 
                        className="car-details__lightbox-close"
                        onClick={() => setIsZoomed(false)}
                        aria-label="Close Zoom"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>

                    {/* Lightbox navigation buttons */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); handlePrev(); }} 
                        className="car-details__lightbox-nav car-details__lightbox-nav--prev"
                        aria-label="Previous image"
                    >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleNext(); }} 
                        className="car-details__lightbox-nav car-details__lightbox-nav--next"
                        aria-label="Next image"
                    >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>

                    {/* Active Image Content */}
                    <div className="car-details__lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={galleryImages[activeIdx]} 
                            alt={`${car.title} - Zoomed View ${activeIdx + 1}`} 
                            className="car-details__lightbox-img animate-scale-up" 
                            key={activeIdx}
                        />
                        
                        {/* Lightbox caption */}
                        <div className="car-details__lightbox-caption">
                            <span>{car.title}</span>
                            <span className="opacity-60">{activeIdx + 1} / {galleryImages.length}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
