import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import TileCard from '../../components/TileCard/TileCard';
import CarCard from '../../components/CarCard/CarCard';
import FilterPills from '../../components/FilterPills/FilterPills';
import { getAvailableCars, getCarStats, getPublishedBlogs } from '../../services/dataService';
import './Home.css';

export default function Home() {
    const [bodyFilter, setBodyFilter] = useState('All');
    const cars = useMemo(() => getAvailableCars(), []);
    const stats = useMemo(() => getCarStats(), []);
    const blogs = useMemo(() => getPublishedBlogs().slice(0, 2), []);

    const bodyTypes = ['All', ...stats.bodyTypes.map(b => b.type)];

    const filteredCars = useMemo(() => {
        if (bodyFilter === 'All') return cars.slice(0, 6);
        return cars.filter(c => c.bodyType === bodyFilter).slice(0, 6);
    }, [cars, bodyFilter]);

    const categoryCards = stats.bodyTypes.map(bt => ({
        type: bt.type,
        count: bt.count,
        image: cars.find(c => c.bodyType === bt.type)?.images?.[0] || '/images/car-sedan.png'
    }));

    return (
        <div className="home">
            {/* Hero Section */}
            <section className="home__hero" style={{ backgroundImage: 'url(/images/hero-banner.jpg)' }}>
                <div className="home__hero-overlay"></div>
                <div className="home__hero-content container">
                    <h1 className="home__hero-title">Stop whatever you're doing.</h1>
                    <p className="home__hero-text">
                        Discover incredible savings on premium used cars at VANCAR AUTOS —
                        quality vehicles, fair prices, and exceptional service. Now's the time.
                    </p>
                    <div className="home__hero-actions">
                        <Link to="/buy" className="btn btn--primary btn--lg">View latest offers</Link>
                        <Link to="/buy" className="btn btn--secondary btn--lg">Search available cars</Link>
                    </div>
                </div>
            </section>

            {/* Available Cars Section */}
            <section className="home__available section">
                <div className="container">
                    <div className="home__available-header">
                        <h2 className="home__available-title">Available cars</h2>
                        <span className="home__available-count">{stats.available} cars</span>
                    </div>

                    <FilterPills
                        options={bodyTypes}
                        selected={bodyFilter}
                        onChange={setBodyFilter}
                    />

                    <div className="home__category-grid">
                        {categoryCards.map(cat => (
                            <Link
                                key={cat.type}
                                to={`/buy?bodyType=${cat.type}`}
                                className="home__category-card"
                            >
                                <div className="home__category-image-wrap">
                                    <img src={cat.image} alt={cat.type} className="home__category-image" />
                                </div>
                                <div className="home__category-info">
                                    <span className="home__category-name">{cat.type}</span>
                                    <span className="home__category-count">{cat.count} available</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Three Tiles Section */}
            <section className="home__tiles section">
                <div className="container">
                    <div className="home__tiles-grid">
                        <TileCard
                            image="/images/car-sedan.png"
                            title="Finance & Offers"
                            link="/buy"
                        />
                        <TileCard
                            image="/images/car-sport.png"
                            title="Buy Used Cars"
                            link="/buy"
                        />
                        <TileCard
                            image="/images/car-hatchback.png"
                            title="Sell Your Car"
                            link="/sell"
                        />
                    </div>
                </div>
            </section>

            {/* Featured Tiles Section */}
            <section className="home__featured section">
                <div className="container">
                    <div className="home__featured-grid">
                        <TileCard
                            image="/images/car-suv.png"
                            title="Premium SUV range now available"
                            subtitle="Explore our collection"
                            link="/buy?bodyType=SUV"
                            size="tall"
                        />
                        <TileCard
                            image="/images/car-estate.png"
                            title="Estate cars for every family"
                            subtitle="Space meets style"
                            link="/buy?bodyType=Estate"
                            size="tall"
                        />
                        <TileCard
                            image="/images/car-sport.png"
                            title="Performance cars that thrill"
                            subtitle="Feel the excitement"
                            link="/buy?bodyType=Sport"
                            size="tall"
                        />
                    </div>
                </div>
            </section>

            {/* Latest News Section */}
            <section className="home__news section">
                <div className="container">
                    <h2 className="section-title">Latest news</h2>
                    <div className="home__news-grid">
                        {blogs.map(blog => (
                            <Link key={blog.id} to={`/blog/${blog.slug}`} className="home__news-card">
                                <div className="home__news-image-wrap">
                                    <img src={blog.coverImage} alt={blog.title} className="home__news-image" />
                                </div>
                                <div className="home__news-content">
                                    <h3 className="home__news-title">{blog.title}</h3>
                                    <p className="home__news-excerpt">{blog.excerpt}</p>
                                    <span className="link-underline">Read more</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
