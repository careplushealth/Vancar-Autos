import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getCarStats, getBlogs, getCars } from '../../../services/dataService';
import './Dashboard.css';

export default function Dashboard() {
    const stats = useMemo(() => getCarStats(), []);
    const blogs = useMemo(() => getBlogs(), []);
    const allCars = useMemo(() => getCars(), []);

    // Active category for viewing cars on dashboard: 'all' | 'unsold' | 'sold' | null
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const handleCategoryClick = (category) => {
        setSelectedCategory(prev => prev === category ? null : category);
        setSearchQuery('');
    };

    const displayedCars = useMemo(() => {
        if (!selectedCategory) return [];
        let list = allCars;
        if (selectedCategory === 'unsold') {
            list = list.filter(c => c.status === 'available');
        } else if (selectedCategory === 'sold') {
            list = list.filter(c => c.status === 'sold');
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(c => {
                const titleStr = `${c.year || ''} ${c.make || ''} ${c.model || ''} ${c.trim || ''} ${c.registration || ''}`.toLowerCase();
                return titleStr.includes(q);
            });
        }
        return list;
    }, [allCars, selectedCategory, searchQuery]);

    const getCategoryTitle = () => {
        switch (selectedCategory) {
            case 'all': return 'All Cars';
            case 'unsold': return 'Unsold Cars (Available)';
            case 'sold': return 'Sold Cars';
            default: return 'Cars';
        }
    };

    return (
        <div className="admin-dashboard">
            <h1 className="admin-dashboard__title">Dashboard</h1>

            {/* Clickable Stat Summary Cards */}
            <div className="admin-dashboard__stats">
                <div 
                    className={`admin-dashboard__stat-card admin-dashboard__stat-card--clickable ${selectedCategory === 'all' ? 'admin-dashboard__stat-card--active' : ''}`}
                    onClick={() => handleCategoryClick('all')}
                    title="Click to view all cars"
                >
                    <span className="admin-dashboard__stat-number">{stats.total}</span>
                    <span className="admin-dashboard__stat-label">All Cars</span>
                    {selectedCategory === 'all' && (
                        <span className="admin-dashboard__stat-active-badge">● Viewing</span>
                    )}
                </div>
                <div 
                    className={`admin-dashboard__stat-card admin-dashboard__stat-card--clickable ${selectedCategory === 'unsold' ? 'admin-dashboard__stat-card--active' : ''}`}
                    onClick={() => handleCategoryClick('unsold')}
                    title="Click to view unsold available cars"
                >
                    <span className="admin-dashboard__stat-number">{stats.available}</span>
                    <span className="admin-dashboard__stat-label">Unsold Cars</span>
                    {selectedCategory === 'unsold' && (
                        <span className="admin-dashboard__stat-active-badge">● Viewing</span>
                    )}
                </div>
                <div 
                    className={`admin-dashboard__stat-card admin-dashboard__stat-card--clickable ${selectedCategory === 'sold' ? 'admin-dashboard__stat-card--active' : ''}`}
                    onClick={() => handleCategoryClick('sold')}
                    title="Click to view sold cars"
                >
                    <span className="admin-dashboard__stat-number">{stats.sold}</span>
                    <span className="admin-dashboard__stat-label">Sold Cars</span>
                    {selectedCategory === 'sold' && (
                        <span className="admin-dashboard__stat-active-badge">● Viewing</span>
                    )}
                </div>
                <div className="admin-dashboard__stat-card">
                    <span className="admin-dashboard__stat-number">{blogs.length}</span>
                    <span className="admin-dashboard__stat-label">Blog Posts</span>
                </div>
            </div>

            {/* Cars List Section for Clicked Box */}
            {selectedCategory && (
                <div className="admin-dashboard__cars-section">
                    <div className="admin-dashboard__cars-header">
                        <div>
                            <h2>
                                <span>🚗</span>
                                <span>{getCategoryTitle()}</span>
                                <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 'normal' }}>
                                    ({displayedCars.length} {displayedCars.length === 1 ? 'vehicle' : 'vehicles'})
                                </span>
                            </h2>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                className="admin-dashboard__cars-search"
                                placeholder={`Filter ${selectedCategory} cars...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Link 
                                to={`/admin/cars${selectedCategory === 'sold' ? '?status=sold' : (selectedCategory === 'unsold' ? '?status=available' : '')}`} 
                                className="btn btn--sm btn--outline"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            >
                                Manage in Forecourt →
                            </Link>
                            <button 
                                onClick={() => setSelectedCategory(null)}
                                className="btn btn--sm btn--outline"
                                title="Close cars list"
                                style={{ padding: '0.4rem 0.75rem' }}
                            >
                                ✕ Close
                            </button>
                        </div>
                    </div>

                    <div className="admin-dashboard__cars-table-wrapper">
                        <table className="admin-dashboard__cars-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '70px' }}>Image</th>
                                    <th>Vehicle</th>
                                    <th>Registration</th>
                                    <th>Price</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedCars.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-secondary)' }}>
                                            No {selectedCategory} vehicles found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    displayedCars.map(car => (
                                        <tr key={car.id}>
                                            <td>
                                                <a
                                                    href={`/buy/${car.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="admin-dashboard__car-thumb-btn"
                                                    title={`View live website advert for ${car.year} ${car.make} ${car.model}`}
                                                >
                                                    {car.images && car.images[0] ? (
                                                        <img 
                                                            src={car.images[0]} 
                                                            alt="" 
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                const noPhoto = e.currentTarget.parentElement?.querySelector('.admin-dashboard__no-photo');
                                                                if (noPhoto) noPhoto.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div 
                                                        className="admin-dashboard__no-photo"
                                                        style={{ display: car.images && car.images[0] ? 'none' : 'flex' }}
                                                    >
                                                        No Photo
                                                    </div>
                                                </a>
                                            </td>
                                            <td>
                                                <div>
                                                    <a
                                                        href={`/buy/${car.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="admin-dashboard__car-title-link"
                                                        title="Open live advert page in new tab"
                                                    >
                                                        {car.year} {car.make} {car.model}
                                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.6 }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                                    </a>
                                                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                                        {car.trim || car.bodyType || '—'} &bull; {car.mileage ? `${car.mileage.toLocaleString()} miles` : '0 miles'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ 
                                                    display: 'inline-block',
                                                    background: '#fef08a', 
                                                    color: '#854d0e', 
                                                    border: '1px solid #eab308', 
                                                    padding: '2px 8px', 
                                                    borderRadius: '4px', 
                                                    fontWeight: 'bold', 
                                                    fontSize: '11px', 
                                                    fontFamily: 'monospace' 
                                                }}>
                                                    {car.registration || 'NO REG'}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 'bold' }}>£{car.price?.toLocaleString()}</td>
                                            <td>
                                                <span className={`manage-cars__status manage-cars__status--${car.status}`} style={{
                                                    display: 'inline-block',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    background: car.status === 'sold' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(85, 160, 31, 0.15)',
                                                    color: car.status === 'sold' ? '#a855f7' : '#55A01F',
                                                    border: `1px solid ${car.status === 'sold' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(85, 160, 31, 0.3)'}`
                                                }}>
                                                    {car.status === 'sold' ? 'Sold' : 'Available'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                                    <a
                                                        href={`/buy/${car.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn--sm btn--primary"
                                                        style={{ padding: '0.35rem 0.75rem', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                        title="View live advert in new tab"
                                                    >
                                                        Live Advert ↗
                                                    </a>
                                                    <Link
                                                        to={`/admin/cars/${car.id}/edit`}
                                                        className="btn btn--sm btn--secondary"
                                                        style={{ padding: '0.35rem 0.75rem', fontSize: '12px' }}
                                                    >
                                                        Edit
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="admin-dashboard__quick">
                <h2>Quick Actions</h2>
                <div className="admin-dashboard__actions">
                    <Link to="/admin/cars/new" className="btn btn--primary">+ Add New Car</Link>
                    <Link to="/admin/blogs/new" className="btn btn--outline">+ New Blog Post</Link>
                    <Link to="/admin/cars" className="btn btn--secondary">Manage Inventory</Link>
                </div>
            </div>

            <div className="admin-dashboard__body-types">
                <h2>Inventory by Type</h2>
                <div className="admin-dashboard__type-grid">
                    {stats.bodyTypes.map(bt => (
                        <div key={bt.type} className="admin-dashboard__type-card">
                            <span className="admin-dashboard__type-name">{bt.type}</span>
                            <span className="admin-dashboard__type-count">{bt.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
