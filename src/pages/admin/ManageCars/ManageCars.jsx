import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getCars, deleteCar, updateCar, syncAutoTraderStock, syncDataFromServer } from '../../../services/dataService';
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

    // Modal state for marking a vehicle as sold
    const [soldModalCar, setSoldModalCar] = useState(null);
    const [leadSource, setLeadSource] = useState('');
    const [autotraderDays, setAutotraderDays] = useState('');
    const [validationError, setValidationError] = useState('');

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
            setValidationError('');
        }
    };

    const handleConfirmSold = (e) => {
        e.preventDefault();
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

        const daysValue = leadSource === 'Auto Trader' ? parseInt(autotraderDays, 10) : null;

        updateCar(soldModalCar.id, {
            status: 'sold',
            lead_source: leadSource,
            leadSource: leadSource,
            autotrader_days_advertised: daysValue,
            autotraderDaysAdvertised: daysValue
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
                <h1>Manage Inventory</h1>
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

            <div className="manage-cars__table-container">
                <table className="manage-cars__table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Vehicle</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Lead Source</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cars.map(car => {
                            const source = car.lead_source || car.leadSource;
                            const days = car.autotrader_days_advertised ?? car.autotraderDaysAdvertised;

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
                                        <span className={`manage-cars__status manage-cars__status--${car.status}`}>
                                            {car.status}
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
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mark Sold Workflow Modal */}
            {soldModalCar && (
                <div className="manage-cars__modal-overlay" onClick={() => setSoldModalCar(null)}>
                    <div className="manage-cars__modal" onClick={(e) => e.stopPropagation()}>
                        <div className="manage-cars__modal-header">
                            <div>
                                <span className="manage-cars__modal-tag">SALE RECORDING</span>
                                <h2>Mark Vehicle as Sold</h2>
                                <p className="manage-cars__modal-sub">
                                    {soldModalCar.year} {soldModalCar.make} {soldModalCar.model} {soldModalCar.trim}
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

                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 'bold' }}>
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
                                <div className="form-group animate-fade-in" style={{ marginTop: '15px' }}>
                                    <label className="form-label" style={{ fontWeight: 'bold' }}>
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
                                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginTop: '4px' }}>
                                        Enter total advertising duration on Auto Trader before the sale was completed.
                                    </span>
                                </div>
                            )}

                            <div className="manage-cars__modal-footer" style={{ marginTop: '25px' }}>
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
