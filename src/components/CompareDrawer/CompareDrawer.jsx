import { useState, useEffect } from 'react';
import { getCarById } from '../../services/dataService';
import './CompareDrawer.css';

export default function CompareDrawer() {
    const [compareIds, setCompareIds] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    // Sync compare list from localStorage
    const syncCompareList = () => {
        try {
            const stored = localStorage.getItem('vancar_compare');
            if (stored) {
                setCompareIds(JSON.parse(stored));
            } else {
                setCompareIds([]);
            }
        } catch (e) {
            setCompareIds([]);
        }
    };

    useEffect(() => {
        syncCompareList();
        // Listen for updates from CarCards
        window.addEventListener('vancar_compare_changed', syncCompareList);
        return () => window.removeEventListener('vancar_compare_changed', syncCompareList);
    }, []);

    const handleRemove = (id) => {
        const updated = compareIds.filter(cid => cid !== id);
        localStorage.setItem('vancar_compare', JSON.stringify(updated));
        setCompareIds(updated);
        // Notify other cards to uncheck
        window.dispatchEvent(new Event('vancar_compare_changed'));
    };

    const handleClear = () => {
        localStorage.removeItem('vancar_compare');
        setCompareIds([]);
        window.dispatchEvent(new Event('vancar_compare_changed'));
    };

    const comparedCars = compareIds.map(id => getCarById(id)).filter(Boolean);

    if (compareIds.length === 0) return null;

    const formatPrice = (p) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(p);

    // Collect all unique features from the compared cars
    const allFeatures = Array.from(
        new Set(comparedCars.flatMap(car => car.features || []))
    );

    return (
        <>
            {/* Sticky Bottom Bar */}
            <div className="compare-drawer animate-slide-up shadow-xl">
                <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <span className="compare-drawer__badge">{compareIds.length}</span>
                        <div>
                            <h4 className="compare-drawer__title">Compare Vehicles</h4>
                            <p className="compare-drawer__subtitle">Select up to 3 cars to compare specifications</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 overflow-x-auto py-1 max-w-full">
                        {comparedCars.map(car => (
                            <div key={car.id} className="compare-drawer__thumbnail">
                                <img src={car.images?.[0] || '/images/car-sedan.png'} alt={car.title} />
                                <span className="compare-drawer__thumbnail-title">{car.make} {car.model}</span>
                                <button 
                                    onClick={() => handleRemove(car.id)}
                                    className="compare-drawer__thumbnail-remove"
                                    aria-label="Remove vehicle"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleClear}
                            className="btn btn--outline btn--sm"
                        >
                            Clear All
                        </button>
                        <button 
                            onClick={() => setIsOpen(true)}
                            className="btn btn--primary btn--sm shadow-sm"
                            disabled={compareIds.length < 2}
                            title={compareIds.length < 2 ? "Select at least 2 cars" : ""}
                        >
                            Compare Now
                        </button>
                    </div>
                </div>
            </div>

            {/* Comparison Modal Overlay */}
            {isOpen && (
                <div className="compare-modal">
                    <div className="compare-modal__backdrop" onClick={() => setIsOpen(false)}></div>
                    <div className="compare-modal__content animate-slide-up">
                        <div className="compare-modal__header">
                            <h2 className="compare-modal__title">Vehicle Comparison</h2>
                            <button 
                                className="compare-modal__close" 
                                onClick={() => setIsOpen(false)}
                                aria-label="Close modal"
                            >
                                &times;
                            </button>
                        </div>
                        
                        <div className="compare-modal__body">
                            <div className="compare-modal__table-wrapper">
                                <table className="compare-modal__table">
                                    <thead>
                                        <tr>
                                            <th>Specification</th>
                                            {comparedCars.map(car => (
                                                <th key={car.id} className="compare-modal__th-car">
                                                    <div className="compare-modal__car-card text-left">
                                                        <img 
                                                            src={car.images?.[0] || '/images/car-sedan.png'} 
                                                            alt={car.title} 
                                                            className="compare-modal__car-img" 
                                                        />
                                                        <h3 className="compare-modal__car-name">{car.year} {car.make} {car.model}</h3>
                                                        <span className="compare-modal__car-price">{formatPrice(car.price)}</span>
                                                        <div className="mt-4">
                                                            <a href={`/buy/${car.id}`} className="btn btn--primary btn--sm w-full text-center">
                                                                View Details
                                                            </a>
                                                        </div>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>Year</strong></td>
                                            {comparedCars.map(car => <td key={car.id}>{car.year}</td>)}
                                        </tr>
                                        <tr>
                                            <td><strong>Price</strong></td>
                                            {comparedCars.map(car => <td key={car.id}>{formatPrice(car.price)}</td>)}
                                        </tr>
                                        <tr>
                                            <td><strong>Mileage</strong></td>
                                            {comparedCars.map(car => <td key={car.id}>{new Intl.NumberFormat('en-GB').format(car.mileage)} miles</td>)}
                                        </tr>
                                        <tr>
                                            <td><strong>Fuel Type</strong></td>
                                            {comparedCars.map(car => <td key={car.id}>{car.fuel}</td>)}
                                        </tr>
                                        <tr>
                                            <td><strong>Transmission</strong></td>
                                            {comparedCars.map(car => <td key={car.id}>{car.transmission}</td>)}
                                        </tr>
                                        <tr>
                                            <td><strong>Colour</strong></td>
                                            {comparedCars.map(car => <td key={car.id}>{car.colour}</td>)}
                                        </tr>
                                        <tr>
                                            <td><strong>Engine</strong></td>
                                            {comparedCars.map(car => <td key={car.id}>{car.engine || 'N/A'}</td>)}
                                        </tr>
                                        <tr>
                                            <td><strong>Doors</strong></td>
                                            {comparedCars.map(car => <td key={car.id}>{car.doors} Doors</td>)}
                                        </tr>
                                        <tr>
                                            <td><strong>Seats</strong></td>
                                            {comparedCars.map(car => <td key={car.id}>{car.seats} Seats</td>)}
                                        </tr>
                                        <tr>
                                            <td><strong>Features</strong></td>
                                            {comparedCars.map(car => (
                                                <td key={car.id}>
                                                    <ul className="compare-modal__features-list">
                                                        {car.features?.map((f, idx) => (
                                                            <li key={idx}>✓ {f}</li>
                                                        ))}
                                                    </ul>
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
