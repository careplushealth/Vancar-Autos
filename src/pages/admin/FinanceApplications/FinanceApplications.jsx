import { useState, useEffect, useMemo } from 'react';
import { 
    getFinanceApplications, 
    getFinanceApplicationById, 
    updateFinanceApplicationStatus, 
    deleteFinanceApplication 
} from '../../../services/dataService';
import './FinanceApplications.css';

export default function FinanceApplications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedApp, setSelectedApp] = useState(null);
    const [decryptedDetails, setDecryptedDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async () => {
        setLoading(true);
        try {
            const data = await getFinanceApplications();
            setApplications(data);
        } catch (err) {
            console.error('Failed to load applications:', err);
        } finally {
            setLoading(false);
        }
    };

    // When an application is clicked, load full decrypted underwriting details
    const handleSelectApplication = async (app) => {
        setSelectedApp(app);
        setDecryptedDetails(null);
        setLoadingDetails(true);

        try {
            const fullData = await getFinanceApplicationById(app.id);
            setDecryptedDetails(fullData);
        } catch (err) {
            console.error('Failed to fetch full application:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    // Status change handler
    const handleStatusChange = async (id, newStatus) => {
        setUpdatingStatus(true);
        try {
            await updateFinanceApplicationStatus(id, newStatus);
            setApplications(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
            if (selectedApp && selectedApp.id === id) {
                setSelectedApp(prev => ({ ...prev, status: newStatus }));
            }
            if (decryptedDetails && decryptedDetails.id === id) {
                setDecryptedDetails(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            alert('Failed to update status: ' + err.message);
        } finally {
            setUpdatingStatus(false);
        }
    };

    // Delete application handler
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this finance application? This action cannot be undone.')) return;
        try {
            await deleteFinanceApplication(id);
            setApplications(prev => prev.filter(a => a.id !== id));
            if (selectedApp && selectedApp.id === id) {
                setSelectedApp(null);
                setDecryptedDetails(null);
            }
        } catch (err) {
            alert('Failed to delete application: ' + err.message);
        }
    };

    // Filtering
    const filteredApplications = useMemo(() => {
        return applications.filter(app => {
            // Tab filter
            if (activeTab === 'submitted' && app.status !== 'submitted') return false;
            if (activeTab === 'under_review' && app.status !== 'under_review') return false;
            if (activeTab === 'approved' && app.status !== 'approved') return false;
            if (activeTab === 'declined' && app.status !== 'declined') return false;

            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = (app.full_name || '').toLowerCase().includes(q);
                const matchRef = (app.reference_number || '').toLowerCase().includes(q);
                const matchEmail = (app.email || '').toLowerCase().includes(q);
                const matchPhone = (app.phone || '').includes(q);
                return matchName || matchRef || matchEmail || matchPhone;
            }

            return true;
        });
    }, [applications, activeTab, searchQuery]);

    // Metrics summary
    const metrics = useMemo(() => {
        const total = applications.length;
        const submitted = applications.filter(a => a.status === 'submitted').length;
        const underReview = applications.filter(a => a.status === 'under_review').length;
        const approved = applications.filter(a => a.status === 'approved').length;
        const totalValue = applications.reduce((sum, a) => sum + Number(a.borrow_amount || 0), 0);
        return { total, submitted, underReview, approved, totalValue };
    }, [applications]);

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'submitted': return 'admin-finance-status--submitted';
            case 'under_review': return 'admin-finance-status--review';
            case 'approved': return 'admin-finance-status--approved';
            case 'declined': return 'admin-finance-status--declined';
            case 'completed': return 'admin-finance-status--completed';
            default: return 'admin-finance-status--submitted';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'submitted': return 'New Application';
            case 'under_review': return 'Under Review';
            case 'approved': return 'Approved';
            case 'declined': return 'Declined';
            case 'completed': return 'Settled / Completed';
            default: return status || 'Submitted';
        }
    };

    return (
        <div className="admin-finance">
            {/* Header */}
            <div className="admin-finance__header">
                <div>
                    <h1 className="admin-finance__title">Finance Applications</h1>
                    <p className="admin-finance__subtitle">
                        Manage online finance proposals, review underwriting requirements, and update lender decisions.
                    </p>
                </div>
                <button 
                    onClick={loadApplications} 
                    className="btn btn--outline btn--sm flex items-center gap-2"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                    Refresh
                </button>
            </div>

            {/* Metrics Grid */}
            <div className="admin-finance__metrics">
                <div className="admin-finance__metric-card">
                    <span className="admin-finance__metric-label">Total Applications</span>
                    <strong className="admin-finance__metric-value">{metrics.total}</strong>
                </div>
                <div className="admin-finance__metric-card">
                    <span className="admin-finance__metric-label">New / Action Required</span>
                    <strong className="admin-finance__metric-value text-amber-500">{metrics.submitted}</strong>
                </div>
                <div className="admin-finance__metric-card">
                    <span className="admin-finance__metric-label">Underwriting Review</span>
                    <strong className="admin-finance__metric-value text-blue-500">{metrics.underReview}</strong>
                </div>
                <div className="admin-finance__metric-card">
                    <span className="admin-finance__metric-label">Approved</span>
                    <strong className="admin-finance__metric-value text-green-600">{metrics.approved}</strong>
                </div>
                <div className="admin-finance__metric-card">
                    <span className="admin-finance__metric-label">Total Value Requested</span>
                    <strong className="admin-finance__metric-value text-[var(--color-accent)]">
                        £{metrics.totalValue.toLocaleString('en-GB')}
                    </strong>
                </div>
            </div>

            {/* Toolbar */}
            <div className="admin-finance__toolbar">
                <div className="admin-finance__tabs">
                    {[
                        { id: 'all', label: 'All Applications' },
                        { id: 'submitted', label: 'New' },
                        { id: 'under_review', label: 'Under Review' },
                        { id: 'approved', label: 'Approved' },
                        { id: 'declined', label: 'Declined' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            className={`admin-finance__tab ${activeTab === tab.id ? 'admin-finance__tab--active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="admin-finance__search">
                    <input
                        type="text"
                        placeholder="Search applicant name, ref, email, phone..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="form-input"
                    />
                </div>
            </div>

            {/* Table or Empty State */}
            {loading ? (
                <div className="p-12 text-center text-slate-400">Loading applications from database...</div>
            ) : filteredApplications.length === 0 ? (
                <div className="admin-finance__empty">
                    <div className="text-4xl mb-3">📋</div>
                    <h3>No Finance Applications Found</h3>
                    <p>Applications submitted on the customer website will appear here in real time.</p>
                </div>
            ) : (
                <div className="admin-finance__table-wrap">
                    <table className="admin-finance__table">
                        <thead>
                            <tr>
                                <th>Ref & Date</th>
                                <th>Applicant</th>
                                <th>Borrow Amount</th>
                                <th>Term</th>
                                <th>Est. Monthly</th>
                                <th>Credit Tier</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredApplications.map(app => (
                                <tr 
                                    key={app.id}
                                    className={selectedApp?.id === app.id ? 'admin-finance__row--selected' : ''}
                                    onClick={() => handleSelectApplication(app)}
                                >
                                    <td>
                                        <div className="font-mono font-bold text-xs text-slate-800">
                                            {app.reference_number}
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                            {new Date(app.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="font-bold text-sm text-slate-900">{app.full_name}</div>
                                        <div className="text-xs text-slate-500">{app.email} &bull; {app.phone}</div>
                                    </td>
                                    <td className="font-extrabold text-slate-900">
                                        £{Number(app.borrow_amount || 0).toLocaleString('en-GB')}
                                    </td>
                                    <td className="text-sm text-slate-600">
                                        {app.term_years} Yrs
                                    </td>
                                    <td className="font-bold text-green-700">
                                        £{Number(app.estimated_monthly || 0).toLocaleString('en-GB')} / mo
                                    </td>
                                    <td>
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                            {app.credit_score || 'Standard'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`admin-finance-status-badge ${getStatusBadgeClass(app.status)}`}>
                                            {getStatusLabel(app.status)}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            type="button"
                                            className="btn btn--sm btn--primary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectApplication(app);
                                            }}
                                        >
                                            Review ↗
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Application Detail Drawer / Modal */}
            {selectedApp && (
                <div className="admin-finance-drawer-backdrop" onClick={() => setSelectedApp(null)}>
                    <div className="admin-finance-drawer" onClick={e => e.stopPropagation()}>
                        <div className="admin-finance-drawer__header">
                            <div>
                                <span className="font-mono text-xs font-bold text-[var(--color-accent)]">
                                    {selectedApp.reference_number}
                                </span>
                                <h2 className="text-xl font-extrabold text-slate-900">{selectedApp.full_name}</h2>
                                <p className="text-xs text-slate-500">
                                    Submitted {new Date(selectedApp.created_at).toLocaleString('en-GB')}
                                </p>
                            </div>
                            <button 
                                className="text-slate-400 hover:text-slate-700 p-2"
                                onClick={() => setSelectedApp(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="admin-finance-drawer__body">
                            {/* Status Control */}
                            <div className="admin-finance-drawer__status-box">
                                <label className="text-xs font-bold uppercase text-slate-500 block mb-2">
                                    Application Workflow Status
                                </label>
                                <select
                                    className="form-select font-bold text-sm"
                                    value={selectedApp.status}
                                    disabled={updatingStatus}
                                    onChange={e => handleStatusChange(selectedApp.id, e.target.value)}
                                >
                                    <option value="submitted">New Application (Submitted)</option>
                                    <option value="under_review">Under Review / Lender Proposal</option>
                                    <option value="approved">Approved</option>
                                    <option value="declined">Declined</option>
                                    <option value="completed">Settled / Completed</option>
                                </select>
                            </div>

                            {/* Section 1: Finance Summary */}
                            <div className="admin-finance-drawer__section">
                                <h3 className="admin-finance-drawer__section-title">Finance Proposal</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-slate-50 p-2.5 rounded">
                                        <span className="text-xs text-slate-500 block">Requested Amount</span>
                                        <strong className="text-base text-slate-900">£{Number(selectedApp.borrow_amount || 0).toLocaleString('en-GB')}</strong>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 rounded">
                                        <span className="text-xs text-slate-500 block">Term</span>
                                        <strong className="text-base text-slate-900">{selectedApp.term_years} Years ({selectedApp.term_years * 12} mo)</strong>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 rounded">
                                        <span className="text-xs text-slate-500 block">Estimated Monthly</span>
                                        <strong className="text-base text-green-700">£{Number(selectedApp.estimated_monthly || 0).toLocaleString('en-GB')}</strong>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 rounded">
                                        <span className="text-xs text-slate-500 block">Estimated APR</span>
                                        <strong className="text-base text-slate-900">{selectedApp.estimated_apr}%</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Personal Details */}
                            <div className="admin-finance-drawer__section">
                                <h3 className="admin-finance-drawer__section-title">Personal & Contact Info</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-500">Date of Birth:</span>
                                        <strong className="text-slate-900">{selectedApp.date_of_birth}</strong>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-500">Marital Status:</span>
                                        <strong className="text-slate-900">{selectedApp.marital_status || 'N/A'}</strong>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-500">Email:</span>
                                        <a href={`mailto:${selectedApp.email}`} className="text-[var(--color-accent)] font-semibold">{selectedApp.email}</a>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-500">Phone:</span>
                                        <a href={`tel:${selectedApp.phone}`} className="text-slate-900 font-bold">{selectedApp.phone}</a>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: 3-Year Address History */}
                            <div className="admin-finance-drawer__section">
                                <h3 className="admin-finance-drawer__section-title">3-Year Address History</h3>
                                <div className="space-y-2">
                                    {(selectedApp.addresses || []).map((addr, idx) => (
                                        <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded text-sm">
                                            <div className="font-bold text-xs text-slate-500 uppercase mb-1">
                                                {idx === 0 ? 'Current Address' : `Previous Address #${idx}`}
                                            </div>
                                            <div className="font-semibold text-slate-900">
                                                {addr.doorNumber} {addr.street}, {addr.town} {addr.postcode}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                Duration: {addr.years || 0} years {addr.months || 0} months
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section 4: Employment & Income */}
                            <div className="admin-finance-drawer__section">
                                <h3 className="admin-finance-drawer__section-title">Employment & Affordability</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-500">Status:</span>
                                        <strong className="text-slate-900">{selectedApp.employment_status || 'Employed'}</strong>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-500">Job Title:</span>
                                        <strong className="text-slate-900">{selectedApp.job_title}</strong>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-500">Employer:</span>
                                        <strong className="text-slate-900">{selectedApp.employer}</strong>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-500">Net Monthly Income:</span>
                                        <strong className="text-green-700 font-extrabold">£{Number(selectedApp.monthly_income || 0).toLocaleString('en-GB')} / mo</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Section 5: Decrypted Bank Underwriting Details */}
                            <div className="admin-finance-drawer__section">
                                <h3 className="admin-finance-drawer__section-title flex items-center justify-between">
                                    <span>Bank Details (Underwriting)</span>
                                    <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                                        🔒 Decrypted
                                    </span>
                                </h3>

                                {loadingDetails ? (
                                    <div className="text-xs text-slate-400 py-3 text-center">Decrypting credentials...</div>
                                ) : decryptedDetails ? (
                                    <div className="bg-slate-900 text-white p-3.5 rounded-lg text-sm space-y-2 font-mono">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Sort Code:</span>
                                            <span className="text-yellow-400 font-bold tracking-wider">
                                                {decryptedDetails.bank_sort_code}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Account Number:</span>
                                            <span className="text-yellow-400 font-bold tracking-wider">
                                                {decryptedDetails.bank_account_number}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-400">
                                        Sort Code: {selectedApp.bank_sort_code_masked} &bull; Account: {selectedApp.bank_account_number_masked}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Drawer Footer Actions */}
                        <div className="admin-finance-drawer__footer">
                            <button
                                type="button"
                                className="btn btn--outline btn--sm text-red-600 hover:bg-red-50 border-red-200"
                                onClick={() => handleDelete(selectedApp.id)}
                            >
                                Delete Proposal
                            </button>
                            <button
                                type="button"
                                className="btn btn--primary btn--sm"
                                onClick={() => setSelectedApp(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
