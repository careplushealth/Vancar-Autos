import { useState, useMemo } from 'react';
import {
    getGeneralExpenses,
    createGeneralExpense,
    updateGeneralExpense,
    deleteGeneralExpense
} from '../../../services/dataService';
import './GeneralExpenseTracker.css';

const GENERAL_EXPENSE_CATEGORIES = [
    'Rent',
    'Electricity',
    'Gas / Utilities',
    'Internet',
    'AutoTrader Subscription',
    'Marketing',
    'Office Supplies',
    'Staff Expenses',
    'Software Subscriptions',
    'Insurance',
    'Accountancy / Professional Fees',
    'Telephone',
    'Cleaning',
    'Maintenance & Repairs',
    'Training & Development',
    'Travel & Transport',
    'Bank Charges',
    'Miscellaneous',
];

const INITIAL_FORM = {
    category: GENERAL_EXPENSE_CATEGORIES[0],
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    notes: '',
    receipt_url: '',
};

const fmt = (n) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(n);

export default function GeneralExpenseTracker() {
    const [records, setRecords] = useState(() => getGeneralExpenses());
    const [form, setForm] = useState(INITIAL_FORM);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('All');

    // Sorting
    const [sortField, setSortField] = useState('date');
    const [sortDir, setSortDir] = useState('desc');

    // Modals
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const refreshData = () => setRecords(getGeneralExpenses());

    const flash = (msg) => {
        setSuccessMsg(msg);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const handleInput = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const amount = parseFloat(form.amount);
        if (isNaN(amount) || amount < 0) {
            alert('Please enter a valid amount.');
            return;
        }
        if (!form.date) {
            alert('Please enter a date.');
            return;
        }

        const payload = {
            category: form.category,
            amount,
            date: form.date,
            description: form.description.trim(),
            notes: form.notes.trim(),
            receipt_url: form.receipt_url.trim(),
        };

        if (isEditing && editId) {
            updateGeneralExpense(editId, payload);
            flash('Expense updated successfully!');
        } else {
            createGeneralExpense(payload);
            flash('Expense added successfully!');
        }

        setForm(INITIAL_FORM);
        setIsEditing(false);
        setEditId(null);
        refreshData();
    };

    const handleEdit = (record) => {
        setIsEditing(true);
        setEditId(record.id);
        setForm({
            category: record.category,
            amount: record.amount,
            date: record.date,
            description: record.description || '',
            notes: record.notes || '',
            receipt_url: record.receipt_url || '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setForm(INITIAL_FORM);
        setIsEditing(false);
        setEditId(null);
    };

    const triggerDelete = (record) => {
        setDeleteTarget(record);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (deleteTarget) {
            deleteGeneralExpense(deleteTarget.id);
            setDeleteTarget(null);
            setShowDeleteModal(false);
            refreshData();
            flash('Expense deleted.');
        }
    };

    const handleSort = (field) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    const sortIcon = (field) => {
        if (sortField !== field) return <span className="gen-sort-icon">⇅</span>;
        return sortDir === 'asc'
            ? <span className="gen-sort-icon gen-sort-icon--active">▲</span>
            : <span className="gen-sort-icon gen-sort-icon--active">▼</span>;
    };

    // Derived data
    const years = useMemo(() => {
        const ys = [...new Set(records.map(r => r.date?.slice(0, 4)).filter(Boolean))].sort().reverse();
        return ys;
    }, [records]);

    const filteredRecords = useMemo(() => {
        let list = records.filter(r => {
            const matchSearch =
                (r.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchCat = filterCategory === 'All' || r.category === filterCategory;
            const matchMonth = !filterMonth || (r.date || '').startsWith(filterMonth);
            const matchYear = filterYear === 'All' || (r.date || '').startsWith(filterYear);
            return matchSearch && matchCat && matchMonth && matchYear;
        });

        list.sort((a, b) => {
            let va = a[sortField] ?? '';
            let vb = b[sortField] ?? '';
            if (sortField === 'amount') { va = parseFloat(va) || 0; vb = parseFloat(vb) || 0; }
            if (sortField === 'date') { va = va || ''; vb = vb || ''; }
            if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
            return sortDir === 'asc' ? va - vb : vb - va;
        });

        return list;
    }, [records, searchQuery, filterCategory, filterMonth, filterYear, sortField, sortDir]);

    // Summary stats
    const stats = useMemo(() => {
        const total = filteredRecords.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
        const byCategory = {};
        filteredRecords.forEach(r => {
            byCategory[r.category] = (byCategory[r.category] || 0) + parseFloat(r.amount || 0);
        });
        const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

        // Monthly breakdown for current year
        const now = new Date();
        const thisYear = now.getFullYear().toString();
        const monthlyTotals = {};
        records
            .filter(r => (r.date || '').startsWith(thisYear))
            .forEach(r => {
                const month = r.date?.slice(0, 7);
                if (month) monthlyTotals[month] = (monthlyTotals[month] || 0) + parseFloat(r.amount || 0);
            });

        const ytd = records
            .filter(r => (r.date || '').startsWith(thisYear))
            .reduce((s, r) => s + parseFloat(r.amount || 0), 0);

        const thisMonth = now.toISOString().slice(0, 7);
        const monthTotal = monthlyTotals[thisMonth] || 0;

        return { total, topCategory, ytd, monthTotal, byCategory, count: filteredRecords.length };
    }, [filteredRecords, records]);

    // Export to CSV
    const exportCSV = () => {
        const headers = ['Date', 'Category', 'Amount (£)', 'Description', 'Notes', 'Receipt URL'];
        const rows = filteredRecords.map(r => [
            r.date || '',
            r.category || '',
            parseFloat(r.amount || 0).toFixed(2),
            (r.description || '').replace(/,/g, ';'),
            (r.notes || '').replace(/,/g, ';'),
            r.receipt_url || ''
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `general-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="gen-expense">
            {/* Success Toast */}
            {showSuccess && (
                <div className="gen-expense__toast">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    {successMsg}
                </div>
            )}

            <header className="gen-expense__header">
                <div>
                    <h1>General Expense Tracker</h1>
                    <p>Track business expenses not directly tied to vehicles — rent, utilities, subscriptions, and more.</p>
                </div>
                <button className="gen-expense__export-btn" onClick={exportCSV}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Export CSV
                </button>
            </header>

            {/* KPI Summary Cards */}
            <section className="gen-expense__kpi-grid">
                <div className="gen-expense__kpi-card">
                    <div className="gen-expense__kpi-icon gen-expense__kpi-icon--green">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                    </div>
                    <div>
                        <span className="gen-expense__kpi-label">Filtered Total</span>
                        <span className="gen-expense__kpi-value">{fmt(stats.total)}</span>
                    </div>
                </div>
                <div className="gen-expense__kpi-card">
                    <div className="gen-expense__kpi-icon gen-expense__kpi-icon--blue">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    </div>
                    <div>
                        <span className="gen-expense__kpi-label">This Month</span>
                        <span className="gen-expense__kpi-value">{fmt(stats.monthTotal)}</span>
                    </div>
                </div>
                <div className="gen-expense__kpi-card">
                    <div className="gen-expense__kpi-icon gen-expense__kpi-icon--amber">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                    </div>
                    <div>
                        <span className="gen-expense__kpi-label">Year-to-Date</span>
                        <span className="gen-expense__kpi-value">{fmt(stats.ytd)}</span>
                    </div>
                </div>
                <div className="gen-expense__kpi-card">
                    <div className="gen-expense__kpi-icon gen-expense__kpi-icon--purple">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                    </div>
                    <div>
                        <span className="gen-expense__kpi-label">Top Category</span>
                        <span className="gen-expense__kpi-value gen-expense__kpi-value--sm">{stats.topCategory ? stats.topCategory[0] : '—'}</span>
                    </div>
                </div>
            </section>

            <div className="gen-expense__layout">
                {/* Left: Add/Edit Form */}
                <aside className="gen-expense__form-panel">
                    <div className="gen-expense__form-card">
                        <h2 className="gen-expense__form-title">
                            {isEditing ? '✏️ Edit Expense' : '＋ Add Expense'}
                        </h2>

                        <form onSubmit={handleSubmit} className="gen-expense__form">
                            <div className="gen-expense__field">
                                <label className="gen-expense__label">Category</label>
                                <select name="category" value={form.category} onChange={handleInput} className="gen-expense__select" required>
                                    {GENERAL_EXPENSE_CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="gen-expense__field">
                                <label className="gen-expense__label">Amount (£)</label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={form.amount}
                                    onChange={handleInput}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="gen-expense__input"
                                    required
                                />
                            </div>

                            <div className="gen-expense__field">
                                <label className="gen-expense__label">Date</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={form.date}
                                    onChange={handleInput}
                                    className="gen-expense__input"
                                    required
                                />
                            </div>

                            <div className="gen-expense__field">
                                <label className="gen-expense__label">Description</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={form.description}
                                    onChange={handleInput}
                                    placeholder="e.g. Monthly rent payment"
                                    className="gen-expense__input"
                                />
                            </div>

                            <div className="gen-expense__field">
                                <label className="gen-expense__label">Notes</label>
                                <textarea
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleInput}
                                    placeholder="Any additional notes..."
                                    className="gen-expense__textarea"
                                    rows="3"
                                />
                            </div>

                            <div className="gen-expense__field">
                                <label className="gen-expense__label">Receipt / Document URL</label>
                                <input
                                    type="url"
                                    name="receipt_url"
                                    value={form.receipt_url}
                                    onChange={handleInput}
                                    placeholder="https://..."
                                    className="gen-expense__input"
                                />
                            </div>

                            <div className="gen-expense__form-actions">
                                <button type="submit" className="gen-expense__btn-primary">
                                    {isEditing ? 'Update Expense' : 'Add Expense'}
                                </button>
                                {isEditing && (
                                    <button type="button" className="gen-expense__btn-ghost" onClick={handleCancelEdit}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Category Breakdown */}
                    {Object.keys(stats.byCategory).length > 0 && (
                        <div className="gen-expense__breakdown-card">
                            <h3 className="gen-expense__breakdown-title">Category Breakdown</h3>
                            <div className="gen-expense__breakdown-list">
                                {Object.entries(stats.byCategory)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([cat, amt]) => (
                                        <div key={cat} className="gen-expense__breakdown-row">
                                            <span className="gen-expense__breakdown-cat">{cat}</span>
                                            <span className="gen-expense__breakdown-amt">{fmt(amt)}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </aside>

                {/* Right: Records Table */}
                <div className="gen-expense__main">
                    {/* Filters */}
                    <div className="gen-expense__filters">
                        <input
                            type="text"
                            placeholder="Search expenses..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="gen-expense__search"
                        />
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="gen-expense__filter-select">
                            <option value="All">All Categories</option>
                            {GENERAL_EXPENSE_CATEGORIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="gen-expense__filter-select">
                            <option value="All">All Years</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <input
                            type="month"
                            value={filterMonth}
                            onChange={e => setFilterMonth(e.target.value)}
                            className="gen-expense__filter-select"
                            placeholder="Filter by month"
                        />
                        {(searchQuery || filterCategory !== 'All' || filterMonth || filterYear !== 'All') && (
                            <button className="gen-expense__clear-btn" onClick={() => {
                                setSearchQuery(''); setFilterCategory('All'); setFilterMonth(''); setFilterYear('All');
                            }}>
                                Clear Filters
                            </button>
                        )}
                    </div>

                    <div className="gen-expense__table-meta">
                        <span>{stats.count} record{stats.count !== 1 ? 's' : ''}</span>
                        <span className="gen-expense__table-total">Total: <strong>{fmt(stats.total)}</strong></span>
                    </div>

                    {filteredRecords.length === 0 ? (
                        <div className="gen-expense__empty">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                            <p>No expenses found. Add one using the form.</p>
                        </div>
                    ) : (
                        <div className="gen-expense__table-wrap">
                            <table className="gen-expense__table">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('date')} className="gen-expense__th gen-expense__th--sortable">
                                            Date {sortIcon('date')}
                                        </th>
                                        <th onClick={() => handleSort('category')} className="gen-expense__th gen-expense__th--sortable">
                                            Category {sortIcon('category')}
                                        </th>
                                        <th className="gen-expense__th">Description</th>
                                        <th onClick={() => handleSort('amount')} className="gen-expense__th gen-expense__th--sortable gen-expense__th--right">
                                            Amount {sortIcon('amount')}
                                        </th>
                                        <th className="gen-expense__th">Receipt</th>
                                        <th className="gen-expense__th gen-expense__th--center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.map(r => (
                                        <tr key={r.id} className={`gen-expense__tr ${editId === r.id ? 'gen-expense__tr--editing' : ''}`}>
                                            <td className="gen-expense__td">
                                                <span className="gen-expense__date-badge">
                                                    {r.date ? new Date(r.date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                </span>
                                            </td>
                                            <td className="gen-expense__td">
                                                <span className="gen-expense__cat-badge">{r.category}</span>
                                            </td>
                                            <td className="gen-expense__td">
                                                <span className="gen-expense__desc">{r.description || '—'}</span>
                                                {r.notes && <span className="gen-expense__notes">{r.notes}</span>}
                                            </td>
                                            <td className="gen-expense__td gen-expense__td--right">
                                                <strong className="gen-expense__amount">{fmt(r.amount)}</strong>
                                            </td>
                                            <td className="gen-expense__td">
                                                {r.receipt_url ? (
                                                    <a href={r.receipt_url} target="_blank" rel="noopener noreferrer" className="gen-expense__receipt-link">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                                        View
                                                    </a>
                                                ) : <span className="gen-expense__no-receipt">—</span>}
                                            </td>
                                            <td className="gen-expense__td gen-expense__td--center">
                                                <div className="gen-expense__actions">
                                                    <button className="gen-expense__action-btn gen-expense__action-btn--edit" onClick={() => handleEdit(r)} title="Edit">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                    </button>
                                                    <button className="gen-expense__action-btn gen-expense__action-btn--delete" onClick={() => triggerDelete(r)} title="Delete">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan="3" className="gen-expense__td gen-expense__tfoot-label">
                                            Total ({stats.count} items)
                                        </td>
                                        <td className="gen-expense__td gen-expense__td--right gen-expense__tfoot-total">
                                            {fmt(stats.total)}
                                        </td>
                                        <td colSpan="2" />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirm Modal */}
            {showDeleteModal && (
                <div className="gen-expense__modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="gen-expense__modal" onClick={e => e.stopPropagation()}>
                        <div className="gen-expense__modal-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        </div>
                        <h3>Delete Expense?</h3>
                        <p>Are you sure you want to delete the <strong>{deleteTarget?.category}</strong> expense of <strong>{fmt(deleteTarget?.amount || 0)}</strong>?</p>
                        <div className="gen-expense__modal-actions">
                            <button className="gen-expense__btn-danger" onClick={confirmDelete}>Delete</button>
                            <button className="gen-expense__btn-ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
