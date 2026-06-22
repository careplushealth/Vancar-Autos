import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CarCard from '../../components/CarCard/CarCard';
import FilterPills from '../../components/FilterPills/FilterPills';
import Dropdown from '../../components/Dropdown/Dropdown';
import Modal from '../../components/Modal/Modal';
import { searchCars, getMakes, getModelsByMake } from '../../services/dataService';
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
    
    // Read search parameters from URL (e.g. from homepage search widget)
    const initialBodyType = searchParams.get('bodyType') || 'All';
    const initialMake = searchParams.get('make') || '';
    const initialModel = searchParams.get('model') || '';
    const initialFuel = searchParams.get('fuel') || 'All';
    const initialTransmission = searchParams.get('transmission') || 'All';
    const initialSearch = searchParams.get('search') || '';
    const initialMaxPrice = searchParams.get('maxPrice') || '';
    const initialMaxMileage = searchParams.get('maxMileage') || '';

    const [filters, setFilters] = useState({
        bodyType: initialBodyType,
        fuel: initialFuel,
        transmission: initialTransmission,
        sort: '',
        search: initialSearch,
        make: initialMake,
        model: initialModel,
        maxPrice: initialMaxPrice,
        maxMileage: initialMaxMileage
    });
    
    const [showFilters, setShowFilters] = useState(false);

    const makes = useMemo(() => getMakes(), []);
    const models = useMemo(() => {
        if (!filters.make) return [];
        return getModelsByMake(filters.make);
    }, [filters.make]);

    // Reset model filter if make changes
    useEffect(() => {
        setFilters(prev => ({ ...prev, model: '' }));
    }, [filters.make]);

    // Fetch initial filtered cars from dataService
    const rawCars = useMemo(() => {
        // Build filters object for searchCars
        const searchFilters = {
            search: filters.search,
            bodyType: filters.bodyType,
            fuel: filters.fuel,
            transmission: filters.transmission,
            make: filters.make,
            sort: filters.sort,
            maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
            maxMileage: filters.maxMileage ? Number(filters.maxMileage) : undefined
        };
        return searchCars(searchFilters);
    }, [filters.search, filters.bodyType, filters.fuel, filters.transmission, filters.make, filters.sort, filters.maxPrice, filters.maxMileage]);

    // Apply secondary filtering (model) on client
    const cars = useMemo(() => {
        let result = rawCars;
        if (filters.model) {
            result = result.filter(c => c.model.toLowerCase() === filters.model.toLowerCase());
        }
        return result;
    }, [rawCars, filters.model]);

    const updateFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleClearAll = () => {
        setFilters({
            bodyType: 'All',
            fuel: 'All',
            transmission: 'All',
            sort: '',
            search: '',
            make: '',
            model: '',
            maxPrice: '',
            maxMileage: ''
        });
    };

    return (
        <div className="buy bg-white min-h-screen">
            <div className="container">
                <div className="buy__header py-8">
                    <div className="buy__header-left">
                        <h1 className="buy__title text-3xl font-extrabold text-slate-900 tracking-tight">Used Vehicles</h1>
                        <span className="buy__count text-sm text-slate-500 font-medium">{cars.length} vehicles found</span>
                    </div>
                    <div className="buy__header-right flex flex-wrap gap-4 items-center mt-6 lg:mt-0">
                        <div className="buy__search relative">
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
                        <button className="btn btn--outline buy__filter-toggle lg:hidden" onClick={() => setShowFilters(true)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /></svg>
                            Filters
                        </button>
                    </div>
                </div>

                <div className="buy__pills mb-8">
                    <FilterPills
                        options={BODY_TYPES}
                        selected={filters.bodyType}
                        onChange={v => updateFilter('bodyType', v)}
                    />
                </div>

                <div className="buy__layout">
                    {/* Desktop Sidebar Filters */}
                    <aside className="buy__sidebar bg-slate-50 p-6 border border-slate-100 rounded-2xl">
                        <div className="buy__filter-group mb-6">
                            <h4 className="buy__filter-heading font-bold text-xs uppercase text-slate-800 mb-2">Make</h4>
                            <select className="form-select" value={filters.make} onChange={e => updateFilter('make', e.target.value)}>
                                <option value="">All Makes</option>
                                {makes.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        {filters.make && (
                            <div className="buy__filter-group mb-6 animate-fade-in">
                                <h4 className="buy__filter-heading font-bold text-xs uppercase text-slate-800 mb-2">Model</h4>
                                <select className="form-select" value={filters.model} onChange={e => updateFilter('model', e.target.value)}>
                                    <option value="">All Models</option>
                                    {models.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        )}

                        <div className="buy__filter-group mb-6">
                            <h4 className="buy__filter-heading font-bold text-xs uppercase text-slate-800 mb-2">Max Price</h4>
                            <select className="form-select" value={filters.maxPrice} onChange={e => updateFilter('maxPrice', e.target.value)}>
                                <option value="">No Max</option>
                                <option value="15000">£15,000</option>
                                <option value="20000">£20,000</option>
                                <option value="30000">£30,000</option>
                                <option value="40000">£40,000</option>
                                <option value="50000">£50,000</option>
                                <option value="75000">£75,000</option>
                                <option value="100000">£100,000</option>
                            </select>
                        </div>

                        <div className="buy__filter-group mb-6">
                            <h4 className="buy__filter-heading font-bold text-xs uppercase text-slate-800 mb-2">Max Mileage</h4>
                            <select className="form-select" value={filters.maxMileage} onChange={e => updateFilter('maxMileage', e.target.value)}>
                                <option value="">No Max</option>
                                <option value="10000">Under 10,000 miles</option>
                                <option value="20000">Under 20,000 miles</option>
                                <option value="30000">Under 30,000 miles</option>
                                <option value="50000">Under 50,000 miles</option>
                            </select>
                        </div>

                        <div className="buy__filter-group mb-6">
                            <h4 className="buy__filter-heading font-bold text-xs uppercase text-slate-800 mb-2">Fuel Type</h4>
                            <div className="buy__filter-options flex flex-wrap gap-2">
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

                        <div className="buy__filter-group mb-6">
                            <h4 className="buy__filter-heading font-bold text-xs uppercase text-slate-800 mb-2">Transmission</h4>
                            <div className="buy__filter-options flex flex-wrap gap-2">
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
                            className="btn btn--outline w-full mt-4"
                            onClick={handleClearAll}
                        >
                            Clear All Filters
                        </button>
                    </aside>

                    {/* Car Grid */}
                    <div className="buy__grid flex-1">
                        {cars.length > 0 ? (
                            cars.map(car => <CarCard key={car.id} car={car} />)
                        ) : (
                            <div className="buy__empty py-20 text-center">
                                <h3 className="text-xl font-bold text-slate-800 mb-2">No vehicles found</h3>
                                <p className="text-slate-500">Try adjusting your filter options to see more results.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Modal */}
            <Modal isOpen={showFilters} onClose={() => setShowFilters(false)} title="Filters">
                <div className="buy__modal-filters p-4">
                    <div className="buy__filter-group mb-4">
                        <h4 className="buy__filter-heading font-bold text-xs uppercase text-slate-800 mb-2">Body Type</h4>
                        <div className="buy__filter-options flex flex-wrap gap-2">
                            {BODY_TYPES.map(b => (
                                <button key={b} className={`buy__filter-chip ${filters.bodyType === b ? 'buy__filter-chip--active' : ''}`} onClick={() => updateFilter('bodyType', b)}>{b}</button>
                            ))}
                        </div>
                    </div>
                    <div className="buy__filter-group mb-4">
                        <h4 className="buy__filter-heading font-bold text-xs uppercase text-slate-800 mb-2">Make</h4>
                        <select className="form-select" value={filters.make} onChange={e => updateFilter('make', e.target.value)}>
                            <option value="">All Makes</option>
                            {makes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    {filters.make && (
                        <div className="buy__filter-group mb-4">
                            <h4 className="buy__filter-heading font-bold text-xs uppercase text-slate-800 mb-2">Model</h4>
                            <select className="form-select" value={filters.model} onChange={e => updateFilter('model', e.target.value)}>
                                <option value="">All Models</option>
                                {models.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="buy__filter-group mb-4">
                        <h4 className="buy__filter-heading font-bold text-xs uppercase text-slate-800 mb-2">Max Price</h4>
                        <select className="form-select" value={filters.maxPrice} onChange={e => updateFilter('maxPrice', e.target.value)}>
                            <option value="">No Max</option>
                            <option value="15000">£15,000</option>
                            <option value="20000">£20,000</option>
                            <option value="30000">£30,000</option>
                            <option value="40000">£40,000</option>
                            <option value="50000">£50,000</option>
                            <option value="75000">£75,000</option>
                            <option value="100000">£100,000</option>
                        </select>
                    </div>
                    <div className="buy__filter-group mb-4">
                        <h4 className="buy__filter-heading font-bold text-xs uppercase text-slate-800 mb-2">Max Mileage</h4>
                        <select className="form-select" value={filters.maxMileage} onChange={e => updateFilter('maxMileage', e.target.value)}>
                            <option value="">No Max</option>
                            <option value="10000">Under 10,000 miles</option>
                            <option value="20000">Under 20,000 miles</option>
                            <option value="30000">Under 30,000 miles</option>
                            <option value="50000">Under 50,000 miles</option>
                        </select>
                    </div>
                    <div className="buy__filter-group mb-4">
                        <h4 className="buy__filter-heading font-bold text-xs uppercase text-slate-800 mb-2">Fuel Type</h4>
                        <div className="buy__filter-options flex flex-wrap gap-2">
                            {FUEL_TYPES.map(f => (
                                <button key={f} className={`buy__filter-chip ${filters.fuel === f ? 'buy__filter-chip--active' : ''}`} onClick={() => updateFilter('fuel', f)}>{f}</button>
                            ))}
                        </div>
                    </div>
                    <div className="buy__filter-group mb-4">
                        <h4 className="buy__filter-heading font-bold text-xs uppercase text-slate-800 mb-2">Transmission</h4>
                        <div className="buy__filter-options flex flex-wrap gap-2">
                            {['All', 'Automatic', 'Manual'].map(t => (
                                <button key={t} className={`buy__filter-chip ${filters.transmission === t ? 'buy__filter-chip--active' : ''}`} onClick={() => updateFilter('transmission', t)}>{t}</button>
                            ))}
                        </div>
                    </div>
                    <button className="btn btn--primary w-full mt-6" onClick={() => setShowFilters(false)}>
                        Show {cars.length} Results
                    </button>
                </div>
            </Modal>
        </div>
    );
}
