import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CarCard.css';

export default function CarCard({ car }) {
    const [isSaved, setIsSaved] = useState(false);
    const [isCompared, setIsCompared] = useState(false);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    
    // Quick Enquiry Form State
    const [enquiry, setEnquiry] = useState({ name: '', phone: '', email: '' });
    const [enquirySuccess, setEnquirySuccess] = useState(false);

    // Sync saved and compared states from localStorage
    const syncStates = () => {
        try {
            const saved = localStorage.getItem('vancar_favorites');
            if (saved) {
                const arr = JSON.parse(saved);
                setIsSaved(arr.includes(car.id));
            } else {
                setIsSaved(false);
            }

            const compared = localStorage.getItem('vancar_compare');
            if (compared) {
                const arr = JSON.parse(compared);
                setIsCompared(arr.includes(car.id));
            } else {
                setIsCompared(false);
            }
        } catch (e) {
            setIsSaved(false);
            setIsCompared(false);
        }
    };

    useEffect(() => {
        syncStates();
        window.addEventListener('vancar_compare_changed', syncStates);
        return () => window.removeEventListener('vancar_compare_changed', syncStates);
    }, [car.id]);

    const toggleSave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const saved = localStorage.getItem('vancar_favorites');
            let arr = saved ? JSON.parse(saved) : [];
            if (arr.includes(car.id)) {
                arr = arr.filter(id => id !== car.id);
                setIsSaved(false);
            } else {
                arr.push(car.id);
                setIsSaved(true);
            }
            localStorage.setItem('vancar_favorites', JSON.stringify(arr));
        } catch (err) {
            console.error(err);
        }
    };

    const toggleCompare = (e) => {
        e.stopPropagation();
        try {
            const compared = localStorage.getItem('vancar_compare');
            let arr = compared ? JSON.parse(compared) : [];
            if (arr.includes(car.id)) {
                arr = arr.filter(id => id !== car.id);
                setIsCompared(false);
            } else {
                if (arr.length >= 3) {
                    alert('You can compare up to 3 vehicles at a time.');
                    return;
                }
                arr.push(car.id);
                setIsCompared(true);
            }
            localStorage.setItem('vancar_compare', JSON.stringify(arr));
            window.dispatchEvent(new Event('vancar_compare_changed'));
        } catch (err) {
            console.error(err);
        }
    };

    const handleQuickView = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsQuickViewOpen(true);
    };

    const handleEnquirySubmit = (e) => {
        e.preventDefault();
        setTimeout(() => {
            setEnquirySuccess(true);
            setEnquiry({ name: '', phone: '', email: '' });
        }, 600);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const formatMileage = (miles) => {
        return new Intl.NumberFormat('en-GB').format(miles);
    };

    const isLowMileage = car.mileage < 15000;

    return (
        <>
            <div className="car-card flex flex-col h-full bg-white border border-slate-100 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl relative">
                <Link to={`/buy/${car.id}`} className="flex flex-col h-full">
                    {/* Image Showcase & Overlays */}
                    <div className="car-card__image-wrap relative w-full pt-[56.25%] overflow-hidden bg-slate-50">
                        <img
                            src={car.images?.[0] || '/images/car-sedan.png'}
                            alt={car.title}
                            className="car-card__image absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            loading="lazy"
                        />
                        
                        {/* Status Badges */}
                        <div className="car-card__badges-container absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                            {car.status === 'sold' ? (
                                <span className="car-badge car-badge--sold">Sold</span>
                            ) : (
                                <>
                                    {car.featured && <span className="car-badge car-badge--featured">Featured</span>}
                                    {isLowMileage && <span className="car-badge car-badge--low-mileage">Low Mileage</span>}
                                </>
                            )}
                        </div>

                        {/* Favorite Save Button */}
                        <button 
                            className={`car-card__favorite-btn ${isSaved ? 'car-card__favorite-btn--active' : ''}`}
                            onClick={toggleSave}
                            aria-label={isSaved ? "Remove from saved cars" : "Save car"}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        </button>

                        {/* Quick View Button (Desktop Overlay) */}
                        <button 
                            className="car-card__quick-view-btn"
                            onClick={handleQuickView}
                        >
                            Quick View
                        </button>
                    </div>

                    {/* Card Content Body */}
                    <div className="car-card__body p-5 flex flex-col flex-1">
                        {/* Title & Trim */}
                        <div className="car-card__header mb-4">
                            <h3 className="car-card__title text-lg font-bold text-slate-900 leading-tight mb-1">
                                {car.year} {car.make} {car.model}
                            </h3>
                            <p className="car-card__trim text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {car.trim}
                            </p>
                        </div>

                        {/* Specifications Badges Row */}
                        <div className="car-card__specs-row flex flex-wrap gap-2 mb-5">
                            <span className="spec-tag">{formatMileage(car.mileage)} mi</span>
                            <span className="spec-tag">{car.transmission}</span>
                            <span className="spec-tag">{car.fuel}</span>
                        </div>

                        {/* Divider Line */}
                        <div className="w-full h-[1px] bg-slate-100 mb-4"></div>

                        {/* Pricing Box */}
                        <div className="car-card__pricing flex items-end justify-between mt-auto mb-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cash Price</span>
                                <span className="car-card__price text-2xl font-extrabold text-slate-900 leading-none">
                                    {formatPrice(car.price)}
                                </span>
                            </div>
                            {car.status !== 'sold' && (
                                <div className="car-card__value-badge text-right flex flex-col justify-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Guarantee</span>
                                    <span className="text-[var(--color-accent)] font-bold text-xs flex items-center gap-1 justify-end mt-1">
                                        🛡️ 12M Warranty
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Interactive Footer */}
                        <div className="car-card__footer flex items-center justify-between border-t border-slate-100 pt-4" onClick={e => e.stopPropagation()}>
                            {/* Compare Checkbox */}
                            <label className="car-card__compare-label flex items-center gap-2 cursor-pointer select-none">
                                <input 
                                    type="checkbox" 
                                    checked={isCompared} 
                                    onChange={toggleCompare} 
                                    className="car-card__compare-checkbox w-4 h-4 rounded border-slate-300 text-[var(--color-accent)] focus:ring-[var(--color-accent-secondary)]"
                                />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Compare</span>
                            </label>
                            
                            <span className="car-card__cta text-xs font-bold uppercase text-[var(--color-accent)] tracking-wider flex items-center gap-1 hover:text-[var(--color-accent-secondary)] transition-colors">
                                View Details &rsaquo;
                            </span>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Quick View Modal */}
            {isQuickViewOpen && (
                <div className="quick-view-modal">
                    <div className="quick-view-modal__backdrop" onClick={() => setIsQuickViewOpen(false)}></div>
                    <div className="quick-view-modal__content animate-slide-up shadow-xl">
                        <button 
                            className="quick-view-modal__close"
                            onClick={() => setIsQuickViewOpen(false)}
                            aria-label="Close quick view"
                        >
                            &times;
                        </button>
                        
                        <div className="quick-view-modal__body">
                            {/* Left: Gallery Showcase */}
                            <div className="quick-view-modal__gallery">
                                <img 
                                    src={car.images?.[0] || '/images/car-sedan.png'} 
                                    alt={car.title} 
                                    className="quick-view-modal__main-img" 
                                />
                                <div className="quick-view-modal__gallery-thumbs">
                                    {car.images?.slice(0, 3).map((img, index) => (
                                        <img key={index} src={img} alt={`Thumb ${index + 1}`} className="quick-view-modal__thumb" />
                                    )) || <img src="/images/car-sedan.png" alt="Thumb" className="quick-view-modal__thumb" />}
                                </div>
                            </div>

                            {/* Right: Info & Contact Form */}
                            <div className="quick-view-modal__info text-left">
                                <span className="quick-view-modal__year-tag">{car.year}</span>
                                <h2 className="quick-view-modal__title">{car.make} {car.model}</h2>
                                <p className="quick-view-modal__trim text-slate-500 font-medium mb-4">{car.trim}</p>
                                
                                <div className="quick-view-modal__pricing mb-6">
                                    <span className="quick-view-modal__price">{formatPrice(car.price)}</span>
                                    {car.status !== 'sold' && (
                                        <span className="quick-view-modal__monthly">
                                            Includes <strong>12-Month Warranty</strong> & 150-Point Inspection
                                        </span>
                                    )}
                                </div>

                                <div className="quick-view-modal__specs-grid mb-6">
                                    <div><strong>Mileage:</strong> {formatMileage(car.mileage)} miles</div>
                                    <div><strong>Fuel:</strong> {car.fuel}</div>
                                    <div><strong>Transmission:</strong> {car.transmission}</div>
                                    <div><strong>Colour:</strong> {car.colour}</div>
                                </div>

                                {/* Quick Contact Lead Form */}
                                <div className="quick-view-modal__enquiry border-t border-slate-100 pt-6">
                                    <h4 className="font-bold text-slate-800 mb-2">Enquire About This Vehicle</h4>
                                    {enquirySuccess ? (
                                        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm mb-4">
                                            Thank you! Our sales and support team will contact you shortly.
                                        </div>
                                    ) : (
                                        <form onSubmit={handleEnquirySubmit} className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <input 
                                                    type="text" 
                                                    placeholder="Your Name" 
                                                    required 
                                                    className="form-input quick-view-modal__input" 
                                                    value={enquiry.name} 
                                                    onChange={e => setEnquiry(prev => ({...prev, name: e.target.value}))}
                                                />
                                                <input 
                                                    type="tel" 
                                                    placeholder="Phone Number" 
                                                    required 
                                                    className="form-input quick-view-modal__input" 
                                                    value={enquiry.phone} 
                                                    onChange={e => setEnquiry(prev => ({...prev, phone: e.target.value}))}
                                                />
                                            </div>
                                            <input 
                                                type="email" 
                                                placeholder="Email Address" 
                                                required 
                                                className="form-input quick-view-modal__input" 
                                                value={enquiry.email} 
                                                onChange={e => setEnquiry(prev => ({...prev, email: e.target.value}))}
                                            />
                                            <button type="submit" className="btn btn--primary w-full text-center py-2 text-sm">
                                                Enquire Now
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
