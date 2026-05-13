import { Link } from 'react-router-dom';
import './CarCard.css';

export default function CarCard({ car }) {
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

    return (
        <Link to={`/buy/${car.id}`} className="car-card">
            <div className="car-card__image-wrap">
                <img
                    src={car.images?.[0] || '/images/car-sedan.png'}
                    alt={car.title}
                    className="car-card__image"
                    loading="lazy"
                />
                {car.status === 'sold' && (
                    <span className="car-card__badge car-card__badge--sold">Sold</span>
                )}
                {car.featured && car.status !== 'sold' && (
                    <span className="car-card__badge car-card__badge--featured">Featured</span>
                )}
            </div>

            <div className="car-card__body">
                <div className="car-card__header">
                    <h3 className="car-card__title">{car.year} {car.make} {car.model}</h3>
                    <p className="car-card__trim">{car.trim}</p>
                </div>

                <div className="car-card__specs">
                    <span className="car-card__spec">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20V10M18 20V4M6 20v-4" /></svg>
                        {formatMileage(car.mileage)} miles
                    </span>
                    <span className="car-card__spec">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        {car.fuel}
                    </span>
                    <span className="car-card__spec">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                        {car.transmission}
                    </span>
                </div>

                <div className="car-card__footer">
                    <span className="car-card__price">{formatPrice(car.price)}</span>
                    <span className="car-card__cta">View details ›</span>
                </div>
            </div>
        </Link>
    );
}
