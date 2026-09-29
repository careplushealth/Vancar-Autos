import { useState, useMemo } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../../services/dataService';
import './Customers.css';

const fmtCurrency = (n) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n || 0);

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (_) {
        return dateStr;
    }
};

const getInitials = (name) => {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
};

export default function Customers() {
    const [refresh, setRefresh] = useState(0);
    const customers = useMemo(() => getCustomers(), [refresh]);

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLeadSource, setSelectedLeadSource] = useState('All');

    // Modals
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
    });

    const [viewingCustomer, setViewingCustomer] = useState(null);

    // Extract unique lead sources for filter
    const leadSources = useMemo(() => {
        const set = new Set();
        customers.forEach(c => {
            if (c.lead_source || c.leadSource) set.add(c.lead_source || c.leadSource);
        });
        return Array.from(set);
    }, [customers]);

    // Filtered customers
    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            const matchesSearch =
                !searchQuery ||
                (c.full_name && c.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (c.phone && c.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (c.vehicle_name && c.vehicle_name.toLowerCase().includes(searchQuery.toLowerCase()));

            const source = c.lead_source || c.leadSource;
            const matchesLead = selectedLeadSource === 'All' || source === selectedLeadSource;

            return matchesSearch && matchesLead;
        });
    }, [customers, searchQuery, selectedLeadSource]);

    // Aggregate statistics
    const stats = useMemo(() => {
        const total = customers.length;
        const totalRev = customers.reduce((sum, c) => sum + (parseFloat(c.sale_price) || 0), 0);
        const latestDate = customers.length > 0 ? formatDate(customers[0].sale_date || customers[0].created_at) : '—';
        return { total, totalRev, latestDate };
    }, [customers]);

    const handleOpenAdd = () => {
        setEditingCustomer(null);
        setFormData({
            full_name: '',
            phone: '',
            email: '',
            address: '',
            notes: ''
        });
        setShowEditModal(true);
    };

    const handleOpenEdit = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            full_name: customer.full_name || '',
            phone: customer.phone || '',
            email: customer.email || '',
            address: customer.address || '',
            notes: customer.notes || ''
        });
        setShowEditModal(true);
    };

    const handleDelete = (id, name) => {
        if (window.confirm(`Are you sure you want to delete customer record for "${name}"?`)) {
            deleteCustomer(id);
            setRefresh(prev => prev + 1);
        }
    };

    const handleSubmitModal = (e) => {
        e.preventDefault();
        if (!formData.full_name.trim()) {
            alert('Full Name is required.');
            return;
        }

        if (editingCustomer) {
            updateCustomer(editingCustomer.id, formData);
        } else {
            createCustomer(formData);
        }

        setShowEditModal(false);
        setRefresh(prev => prev + 1);
    };

    return (
        <div className="admin-customers">
            <div className="admin-customers__header">
                <div>
                    <h1>Customers Directory</h1>
                    <p className="admin-customers__sub">
                        All customers who have purchased a vehicle from Vancar Autos
                    </p>
                </div>
                <button onClick={handleOpenAdd} className="btn btn--primary">
                    + Add Customer Record
                </button>
            </div>

            {/* Quick Stats */}
            <div className="admin-customers__stats">
                <div className="admin-customers__stat-card">
                    <div className="admin-customers__stat-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <div>
                        <div className="admin-customers__stat-value">{stats.total}</div>
                        <div className="admin-customers__stat-label">Total Customers</div>
                    </div>
                </div>

                <div className="admin-customers__stat-card">
                    <div className="admin-customers__stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                    </div>
                    <div>
                        <div className="admin-customers__stat-value">{stats.total}</div>
                        <div className="admin-customers__stat-label">Vehicles Sold</div>
                    </div>
                </div>

                <div className="admin-customers__stat-card">
                    <div className="admin-customers__stat-icon" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                    </div>
                    <div>
                        <div className="admin-customers__stat-value">{fmtCurrency(stats.totalRev)}</div>
                        <div className="admin-customers__stat-label">Total Revenue</div>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="admin-customers__filters">
                <div className="admin-customers__search">
                    <svg className="admin-customers__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input
                        type="text"
                        placeholder="Search by customer name, phone, email, address, or vehicle..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {leadSources.length > 0 && (
                    <select
                        className="admin-customers__filter-select"
                        value={selectedLeadSource}
                        onChange={(e) => setSelectedLeadSource(e.target.value)}
                    >
                        <option value="All">All Lead Sources</option>
                        {leadSources.map(src => (
                            <option key={src} value={src}>{src}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Customers Table */}
            <div className="admin-customers__table-container">
                {filteredCustomers.length === 0 ? (
                    <div className="admin-customers__empty">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 1rem', opacity: 0.4 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        <p className="font-semibold text-slate-700 mb-1">No customers found</p>
                        <p className="text-xs text-slate-500">
                            {customers.length === 0
                                ? 'Customers will automatically appear here whenever a vehicle is marked as Sold.'
                                : 'No customer records match your active search filters.'}
                        </p>
                    </div>
                ) : (
                    <table className="admin-customers__table">
                        <thead>
                            <tr>
                                <th>Customer Name</th>
                                <th>Contact Information</th>
                                <th>Address</th>
                                <th>Vehicle Purchased</th>
                                <th>Sale Price</th>
                                <th>Date / Source</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map(cust => {
                                const lead = cust.lead_source || cust.leadSource;
                                return (
                                    <tr key={cust.id}>
                                        <td>
                                            <div className="admin-customers__name-cell">
                                                <div className="admin-customers__avatar">
                                                    {getInitials(cust.full_name)}
                                                </div>
                                                <div>
                                                    <div className="admin-customers__full-name">{cust.full_name}</div>
                                                    <div className="admin-customers__meta">Customer ID: #{cust.id.slice(-6)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="admin-customers__contact-info">
                                                {cust.phone ? (
                                                    <a href={`tel:${cust.phone}`}>
                                                        📞 {cust.phone}
                                                    </a>
                                                ) : (
                                                    <span style={{ opacity: 0.4 }}>No phone</span>
                                                )}
                                                {cust.email ? (
                                                    <a href={`mailto:${cust.email}`}>
                                                        ✉️ {cust.email}
                                                    </a>
                                                ) : (
                                                    <span style={{ opacity: 0.4 }}>No email</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: '200px' }}>
                                            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                                                {cust.address || '—'}
                                            </span>
                                        </td>
                                        <td>
                                            {cust.vehicle_name ? (
                                                <div className="admin-customers__vehicle-badge">
                                                    <span className="admin-customers__vehicle-name">🚗 {cust.vehicle_name}</span>
                                                </div>
                                            ) : (
                                                <span style={{ opacity: 0.4, fontSize: '12px' }}>Unspecified</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className="admin-customers__vehicle-price">
                                                {cust.sale_price ? fmtCurrency(cust.sale_price) : '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={{ fontSize: '12px', fontWeight: '500' }}>
                                                    {formatDate(cust.sale_date || cust.created_at)}
                                                </span>
                                                {lead && (
                                                    <span className="admin-customers__lead-tag">
                                                        📍 {lead}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="admin-customers__actions">
                                                <button
                                                    onClick={() => setViewingCustomer(cust)}
                                                    className="btn btn--sm btn--outline"
                                                    title="View Full Profile"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEdit(cust)}
                                                    className="btn btn--sm btn--secondary"
                                                    title="Edit Record"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cust.id, cust.full_name)}
                                                    className="btn btn--sm btn--outline"
                                                    style={{ color: '#e53935' }}
                                                    title="Delete Record"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* View Details Modal */}
            {viewingCustomer && (
                <div className="admin-customers__modal-overlay" onClick={() => setViewingCustomer(null)}>
                    <div className="admin-customers__modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-customers__modal-header">
                            <h2>Customer Details & History</h2>
                            <button className="admin-customers__modal-close" onClick={() => setViewingCustomer(null)}>×</button>
                        </div>
                        <div className="admin-customers__modal-body">
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl border border-emerald-200">
                                    {getInitials(viewingCustomer.full_name)}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">{viewingCustomer.full_name}</h3>
                                    <p className="text-xs text-slate-500">Record ID: {viewingCustomer.id}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <span className="text-xs text-slate-400 font-semibold block uppercase">Phone Number</span>
                                    <span className="text-sm font-medium text-slate-800">{viewingCustomer.phone || 'N/A'}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <span className="text-xs text-slate-400 font-semibold block uppercase">Email Address</span>
                                    <span className="text-sm font-medium text-slate-800">{viewingCustomer.email || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-6">
                                <span className="text-xs text-slate-400 font-semibold block uppercase">Postal Address</span>
                                <span className="text-sm font-medium text-slate-800 whitespace-pre-line">{viewingCustomer.address || 'N/A'}</span>
                            </div>

                            <div className="border-t border-slate-100 pt-4">
                                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <span>🚗</span> Vehicle Purchase Information
                                </h4>
                                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-slate-500">Vehicle:</span>
                                        <span className="text-xs font-bold text-slate-800">{viewingCustomer.vehicle_name || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-slate-500">Sale Price:</span>
                                        <span className="text-xs font-bold text-emerald-600">{viewingCustomer.sale_price ? fmtCurrency(viewingCustomer.sale_price) : 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-slate-500">Sale Date:</span>
                                        <span className="text-xs font-semibold text-slate-700">{formatDate(viewingCustomer.sale_date || viewingCustomer.created_at)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-slate-500">Lead Source:</span>
                                        <span className="text-xs font-semibold text-slate-700">{viewingCustomer.lead_source || viewingCustomer.leadSource || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {viewingCustomer.notes && (
                                <div className="mt-4 pt-3 border-t border-slate-100">
                                    <span className="text-xs text-slate-400 font-semibold block uppercase">Notes</span>
                                    <p className="text-xs text-slate-600 mt-1">{viewingCustomer.notes}</p>
                                </div>
                            )}

                            <div className="admin-customers__modal-footer">
                                <button className="btn btn--outline" onClick={() => setViewingCustomer(null)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showEditModal && (
                <div className="admin-customers__modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="admin-customers__modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-customers__modal-header">
                            <h2>{editingCustomer ? 'Edit Customer Record' : 'Add New Customer'}</h2>
                            <button className="admin-customers__modal-close" onClick={() => setShowEditModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmitModal} className="admin-customers__modal-body">
                            <div className="form-group mb-4">
                                <label className="form-label" style={{ fontWeight: 'bold' }}>
                                    Full Name <span style={{ color: '#e53935' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. John Smith"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 'bold' }}>Phone Number</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="e.g. 07123 456789"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 'bold' }}>Email Address</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="e.g. john@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group mb-4">
                                <label className="form-label" style={{ fontWeight: 'bold' }}>Postal Address</label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    placeholder="House number, Street, City, Postcode"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div className="form-group mb-4">
                                <label className="form-label" style={{ fontWeight: 'bold' }}>Additional Notes</label>
                                <textarea
                                    className="form-input"
                                    rows="2"
                                    placeholder="Optional notes or preferences..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <div className="admin-customers__modal-footer">
                                <button type="button" className="btn btn--outline" onClick={() => setShowEditModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn--primary">
                                    {editingCustomer ? 'Save Changes' : 'Create Customer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
