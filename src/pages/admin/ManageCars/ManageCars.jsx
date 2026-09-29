import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    getCars,
    deleteCar,
    updateCar,
    syncAutoTraderStock,
    syncDataFromServer,
    getCustomers,
    createCustomer,
    updateCustomer,
    getCustomerById
} from '../../../services/dataService';
import './ManageCars.css';

const LEAD_SOURCES = [
    'Facebook',
    'Auto Trader',
    'Gumtree',
    'eBay',
    'Website',
    'Walk-in',
    'Referral',
    'Repeat Customer',
    'Other'
];

export default function ManageCars() {
    const [refresh, setRefresh] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const cars = useMemo(() => getCars(), [refresh]);
    const customers = useMemo(() => getCustomers(), [refresh]);

    // Filtering state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMake, setFilterMake] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    // Sorting state
    const [sortField, setSortField] = useState('vehicle');
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

    // Modal state for marking a vehicle as sold
    const [soldModalCar, setSoldModalCar] = useState(null);
    const [leadSource, setLeadSource] = useState('');
    const [autotraderDays, setAutotraderDays] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState('new');
    const [customerFullName, setCustomerFullName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [validationError, setValidationError] = useState('');

    // List of unique makes for dropdown
    const availableMakes = useMemo(() => {
        const set = new Set();
        cars.forEach(c => {
            if (c.make) set.add(c.make);
        });
        return Array.from(set).sort();
    }, [cars]);

    // Handle Header Click Sorting
    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const renderSortIndicator = (field) => {
        if (sortField !== field) {
            return <span style={{ opacity: 0.35, marginLeft: '6px' }}>↕</span>;
        }
        return (
            <span style={{ marginLeft: '6px', color: 'var(--color-accent)', fontWeight: 'bold' }}>
                {sortOrder === 'asc' ? '▲' : '▼'}
            </span>
        );
    };

    // Filter and Sort Inventory
    const filteredAndSortedCars = useMemo(() => {
        let result = cars.filter(car => {
            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const titleStr = `${car.year || ''} ${car.make || ''} ${car.model || ''} ${car.trim || ''}`.toLowerCase();
                const purchaserStr = (car.purchase_attribution || car.purchaseAttribution || '').toLowerCase();
                const sourceStr = (car.lead_source || car.leadSource || '').toLowerCase();

                if (!titleStr.includes(q) && !purchaserStr.includes(q) && !sourceStr.includes(q)) {
                    return false;
                }
            }

            // Make filter
            if (filterMake !== 'All' && car.make !== filterMake) {
                return false;
            }

            // Status filter (Sold vs Still on Sale)
            if (filterStatus !== 'All') {
                if (filterStatus === 'available' && car.status !== 'available') return false;
                if (filterStatus === 'sold' && car.status !== 'sold') return false;
            }

            // Price filter
            const price = parseFloat(car.price) || 0;
            if (minPrice !== '' && !isNaN(parseFloat(minPrice)) && price < parseFloat(minPrice)) {
                return false;
            }
            if (maxPrice !== '' && !isNaN(parseFloat(maxPrice)) && price > parseFloat(maxPrice)) {
                return false;
            }

            return true;
        });

        // Sorting
        if (sortField) {
            result.sort((a, b) => {
                let valA, valB;
                switch (sortField) {
                    case 'image':
                    case 'vehicle':
                        valA = `${a.make || ''} ${a.model || ''} ${a.year || 0}`.toLowerCase();
                        valB = `${b.make || ''} ${b.model || ''} ${b.year || 0}`.toLowerCase();
                        break;
                    case 'price':
                        valA = parseFloat(a.price) || 0;
                        valB = parseFloat(b.price) || 0;
                        break;
                    case 'purchaser':
                        valA = (a.purchase_attribution || a.purchaseAttribution || '').toLowerCase();
                        valB = (b.purchase_attribution || b.purchaseAttribution || '').toLowerCase();
                        break;
                    case 'status':
                        valA = (a.status || '').toLowerCase();
                        valB = (b.status || '').toLowerCase();
                        break;
                    case 'leadSource':
                        valA = (a.lead_source || a.leadSource || '').toLowerCase();
                        valB = (b.lead_source || b.leadSource || '').toLowerCase();
                        break;
                    default:
                        valA = a.id;
                        valB = b.id;
                }

                if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [cars, searchQuery, filterMake, filterStatus, minPrice, maxPrice, sortField, sortOrder]);

    const handleResetFilters = () => {
        setSearchQuery('');
        setFilterMake('All');
        setFilterStatus('All');
        setMinPrice('');
        setMaxPrice('');
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this car?')) {
            deleteCar(id);
            setRefresh(prev => prev + 1);
        }
    };

    const handleToggleStatus = (car) => {
        if (car.status === 'sold') {
            if (window.confirm('Mark this vehicle as available again?')) {
                updateCar(car.id, { status: 'available' });
                setRefresh(prev => prev + 1);
            }
        } else {
            // Open Sold workflow modal
            setSoldModalCar(car);
            setLeadSource(car.lead_source || car.leadSource || '');
            setAutotraderDays(car.autotrader_days_advertised ?? car.autotraderDaysAdvertised ?? '');
            setSelectedCustomerId('new');
            setCustomerFullName('');
            setCustomerPhone('');
            setCustomerEmail('');
            setCustomerAddress('');
            setValidationError('');
        }
    };

    const handleCustomerSelectionChange = (customerId) => {
        setSelectedCustomerId(customerId);
        if (customerId === 'new') {
            setCustomerFullName('');
            setCustomerPhone('');
            setCustomerEmail('');
            setCustomerAddress('');
        } else {
            const existing = getCustomerById(customerId);
            if (existing) {
                setCustomerFullName(existing.full_name || '');
                setCustomerPhone(existing.phone || '');
                setCustomerEmail(existing.email || '');
                setCustomerAddress(existing.address || '');
            }
        }
    };

    const handleConfirmSold = (e) => {
        e.preventDefault();
        setValidationError('');

        if (!leadSource) {
            setValidationError('Customer Source / Lead Source is required.');
            return;
        }

        if (leadSource === 'Auto Trader') {
            if (autotraderDays === '' || autotraderDays === null || isNaN(autotraderDays) || parseInt(autotraderDays) < 0) {
                setValidationError('Number of Days Advertised on Auto Trader is required and must be a valid non-negative number.');
                return;
            }
        }

        if (!customerFullName.trim()) {
            setValidationError('Customer Full Name is required.');
            return;
        }

        if (!customerPhone.trim()) {
            setValidationError('Customer Phone Number is required.');
            return;
        }

        if (!customerEmail.trim()) {
            setValidationError('Customer Email is required.');
            return;
        }

        if (!customerAddress.trim()) {
            setValidationError('Customer Postal Address is required.');
            return;
        }

        const daysValue = leadSource === 'Auto Trader' ? parseInt(autotraderDays, 10) : null;
        const vehicleName = `${soldModalCar.year || ''} ${soldModalCar.make || ''} ${soldModalCar.model || ''} ${soldModalCar.trim || ''}`.trim();

        let customerObj = null;
        if (selectedCustomerId && selectedCustomerId !== 'new') {
            customerObj = getCustomerById(selectedCustomerId);
            if (customerObj) {
                updateCustomer(customerObj.id, {
                    full_name: customerFullName.trim(),
                    phone: customerPhone.trim(),
                    email: customerEmail.trim(),
                    address: customerAddress.trim(),
                    vehicle_id: soldModalCar.id,
                    vehicle_name: vehicleName,
                    sale_price: soldModalCar.price,
                    sale_date: new Date().toISOString(),
                    lead_source: leadSource
                });
            }
        }

        if (!customerObj) {
            customerObj = createCustomer({
                full_name: customerFullName.trim(),
                phone: customerPhone.trim(),
                email: customerEmail.trim(),
                address: customerAddress.trim(),
                vehicle_id: soldModalCar.id,
                vehicle_name: vehicleName,
                sale_price: soldModalCar.price,
                sale_date: new Date().toISOString(),
                lead_source: leadSource
            });
        }

        updateCar(soldModalCar.id, {
            status: 'sold',
            lead_source: leadSource,
            leadSource: leadSource,
            autotrader_days_advertised: daysValue,
            autotraderDaysAdvertised: daysValue,
            customer_id: customerObj ? customerObj.id : null,
            customer_details: {
                name: customerFullName.trim(),
                phone: customerPhone.trim(),
                email: customerEmail.trim(),
                address: customerAddress.trim()
            }
        });

        setSoldModalCar(null);
        setRefresh(prev => prev + 1);
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await syncAutoTraderStock();
            await syncDataFromServer();
            setRefresh(prev => prev + 1);
            alert(`Stock synchronized successfully! Synced ${res.count} active vehicle(s).`);
        } catch (err) {
            console.error(err);
            alert(`Failed to synchronize forecourt stock from Auto Trader:\n\n${err.message || 'Please check API credentials or network connection.'}`);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="manage-cars">
            <div className="manage-cars__header">
                <div>
                    <h1>Manage Inventory</h1>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        Total: {cars.length} vehicles ({cars.filter(c => c.status === 'available').length} Available, {cars.filter(c => c.status === 'sold').length} Sold)
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={handleSync} 
                        className="btn btn--secondary" 
                        disabled={syncing}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.625rem 1.25rem' }}
                    >
                        {syncing ? (
                            <>
                                <span className="mini-spinner-dark"></span> Syncing...
                            </>
                        ) : (
                            <>🔄 Sync Auto Trader</>
                        )}
                    </button>
                    <Link to="/admin/cars/new" className="btn btn--primary">+ Add Car</Link>
                </div>
            </div>

            {/* Inventory Filter Bar */}
            <div className="manage-cars__filters">
                <input
                    type="text"
                    className="manage-cars__search-input"
                    placeholder="Search by vehicle, make, model, or purchaser..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <div className="manage-cars__filter-group">
                    <span className="manage-cars__filter-label">Make:</span>
                    <select
                        className="manage-cars__filter-select"
                        value={filterMake}
                        onChange={(e) => setFilterMake(e.target.value)}
                    >
                        <option value="All">All Makes</option>
                        {availableMakes.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                <div className="manage-cars__filter-group">
                    <span className="manage-cars__filter-label">Status:</span>
                    <select
                        className="manage-cars__filter-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        <option value="available">On Sale</option>
                        <option value="sold">Sold</option>
                    </select>
                </div>

                <div className="manage-cars__filter-group">
                    <span className="manage-cars__filter-label">Price (£):</span>
                    <input
                        type="number"
                        placeholder="Min"
                        className="manage-cars__price-input"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <span style={{ color: 'var(--color-text-tertiary)' }}>-</span>
                    <input
                        type="number"
                        placeholder="Max"
                        className="manage-cars__price-input"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                    />
                </div>

                {(searchQuery || filterMake !== 'All' || filterStatus !== 'All' || minPrice || maxPrice) && (
                    <button
                        onClick={handleResetFilters}
                        className="btn btn--sm btn--outline"
                        style={{ marginLeft: 'auto' }}
                    >
                        Reset Filters
                    </button>
                )}
            </div>

            <div className="manage-cars__table-container">
                <table className="manage-cars__table">
                    <thead>
                        <tr>
                            <th className="sortable" onClick={() => handleSort('image')}>
                                Image {renderSortIndicator('image')}
                            </th>
                            <th className="sortable" onClick={() => handleSort('vehicle')}>
                                Vehicle {renderSortIndicator('vehicle')}
                            </th>
                            <th className="sortable" onClick={() => handleSort('price')}>
                                Price {renderSortIndicator('price')}
                            </th>
                            <th className="sortable" onClick={() => handleSort('purchaser')}>
                                Purchaser {renderSortIndicator('purchaser')}
                            </th>
                            <th className="sortable" onClick={() => handleSort('status')}>
                                Status {renderSortIndicator('status')}
                            </th>
                            <th className="sortable" onClick={() => handleSort('leadSource')}>
                                Lead Source {renderSortIndicator('leadSource')}
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedCars.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                                    No vehicles found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredAndSortedCars.map(car => {
                                const source = car.lead_source || car.leadSource;
                                const days = car.autotrader_days_advertised ?? car.autotraderDaysAdvertised;
                                const purchaser = car.purchase_attribution || car.purchaseAttribution;

                                return (
                                    <tr key={car.id}>
                                        <td>
                                            <img src={car.images?.[0] || '/images/car-sedan.png'} alt="" className="manage-cars__thumb" />
                                        </td>
                                        <td>
                                            <div className="manage-cars__info">
                                                <span className="manage-cars__title">{car.year} {car.make} {car.model}</span>
                                                <span className="manage-cars__subtitle">{car.trim}</span>
                                            </div>
                                        </td>
                                        <td>£{car.price.toLocaleString()}</td>
                                        <td>
                                            {purchaser ? (
                                                <span style={{ 
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    padding: '3px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    background: purchaser.includes('Abbas') ? 'rgba(59, 130, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                                                    color: purchaser.includes('Abbas') ? '#3b82f6' : '#a855f7',
                                                    border: `1px solid ${purchaser.includes('Abbas') ? 'rgba(59, 130, 246, 0.3)' : 'rgba(168, 85, 247, 0.3)'}`
                                                }}>
                                                    👤 {purchaser}
                                                </span>
                                            ) : (
                                                <span style={{ opacity: 0.4, fontSize: '12px' }}>Unassigned</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`manage-cars__status manage-cars__status--${car.status}`}>
                                                {car.status === 'sold' ? 'Sold' : 'On Sale'}
                                            </span>
                                        </td>
                                        <td>
                                            {source ? (
                                                <div className="manage-cars__lead-badge">
                                                    <span className="manage-cars__lead-name">📍 {source}</span>
                                                    {source === 'Auto Trader' && (days !== null && days !== undefined && days !== '') && (
                                                        <span className="manage-cars__lead-days">{days} days advertised</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ opacity: 0.4, fontSize: '12px' }}>—</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="manage-cars__actions">
                                                <button 
                                                    onClick={() => handleToggleStatus(car)} 
                                                    className={`btn btn--sm ${car.status === 'sold' ? 'btn--primary' : 'btn--outline'}`}
                                                    style={{ marginRight: '8px' }}
                                                >
                                                    {car.status === 'sold' ? 'Mark Available' : 'Mark Sold'}
                                                </button>
                                                <Link to={`/admin/cars/${car.id}/edit`} className="btn btn--sm btn--secondary">Edit</Link>
                                                <button onClick={() => handleDelete(car.id)} className="btn btn--sm btn--outline manage-cars__delete">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mark Sold Workflow & Customer Recording Modal */}
            {soldModalCar && (
                <div className="manage-cars__modal-overlay" onClick={() => setSoldModalCar(null)}>
                    <div className="manage-cars__modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="manage-cars__modal-header">
                            <div>
                                <span className="manage-cars__modal-tag">RECORD VEHICLE SALE</span>
                                <h2>Mark Vehicle as Sold</h2>
                                <p className="manage-cars__modal-sub">
                                    {soldModalCar.year} {soldModalCar.make} {soldModalCar.model} {soldModalCar.trim} (£{soldModalCar.price?.toLocaleString()})
                                </p>
                            </div>
                            <button className="manage-cars__modal-close" onClick={() => setSoldModalCar(null)}>×</button>
                        </div>

                        <form onSubmit={handleConfirmSold} className="manage-cars__modal-form">
                            {validationError && (
                                <div className="manage-cars__modal-error">
                                    ⚠️ {validationError}
                                </div>
                            )}

                            {/* Section 1: Lead Source */}
                            <div className="mb-4 pb-4 border-b border-slate-100">
                                <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: 'var(--color-text-primary)' }}>
                                    1. Sale & Attribution Source
                                </h3>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: '600' }}>
                                        Customer Source / Lead Source <span style={{ color: '#e53935' }}>*</span>
                                    </label>
                                    <select 
                                        className="form-select"
                                        value={leadSource} 
                                        onChange={(e) => {
                                            setLeadSource(e.target.value);
                                            setValidationError('');
                                        }}
                                        required
                                    >
                                        <option value="">-- Select Lead Source --</option>
                                        {LEAD_SOURCES.map(src => (
                                            <option key={src} value={src}>{src}</option>
                                        ))}
                                    </select>
                                </div>

                                {leadSource === 'Auto Trader' && (
                                    <div className="form-group" style={{ marginTop: '12px' }}>
                                        <label className="form-label" style={{ fontWeight: '600' }}>
                                            Number of Days Advertised on Auto Trader <span style={{ color: '#e53935' }}>*</span>
                                        </label>
                                        <input 
                                            type="number"
                                            min="0"
                                            step="1"
                                            className="form-input"
                                            placeholder="e.g. 14"
                                            value={autotraderDays}
                                            onChange={(e) => {
                                                setAutotraderDays(e.target.value);
                                                setValidationError('');
                                            }}
                                            required
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Section 2: Customer Details */}
                            <div>
                                <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: 'var(--color-text-primary)' }}>
                                    2. Buyer / Customer Information
                                </h3>

                                {customers.length > 0 && (
                                    <div className="form-group" style={{ marginBottom: '12px' }}>
                                        <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>
                                            Select Existing Customer or Enter New
                                        </label>
                                        <select
                                            className="form-select"
                                            value={selectedCustomerId}
                                            onChange={(e) => handleCustomerSelectionChange(e.target.value)}
                                        >
                                            <option value="new">+ Create New Customer Record</option>
                                            {customers.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    👤 {c.full_name} ({c.phone || c.email || 'No contact info'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <label className="form-label" style={{ fontWeight: '600' }}>
                                        Full Name <span style={{ color: '#e53935' }}>*</span>
                                    </label>
                                    <input 
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. David Miller"
                                        value={customerFullName}
                                        onChange={(e) => {
                                            setCustomerFullName(e.target.value);
                                            setValidationError('');
                                        }}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: '600' }}>
                                            Phone Number <span style={{ color: '#e53935' }}>*</span>
                                        </label>
                                        <input 
                                            type="tel"
                                            className="form-input"
                                            placeholder="e.g. 07700 900123"
                                            value={customerPhone}
                                            onChange={(e) => {
                                                setCustomerPhone(e.target.value);
                                                setValidationError('');
                                            }}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: '600' }}>
                                            Email Address <span style={{ color: '#e53935' }}>*</span>
                                        </label>
                                        <input 
                                            type="email"
                                            className="form-input"
                                            placeholder="e.g. david@example.com"
                                            value={customerEmail}
                                            onChange={(e) => {
                                                setCustomerEmail(e.target.value);
                                                setValidationError('');
                                            }}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <label className="form-label" style={{ fontWeight: '600' }}>
                                        Full Address <span style={{ color: '#e53935' }}>*</span>
                                    </label>
                                    <textarea 
                                        className="form-input"
                                        rows="2"
                                        placeholder="House No, Street, City, Postcode"
                                        value={customerAddress}
                                        onChange={(e) => {
                                            setCustomerAddress(e.target.value);
                                            setValidationError('');
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="manage-cars__modal-footer" style={{ marginTop: '20px' }}>
                                <button 
                                    type="button" 
                                    className="btn btn--outline" 
                                    onClick={() => setSoldModalCar(null)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn--primary"
                                >
                                    Confirm Vehicle Sold
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
