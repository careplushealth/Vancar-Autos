import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import CarCard from '../../components/CarCard/CarCard';
import FilterPills from '../../components/FilterPills/FilterPills';
import Dropdown from '../../components/Dropdown/Dropdown';
import Modal from '../../components/Modal/Modal';
import { searchCars, getMakes } from '../../services/dataService';
import './Buy.css';

const BODY_TYPES = ['All', 'SUV', 'Saloon', 'Hatchback', 'Estate', 'Sport', 'Van'];
const FUEL_TYPES = ['All', 'Petrol', 'Diesel', 'Electric', 'Hybrid'];
const SORT_OPTIONS = [
    { value: '', label: 'Relevance' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'newest', label: 'Year: Newest First' },
    { value: 'mileage', label: 'Mileage: Lowest First' },
];

export default function Buy() {
    const [searchParams] = useSearchParams();
    const initialBodyType = searchParams.get('bodyType') || 'All';

    const [filters, setFilters] = useState({
        bodyType: initialBodyType,
        fuel: 'All',
        transmission: 'All',
        sort: '',
        search: '',
        make: '',
    });
    const [showFilters, setShowFilters] = useState(false);

    const makes = useMemo(() => getMakes(), []);

    const cars = useMemo(() => searchCars(filters), [filters]);

    const updateFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="buy">
            <div className="container">
                <div className="buy__header">
                    <div className="buy__header-left">
                        <h1 className="buy__title">Used cars</h1>
                        <span className="buy__count">{cars.length} cars found</span>
                    </div>
                    <div className="buy__header-right">
                        <div className="buy__search">
                            <input
                                type="text"
                                className="form-input buy__search-input"
                                placeholder="Search make, model..."
                                value={filters.search}
                                onChange={e => updateFilter('search', e.target.value)}
                            />
                        </div>
                        <Dropdown
                            label="Sort by"
                            value={filters.sort}
                            onChange={v => updateFilter('sort', v)}
                            options={SORT_OPTIONS}
                        />
                        <button className="btn btn--outline buy__filter-toggle" onClick={() => setShowFilters(true)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /></svg>
                            Filters
                        </button>
                    </div>
                </div>

                <div className="buy__pills">
                    <FilterPills
                        options={BODY_TYPES}
                        selected={filters.bodyType}
                        onChange={v => updateFilter('bodyType', v)}
                    />
                </div>

                <div className="buy__layout">
                    {/* Desktop Sidebar Filters */}
                    <aside className="buy__sidebar">
                        <div className="buy__filter-group">
                            <h4 className="buy__filter-heading">Make</h4>
                            <select className="form-select" value={filters.make} onChange={e => updateFilter('make', e.target.value)}>
                                <option value="">All Makes</option>
                                {makes.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        <div className="buy__filter-group">
                            <h4 className="buy__filter-heading">Fuel Type</h4>
                            <div className="buy__filter-options">
                                {FUEL_TYPES.map(f => (
                                    <button
                                        key={f}
                                        className={`buy__filter-chip ${filters.fuel === f ? 'buy__filter-chip--active' : ''}`}
                                        onClick={() => updateFilter('fuel', f)}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="buy__filter-group">
                            <h4 className="buy__filter-heading">Transmission</h4>
                            <div className="buy__filter-options">
                                {['All', 'Automatic', 'Manual'].map(t => (
                                    <button
                                        key={t}
                                        className={`buy__filter-chip ${filters.transmission === t ? 'buy__filter-chip--active' : ''}`}
                                        onClick={() => updateFilter('transmission', t)}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            className="btn btn--outline"
                            style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
                            onClick={() => setFilters({ bodyType: 'All', fuel: 'All', transmission: 'All', sort: '', search: '', make: '' })}
                        >
                            Clear All Filters
                        </button>
                    </aside>

                    {/* Car Grid */}
                    <div className="buy__grid">
                        {cars.length > 0 ? (
                            cars.map(car => <CarCard key={car.id} car={car} />)
                        ) : (
                            <div className="buy__empty">
                                <h3>No cars found</h3>
                                <p>Try adjusting your filters to see more results.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Modal */}
            <Modal isOpen={showFilters} onClose={() => setShowFilters(false)} title="Filters">
                <div className="buy__modal-filters">
                    <div className="buy__filter-group">
                        <h4 className="buy__filter-heading">Body Type</h4>
                        <div className="buy__filter-options">
                            {BODY_TYPES.map(b => (
                                <button key={b} className={`buy__filter-chip ${filters.bodyType === b ? 'buy__filter-chip--active' : ''}`} onClick={() => updateFilter('bodyType', b)}>{b}</button>
                            ))}
                        </div>
                    </div>
                    <div className="buy__filter-group">
                        <h4 className="buy__filter-heading">Make</h4>
                        <select className="form-select" value={filters.make} onChange={e => updateFilter('make', e.target.value)}>
                            <option value="">All Makes</option>
                            {makes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="buy__filter-group">
                        <h4 className="buy__filter-heading">Fuel Type</h4>
                        <div className="buy__filter-options">
                            {FUEL_TYPES.map(f => (
                                <button key={f} className={`buy__filter-chip ${filters.fuel === f ? 'buy__filter-chip--active' : ''}`} onClick={() => updateFilter('fuel', f)}>{f}</button>
                            ))}
                        </div>
                    </div>
                    <div className="buy__filter-group">
                        <h4 className="buy__filter-heading">Transmission</h4>
                        <div className="buy__filter-options">
                            {['All', 'Automatic', 'Manual'].map(t => (
                                <button key={t} className={`buy__filter-chip ${filters.transmission === t ? 'buy__filter-chip--active' : ''}`} onClick={() => updateFilter('transmission', t)}>{t}</button>
                            ))}
                        </div>
                    </div>
                    <button className="btn btn--primary" style={{ width: '100%', marginTop: 'var(--spacing-lg)' }} onClick={() => setShowFilters(false)}>
                        Show {cars.length} Results
                    </button>
                </div>
            </Modal>
        </div>
    );
}
