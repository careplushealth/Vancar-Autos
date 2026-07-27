import { useState, useEffect } from 'react';
import { getInquiries, updateInquiryStatus, deleteInquiry } from '../../../services/dataService';
import './Enquiries.css';

export default function Enquiries() {
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);

    useEffect(() => {
        loadEnquiries();
    }, []);

    const loadEnquiries = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getInquiries();
            setEnquiries(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load enquiries. Please check if the API server is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRead = async (id, currentStatus) => {
        const newStatus = currentStatus === 'read' ? 'new' : 'read';
        try {
            await updateInquiryStatus(id, newStatus);
            setEnquiries(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
            if (selectedEnquiry && selectedEnquiry.id === id) {
                setSelectedEnquiry(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            alert('Failed to update enquiry status');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this enquiry? This action cannot be undone.')) return;
        try {
            await deleteInquiry(id);
            setEnquiries(prev => prev.filter(item => item.id !== id));
            if (selectedEnquiry && selectedEnquiry.id === id) {
                setSelectedEnquiry(null);
            }
        } catch (err) {
            alert('Failed to delete enquiry');
        }
    };

    const filteredEnquiries = enquiries.filter(item => {
        if (activeTab === 'all') return true;
        if (activeTab === 'contact') return item.type === 'contact';
        if (activeTab === 'vehicle_inquiry') return item.type === 'vehicle_inquiry';
        if (activeTab === 'sell_valuation') return item.type === 'sell_valuation';
        return true;
    });

    const getUnreadCount = () => {
        return enquiries.filter(item => item.status === 'new').length;
    };

    const formatPrice = (price) => {
        if (!price) return 'N/A';
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            minimumFractionDigits: 0
        }).format(price);
    };

    const formatMileage = (miles) => {
        if (!miles) return 'N/A';
        return new Intl.NumberFormat('en-GB').format(miles);
    };

    return (
        <div className="admin-enquiries">
            <header className="admin-enquiries__header">
                <div>
                    <h1 className="admin-enquiries__title">Customer Enquiries</h1>
                    <p className="admin-enquiries__subtitle">
                        Manage leads from contact forms, valuations, and vehicle enquiries.
                    </p>
                </div>
                {getUnreadCount() > 0 && (
                    <span className="admin-enquiries__unread-badge">
                        {getUnreadCount()} Unread
                    </span>
                )}
            </header>

            {error && <div className="admin-enquiries__error-alert">{error}</div>}

            <div className="admin-enquiries__tabs">
                {[
                    { id: 'all', label: 'All Enquiries' },
                    { id: 'contact', label: 'General' },
                    { id: 'vehicle_inquiry', label: 'Vehicle Inquiries' },
                    { id: 'sell_valuation', label: 'Valuations' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setSelectedEnquiry(null); }}
                        className={`admin-enquiries__tab-btn ${activeTab === tab.id ? 'admin-enquiries__tab-btn--active' : ''}`}
                    >
                        {tab.label}
                        {tab.id !== 'all' && (
                            <span className="admin-enquiries__tab-count">
                                {enquiries.filter(e => tab.id === 'all' ? true : e.type === tab.id).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="admin-enquiries__loading">
                    <div className="spinner"></div>
                    <p>Loading enquiries...</p>
                </div>
            ) : (
                <div className="admin-enquiries__layout">
                    {/* List View */}
                    <div className="admin-enquiries__list-pane">
                        {filteredEnquiries.length === 0 ? (
                            <div className="admin-enquiries__empty">
                                <p>No enquiries found in this category.</p>
                            </div>
                        ) : (
                            <div className="admin-enquiries__list">
                                {filteredEnquiries.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedEnquiry(item)}
                                        className={`admin-enquiries__item-card ${selectedEnquiry && selectedEnquiry.id === item.id ? 'admin-enquiries__item-card--selected' : ''} ${item.status === 'new' ? 'admin-enquiries__item-card--unread' : ''}`}
                                    >
                                        <div className="admin-enquiries__item-top">
                                            <span className={`admin-enquiries__type-badge admin-enquiries__type-badge--${item.type}`}>
                                                {item.type === 'contact' && '✉ General'}
                                                {item.type === 'vehicle_inquiry' && '🚗 Stock Inquiry'}
                                                {item.type === 'sell_valuation' && '💰 Valuation'}
                                            </span>
                                            <span className="admin-enquiries__item-date">
                                                {new Date(item.created_at).toLocaleDateString('en-GB', {
                                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <h3 className="admin-enquiries__item-name">{item.name}</h3>
                                        <p className="admin-enquiries__item-subject">{item.subject || 'No Subject'}</p>
                                        <p className="admin-enquiries__item-excerpt">
                                            {item.message ? (item.message.length > 80 ? item.message.substring(0, 80) + '...' : item.message) : 'No message body.'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Detail View */}
                    <div className="admin-enquiries__detail-pane">
                        {selectedEnquiry ? (
                            <div className="admin-enquiries__detail-card animate-fade-in">
                                <header className="admin-enquiries__detail-header">
                                    <div>
                                        <span className={`admin-enquiries__type-badge admin-enquiries__type-badge--${selectedEnquiry.type}`}>
                                            {selectedEnquiry.type === 'contact' && '✉ General Enquiry'}
                                            {selectedEnquiry.type === 'vehicle_inquiry' && '🚗 Vehicle Inquiry'}
                                            {selectedEnquiry.type === 'sell_valuation' && '💰 Valuation Request'}
                                        </span>
                                        <h2 className="admin-enquiries__detail-title">{selectedEnquiry.name}</h2>
                                        <p className="admin-enquiries__detail-date">
                                            Received: {new Date(selectedEnquiry.created_at).toLocaleString('en-GB')}
                                        </p>
                                    </div>
                                    <div className="admin-enquiries__detail-actions">
                                        <button
                                            onClick={() => handleToggleRead(selectedEnquiry.id, selectedEnquiry.status)}
                                            className={`btn btn--sm ${selectedEnquiry.status === 'read' ? 'btn--outline' : 'btn--primary'}`}
                                            title={selectedEnquiry.status === 'read' ? 'Mark as Unread' : 'Mark as Read'}
                                        >
                                            {selectedEnquiry.status === 'read' ? '✉ Mark Unread' : '✓ Mark Read'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(selectedEnquiry.id)}
                                            className="btn btn--sm btn--secondary"
                                            title="Delete Lead"
                                        >
                                            🗑 Delete
                                        </button>
                                    </div>
                                </header>

                                <div className="admin-enquiries__detail-body">
                                    {/* Contact Section */}
                                    <div className="admin-enquiries__detail-section">
                                        <h3>Customer Contact Details</h3>
                                        <div className="admin-enquiries__contact-grid">
                                            <div>
                                                <strong>Email:</strong> <br />
                                                <a href={`mailto:${selectedEnquiry.email}`} className="admin-enquiries__link">
                                                    {selectedEnquiry.email}
                                                </a>
                                            </div>
                                            <div>
                                                <strong>Phone:</strong> <br />
                                                {selectedEnquiry.phone ? (
                                                    <a href={`tel:${selectedEnquiry.phone}`} className="admin-enquiries__link">
                                                        {selectedEnquiry.phone}
                                                    </a>
                                                ) : 'Not Provided'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vehicle Details if applicable */}
                                    {selectedEnquiry.vehicle_details && (
                                        <div className="admin-enquiries__detail-section">
                                            <h3>Vehicle Details</h3>
                                            {selectedEnquiry.type === 'vehicle_inquiry' ? (
                                                <div className="admin-enquiries__vehicle-card">
                                                    <div className="admin-enquiries__vehicle-row">
                                                        <strong>Vehicle Model:</strong> <span>{selectedEnquiry.vehicle_details.title}</span>
                                                    </div>
                                                    <div className="admin-enquiries__vehicle-row">
                                                        <strong>Price:</strong> <span>{formatPrice(selectedEnquiry.vehicle_details.price)}</span>
                                                    </div>
                                                    <div className="admin-enquiries__vehicle-row">
                                                        <strong>Mileage:</strong> <span>{formatMileage(selectedEnquiry.vehicle_details.mileage)} miles</span>
                                                    </div>
                                                    <div className="admin-enquiries__vehicle-row">
                                                        <strong>Year:</strong> <span>{selectedEnquiry.vehicle_details.year}</span>
                                                    </div>
                                                    <div className="admin-enquiries__vehicle-row">
                                                        <strong>ID:</strong> <code style={{ fontSize: '12px' }}>{selectedEnquiry.vehicle_details.id}</code>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="admin-enquiries__vehicle-card">
                                                        <div className="admin-enquiries__vehicle-row">
                                                            <strong>Registration:</strong> <span className="uppercase font-bold">{selectedEnquiry.vehicle_details.registration || 'N/A'}</span>
                                                        </div>
                                                        <div className="admin-enquiries__vehicle-row">
                                                            <strong>Make & Model:</strong> <span>{selectedEnquiry.vehicle_details.make} {selectedEnquiry.vehicle_details.model}</span>
                                                        </div>
                                                        <div className="admin-enquiries__vehicle-row">
                                                            <strong>Year:</strong> <span>{selectedEnquiry.vehicle_details.year || 'N/A'}</span>
                                                        </div>
                                                        <div className="admin-enquiries__vehicle-row">
                                                            <strong>Mileage:</strong> <span>{formatMileage(selectedEnquiry.vehicle_details.mileage)} miles</span>
                                                        </div>
                                                        <div className="admin-enquiries__vehicle-row">
                                                            <strong>Condition:</strong> <span className="badge badge--condition">{selectedEnquiry.vehicle_details.condition || 'N/A'}</span>
                                                        </div>
                                                        <div className="admin-enquiries__vehicle-row">
                                                            <strong>Service History:</strong> <span>{selectedEnquiry.vehicle_details.serviceHistory || 'N/A'}</span>
                                                        </div>
                                                        <div className="admin-enquiries__vehicle-row">
                                                            <strong>Accident History:</strong> <span>{selectedEnquiry.vehicle_details.accidents || 'N/A'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Auto Trader Valuation details if present */}
                                                    {selectedEnquiry.vehicle_details.autotrader_valuation && (
                                                        <div className="admin-enquiries__autotrader-valuation-box" style={{ marginTop: '15px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                                            <div style={{ backgroundColor: '#002F6C', color: 'white', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span>AUTO TRADER CONNECT VALUATION</span>
                                                                <span style={{ fontSize: '9px', opacity: 0.8 }}>Live Active</span>
                                                            </div>
                                                            <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                                                                <div>
                                                                    <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '11px' }}>Part Exchange (Dealer Buy)</span>
                                                                    <strong style={{ fontSize: '15px', color: 'var(--color-accent)' }}>
                                                                        {formatPrice(selectedEnquiry.vehicle_details.autotrader_valuation.partExchange)}
                                                                    </strong>
                                                                </div>
                                                                <div>
                                                                    <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '11px' }}>Trade Value</span>
                                                                    <strong>
                                                                        {formatPrice(selectedEnquiry.vehicle_details.autotrader_valuation.trade)}
                                                                    </strong>
                                                                </div>
                                                                <div>
                                                                    <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '11px' }}>Private Value</span>
                                                                    <strong>
                                                                        {formatPrice(selectedEnquiry.vehicle_details.autotrader_valuation.private)}
                                                                    </strong>
                                                                </div>
                                                                <div>
                                                                    <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '11px' }}>Retail Value</span>
                                                                    <strong>
                                                                        {formatPrice(selectedEnquiry.vehicle_details.autotrader_valuation.retail)}
                                                                    </strong>
                                                                </div>
                                                                {selectedEnquiry.vehicle_details.autotrader_valuation.derivativeName && (
                                                                    <div style={{ gridColumn: '1 / -1', fontSize: '11px', color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)', paddingTop: '6px', marginTop: '4px' }}>
                                                                        <strong>Derivative:</strong> {selectedEnquiry.vehicle_details.autotrader_valuation.derivativeName}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Message Section */}
                                    <div className="admin-enquiries__detail-section">
                                        <h3>Message / Notes</h3>
                                        <div className="admin-enquiries__message-box">
                                            {selectedEnquiry.message ? (
                                                <p className="whitespace-pre-wrap">{selectedEnquiry.message}</p>
                                            ) : (
                                                <p className="text-slate-400 italic">No notes or message provided.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="admin-enquiries__no-selection">
                                <span className="admin-enquiries__mailbox-icon">📬</span>
                                <h3>Select a Lead</h3>
                                <p>Click on any enquiry in the left pane to view complete contact details, vehicle specifications, and message details.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
