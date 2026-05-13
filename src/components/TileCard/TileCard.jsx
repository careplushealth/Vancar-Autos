import { Link } from 'react-router-dom';
import './TileCard.css';

export default function TileCard({ image, title, subtitle, link, size = 'default', overlay = true }) {
    return (
        <Link to={link || '#'} className={`tile-card tile-card--${size}`}>
            <div className="tile-card__image-wrap">
                <img src={image} alt={title} className="tile-card__image" loading="lazy" />
                {overlay && <div className="tile-card__overlay" />}
            </div>
            <div className="tile-card__content">
                <h3 className="tile-card__title">{title}</h3>
                {subtitle && <p className="tile-card__subtitle">{subtitle}</p>}
                <span className="tile-card__link">Discover more ›</span>
            </div>
        </Link>
    );
}
