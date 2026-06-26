import { useState, useMemo } from 'react';
import { 
    getVehicleExpenses, 
    createVehicleExpense, 
    updateVehicleExpense, 
    deleteVehicleExpense,
    getMakes,
    getModelsByMake 
} from '../../../services/dataService';
import autotraderMakesModels from '../../../data/autotrader_makes_models.json';
import './ExpenseTracker.css';

const EXPENSE_TYPES = [
    "MOT",
    "Service",
    "Repairs",
    "Bodywork",
    "Valeting",
    "Tyres",
    "Transport",
    "Advertising",
    "Fuel",
    "Other"
];

const INITIAL_FORM_STATE = {
    make: '',
    model: '',
    customMake: '',
    customModel: '',
    registration: '',
    buyingPrice: '',
    status: 'In Stock',
    sellingPrice: '',
    expenses: [] // Array of { type, amount, date }
};

export default function ExpenseTracker() {
    // State
    const [records, setRecords] = useState(() => getVehicleExpenses());
    const [formState, setFormState] = useState(INITIAL_FORM_STATE);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    // Expense Input Form State
    const [expenseType, setExpenseType] = useState('Service');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [editingExpenseIdx, setEditingExpenseIdx] = useState(null);

    // Filter & Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMake, setFilterMake] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [dashboardFilter, setDashboardFilter] = useState('All');

    // Sorting State
    const [sortField, setSortField] = useState('date');
    const [sortDirection, setSortDirection] = useState('desc');

    // Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState(null);

    // View Details Modal State
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [detailsRecord, setDetailsRecord] = useState(null);

    // Mark Sold Modal State
    const [showMarkSoldModal, setShowMarkSoldModal] = useState(false);
    const [markSoldRecord, setMarkSoldRecord] = useState(null);
    const [quickSellingPrice, setQuickSellingPrice] = useState('');

    const refreshData = () => {
        setRecords(getVehicleExpenses());
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const renderSortIcon = (field) => {
        if (sortField !== field) {
            return <span className="sort-icon sort-icon--inactive">⇅</span>;
        }
        return sortDirection === 'asc' 
            ? <span className="sort-icon sort-icon--active">▲</span> 
            : <span className="sort-icon sort-icon--active">▼</span>;
    };

    // View Details Modal Handlers
    const handleViewDetails = (record) => {
        setDetailsRecord(record);
        setShowDetailsModal(true);
    };

    // Quick Mark Sold Handlers
    const handleQuickMarkSold = (record) => {
        setMarkSoldRecord(record);
        setQuickSellingPrice('');
        setShowMarkSoldModal(true);
    };

    const submitQuickMarkSold = (e) => {
        e.preventDefault();
        const price = parseFloat(quickSellingPrice);
        if (isNaN(price) || price < 0) {
            alert("Please enter a valid selling price.");
            return;
        }

        const totalExp = (markSoldRecord.expenses || []).reduce((sum, exp) => sum + exp.amount, 0);
        const totalCost = markSoldRecord.buying_price + totalExp;
        const profitLoss = price - totalCost;

        updateVehicleExpense(markSoldRecord.id, {
            ...markSoldRecord,
            status: 'Sold',
            selling_price: price,
            profit_loss: profitLoss
        });

        setShowMarkSoldModal(false);
        setMarkSoldRecord(null);
        setQuickSellingPrice('');
        refreshData();
    };

    // Derived lists for Dropdowns
    const systemMakes = useMemo(() => {
        try {
            const autotraderMakesList = Object.keys(autotraderMakesModels);
            const recordMakes = records.map(r => r.make);
            const allMakes = new Set([...autotraderMakesList, ...recordMakes]);
            return [...allMakes].sort();
        } catch (err) {
            console.error(err);
            return Object.keys(autotraderMakesModels).sort();
        }
    }, [records]);

    const availableModels = useMemo(() => {
        if (!formState.make || formState.make === 'Other') return [];
        let models = [];
        if (autotraderMakesModels[formState.make]) {
            models = [...autotraderMakesModels[formState.make]];
        }
        try {
            const recordModels = records
                .filter(r => r.make === formState.make)
                .map(r => r.model);
            models = [...new Set([...models, ...recordModels])];
        } catch (err) {
            console.error(err);
        }
        return models.sort();
    }, [formState.make, records]);

    // Handle Form Inputs
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Add / Update Expense in current form
    const handleAddExpense = () => {
        const amount = parseFloat(expenseAmount);
        if (isNaN(amount) || amount < 0) {
            alert("Please enter a valid non-negative expense amount.");
            return;
        }

        const dateStr = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        if (editingExpenseIdx !== null) {
            // Update existing expense
            setFormState(prev => {
                const updated = [...prev.expenses];
                updated[editingExpenseIdx] = {
                    type: expenseType,
                    amount: amount,
                    date: updated[editingExpenseIdx].date // keep original date
                };
                return { ...prev, expenses: updated };
            });
            setEditingExpenseIdx(null);
        } else {
            // Add new expense
            setFormState(prev => ({
                ...prev,
                expenses: [...prev.expenses, {
                    type: expenseType,
                    amount: amount,
                    date: dateStr
                }]
            }));
        }

        // Reset inputs
        setExpenseAmount('');
    };

    const handleEditExpense = (idx) => {
        const expense = formState.expenses[idx];
        setExpenseType(expense.type);
        setExpenseAmount(expense.amount);
        setEditingExpenseIdx(idx);
    };

    const handleDeleteExpense = (idx) => {
        setFormState(prev => ({
            ...prev,
            expenses: prev.expenses.filter((_, i) => i !== idx)
        }));
        if (editingExpenseIdx === idx) {
            setEditingExpenseIdx(null);
            setExpenseAmount('');
        }
    };

    // Live profit-loss calculations for the active form
    const formCalculations = useMemo(() => {
        const buying = parseFloat(formState.buyingPrice) || 0;
        const totalExpenses = formState.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalCost = buying + totalExpenses;
        const selling = formState.status === 'Sold' ? (parseFloat(formState.sellingPrice) || 0) : 0;
        const profitLoss = selling - totalCost;

        return {
            buying,
            totalExpenses,
            totalCost,
            selling,
            profitLoss
        };
    }, [formState.buyingPrice, formState.expenses, formState.status, formState.sellingPrice]);

    // Dashboard Statistics calculations
    const stats = useMemo(() => {
        const filteredForStats = records.filter(r => {
            if (dashboardFilter === 'Sold') return r.status === 'Sold';
            if (dashboardFilter === 'Unsold') return r.status === 'In Stock';
            return true;
        });

        const totalVehicles = filteredForStats.length;
        const soldVehicles = filteredForStats.filter(r => r.status === 'Sold').length;
        
        let totalBuyingPrice = 0;
        let totalExpenses = 0;
        let totalProfit = 0;
        let totalLoss = 0;

        filteredForStats.forEach(r => {
            // Purchase price
            totalBuyingPrice += parseFloat(r.buying_price || 0);

            // Sum vehicle expenses
            const vehicleExpenses = (r.expenses || []).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
            totalExpenses += vehicleExpenses;

            // Profit / loss summary (only include sold vehicles in profit/loss)
            if (r.status === 'Sold') {
                const pL = parseFloat(r.profit_loss || 0);
                if (pL > 0) {
                    totalProfit += pL;
                } else if (pL < 0) {
                    totalLoss += Math.abs(pL);
                }
            }
        });

        const totalCost = totalBuyingPrice + totalExpenses;

        return {
            totalVehicles,
            soldVehicles,
            totalExpenses,
            totalCost,
            totalProfit,
            totalLoss
        };
    }, [records, dashboardFilter]);

    // Handle Main Form Submit
    const handleFormSubmit = (e) => {
        e.preventDefault();

        // Validation
        const finalMake = formState.make === 'Other' ? formState.customMake.trim() : formState.make;
        const finalModel = formState.make === 'Other' ? formState.customModel.trim() : formState.model;

        if (!finalMake || !finalModel) {
            alert("Please specify a make and model.");
            return;
        }

        const buying = parseFloat(formState.buyingPrice);
        if (isNaN(buying) || buying < 0) {
            alert("Buying price is required and must be non-negative.");
            return;
        }

        const selling = formState.status === 'Sold' ? parseFloat(formState.sellingPrice) : 0;
        if (formState.status === 'Sold' && (isNaN(selling) || selling < 0)) {
            alert("Selling price is required when Sold and must be non-negative.");
            return;
        }

        const totalExpenses = formState.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalCost = buying + totalExpenses;
        const profitLoss = formState.status === 'Sold' ? (selling - totalCost) : -totalCost;

        const payload = {
            make: finalMake,
            model: finalModel,
            registration: formState.registration.trim().toUpperCase(),
            buying_price: buying,
            status: formState.status,
            selling_price: formState.status === 'Sold' ? selling : 0,
            profit_loss: profitLoss,
            expenses: formState.expenses
        };

        if (isEditing && editId) {
            updateVehicleExpense(editId, payload);
        } else {
            createVehicleExpense(payload);
        }

        // Reset
        setFormState(INITIAL_FORM_STATE);
        setIsEditing(false);
        setEditId(null);
        setEditingExpenseIdx(null);
        setExpenseAmount('');
        refreshData();
    };

    const handleCancelEdit = () => {
        setFormState(INITIAL_FORM_STATE);
        setIsEditing(false);
        setEditId(null);
        setEditingExpenseIdx(null);
        setExpenseAmount('');
    };

    // Load record for edit
    const handleEditRecord = (record) => {
        setIsEditing(true);
        setEditId(record.id);
        
        // Check if make is one of common/known makes
        const isCommonMake = systemMakes.includes(record.make);

        setFormState({
            make: isCommonMake ? record.make : 'Other',
            model: isCommonMake ? record.model : 'Other',
            customMake: isCommonMake ? '' : record.make,
            customModel: isCommonMake ? '' : record.model,
            registration: record.registration || '',
            buyingPrice: record.buying_price,
            status: record.status,
            sellingPrice: record.status === 'Sold' ? record.selling_price : '',
            expenses: record.expenses || []
        });
        
        // Scroll to form on mobile
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Delete flow
    const triggerDelete = (record) => {
        setRecordToDelete(record);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (recordToDelete) {
            deleteVehicleExpense(recordToDelete.id);
            setRecordToDelete(null);
            setShowDeleteModal(false);
            refreshData();
        }
    };

    // Unique makes list for table filtering
    const tableMakes = useMemo(() => {
        const makes = records.map(r => r.make);
        return ['All', ...new Set(makes)].sort();
    }, [records]);

    // Sorted and Filtered records for table display
    const sortedAndFilteredRecords = useMemo(() => {
        // 1. Filter
        const filtered = records.filter(r => {
            const matchesSearch = 
                r.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.registration && r.registration.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const matchesMake = filterMake === 'All' || r.make === filterMake;
            
            let matchesStatus = true;
            if (filterStatus === 'Sold') {
                matchesStatus = r.status === 'Sold';
            } else if (filterStatus === 'Unsold') {
                matchesStatus = r.status === 'In Stock';
            }

            return matchesSearch && matchesMake && matchesStatus;
        });

        // 2. Sort
        if (!sortField) return filtered;

        const getSortValue = (r) => {
            const totalExp = (r.expenses || []).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
            switch (sortField) {
                case 'registration':
                    return r.registration ? r.registration.toUpperCase() : '';
                case 'make':
                    return r.make.toLowerCase();
                case 'model':
                    return r.model.toLowerCase();
                case 'date':
                    return r.created_at ? new Date(r.created_at).getTime() : 0;
                case 'buying_price':
                    return parseFloat(r.buying_price || 0);
                case 'expenses':
                    return totalExp;
                case 'total_cost':
                    return parseFloat(r.buying_price || 0) + totalExp;
                case 'selling_price':
                    return parseFloat(r.selling_price || 0);
                case 'profit_loss':
                    return parseFloat(r.profit_loss || 0);
                case 'status':
                    return r.status.toLowerCase();
                default:
                    return 0;
            }
        };

        filtered.sort((a, b) => {
            const valA = getSortValue(a);
            const valB = getSortValue(b);

            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortDirection === 'asc' 
                    ? valA.localeCompare(valB) 
                    : valB.localeCompare(valA);
            } else {
                return sortDirection === 'asc' 
                    ? valA - valB 
                    : valB - valA;
            }
        });

        return filtered;
    }, [records, searchQuery, filterMake, filterStatus, sortField, sortDirection]);

    return (
        <div className="expense-tracker">
            <header className="expense-tracker__header">
                <h1>Vehicle Expense Tracker</h1>
                <p>Track purchase values, custom workshop expenses, and calculate vehicle profit margins.</p>
            </header>

            {/* Dashboard Statistics Header & Filter */}
            <div className="expense-tracker__stats-header">
                <h2>Dashboard Overview</h2>
                <div className="expense-tracker__stats-filter">
                    <label className="form-label">Filter Stats:</label>
                    <select 
                        value={dashboardFilter} 
                        onChange={(e) => setDashboardFilter(e.target.value)} 
                        className="form-select"
                    >
                        <option value="All">All Cars</option>
                        <option value="Sold">Sold Cars Only</option>
                        <option value="Unsold">Unsold Cars Only</option>
                    </select>
                </div>
            </div>

            {/* Dashboard Statistics */}
            <section className="expense-tracker__stats">
                <div className="expense-tracker__stat-card">
                    <span className="expense-tracker__stat-number">{stats.totalVehicles}</span>
                    <span className="expense-tracker__stat-label">Total Vehicles</span>
                </div>
                <div className="expense-tracker__stat-card">
                    <span className="expense-tracker__stat-number">{stats.soldVehicles}</span>
                    <span className="expense-tracker__stat-label">Vehicles Sold</span>
                </div>
                <div className="expense-tracker__stat-card">
                    <span className="expense-tracker__stat-number">£{stats.totalExpenses.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    <span className="expense-tracker__stat-label">Total Expenses</span>
                </div>
                <div className="expense-tracker__stat-card">
                    <span className="expense-tracker__stat-number">£{stats.totalCost.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    <span className="expense-tracker__stat-label">Total Cost</span>
                </div>
                <div className="expense-tracker__stat-card expense-tracker__stat-card--profit">
                    <span className="expense-tracker__stat-number">£{stats.totalProfit.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    <span className="expense-tracker__stat-label">Total Profit</span>
                </div>
                <div className="expense-tracker__stat-card expense-tracker__stat-card--loss">
                    <span className="expense-tracker__stat-number">£{stats.totalLoss.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    <span className="expense-tracker__stat-label">Total Loss</span>
                </div>
            </section>

            <div className="expense-tracker__layout">
                {/* Form Column */}
                <aside className="expense-tracker__form-container">
                    <div className="expense-tracker__card">
                        <h2>{isEditing ? 'Edit Vehicle Expense' : 'Track New Vehicle'}</h2>
                        <form onSubmit={handleFormSubmit} className="expense-tracker__form">
                            {/* Make / Model selection */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Make</label>
                                    <select 
                                        name="make" 
                                        value={formState.make} 
                                        onChange={handleInputChange} 
                                        className="form-select"
                                        required
                                    >
                                        <option value="">Select Make</option>
                                        {systemMakes.map(make => (
                                            <option key={make} value={make}>{make}</option>
                                        ))}
                                        <option value="Other">Other (Custom)</option>
                                    </select>
                                </div>

                                {formState.make !== 'Other' && (
                                    <div className="form-group">
                                        <label className="form-label">Model</label>
                                        <select 
                                            name="model" 
                                            value={formState.model} 
                                            onChange={handleInputChange} 
                                            className="form-select"
                                            required
                                            disabled={!formState.make}
                                        >
                                            <option value="">Select Model</option>
                                            {availableModels.map(model => (
                                                <option key={model} value={model}>{model}</option>
                                            ))}
                                            <option value="Other">Other (Custom)</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Custom Make/Model text fields if 'Other' selected */}
                            {(formState.make === 'Other' || formState.model === 'Other') && (
                                <div className="form-row animate-slide-up">
                                    {formState.make === 'Other' && (
                                        <div className="form-group">
                                            <label className="form-label">Custom Make</label>
                                            <input 
                                                type="text" 
                                                name="customMake" 
                                                value={formState.customMake} 
                                                onChange={handleInputChange} 
                                                placeholder="e.g. Aston Martin"
                                                className="form-input" 
                                                required 
                                            />
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label className="form-label">Custom Model</label>
                                        <input 
                                            type="text" 
                                            name="customModel" 
                                            value={formState.customModel} 
                                            onChange={handleInputChange} 
                                            placeholder="e.g. DB11"
                                            className="form-input" 
                                            required 
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Registration & Buying Price */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Registration Number</label>
                                    <input 
                                        type="text" 
                                        name="registration" 
                                        value={formState.registration} 
                                        onChange={(e) => {
                                            const val = e.target.value.toUpperCase();
                                            setFormState(prev => ({ ...prev, registration: val }));
                                        }} 
                                        placeholder="e.g. AB12 CDE"
                                        className="form-input" 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Buying Price (£)</label>
                                    <input 
                                        type="number" 
                                        name="buyingPrice" 
                                        value={formState.buyingPrice} 
                                        onChange={handleInputChange} 
                                        min="0"
                                        placeholder="e.g. 15000"
                                        className="form-input" 
                                        required 
                                    />
                                </div>
                            </div>

                            {/* Status & Conditional Selling Price */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select 
                                        name="status" 
                                        value={formState.status} 
                                        onChange={handleInputChange} 
                                        className="form-select"
                                    >
                                        <option value="In Stock">In Stock</option>
                                        <option value="Sold">Sold</option>
                                    </select>
                                </div>
                                {formState.status === 'Sold' ? (
                                    <div className="form-group animate-slide-down">
                                        <label className="form-label">Selling Price (£)</label>
                                        <input 
                                            type="number" 
                                            name="sellingPrice" 
                                            value={formState.sellingPrice} 
                                            onChange={handleInputChange} 
                                            min="0"
                                            placeholder="e.g. 18500"
                                            className="form-input" 
                                            required 
                                        />
                                    </div>
                                ) : (
                                    <div className="form-group" style={{ visibility: 'hidden' }} />
                                )}
                            </div>

                            <hr className="expense-tracker__divider" />

                            {/* Expense Sub-form */}
                            <div className="expense-tracker__expense-section">
                                <h3>Workshop & Reconditioning Expenses</h3>
                                
                                <div className="expense-tracker__expense-input-row">
                                    <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                                        <label className="form-label">Expense Type</label>
                                        <select 
                                            value={expenseType} 
                                            onChange={(e) => setExpenseType(e.target.value)} 
                                            className="form-select"
                                        >
                                            {EXPENSE_TYPES.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                                        <label className="form-label">Amount (£)</label>
                                        <input 
                                            type="number" 
                                            value={expenseAmount} 
                                            onChange={(e) => setExpenseAmount(e.target.value)} 
                                            min="0"
                                            placeholder="e.g. 250"
                                            className="form-input" 
                                        />
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={handleAddExpense} 
                                        className="btn btn--secondary expense-tracker__add-expense-btn"
                                    >
                                        {editingExpenseIdx !== null ? 'Save' : '+ Add'}
                                    </button>
                                </div>

                                {/* Temporary Expense List */}
                                {formState.expenses.length > 0 ? (
                                    <div className="expense-tracker__temp-table-container">
                                        <table className="expense-tracker__temp-table">
                                            <thead>
                                                <tr>
                                                    <th>Type</th>
                                                    <th>Amount</th>
                                                    <th>Date</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formState.expenses.map((exp, idx) => (
                                                    <tr key={idx}>
                                                        <td>{exp.type}</td>
                                                        <td>£{exp.amount.toLocaleString()}</td>
                                                        <td>{exp.date}</td>
                                                        <td>
                                                            <div className="expense-tracker__temp-actions">
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => handleEditExpense(idx)} 
                                                                    className="expense-tracker__text-btn"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => handleDeleteExpense(idx)} 
                                                                    className="expense-tracker__text-btn expense-tracker__text-btn--danger"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div className="expense-tracker__temp-total">
                                            <span>Total Expenses:</span>
                                            <strong>£{formCalculations.totalExpenses.toLocaleString()}</strong>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="expense-tracker__no-expenses">No reconditioning costs added yet.</p>
                                )}
                            </div>

                            <hr className="expense-tracker__divider" />

                            {/* Profit Calculation Summary Card */}
                            <div className="expense-tracker__calculations-summary">
                                <h4>Cost & Profit Summary</h4>
                                <div className="expense-tracker__calc-grid">
                                    <div className="expense-tracker__calc-item">
                                        <span>Buying Price</span>
                                        <strong>£{formCalculations.buying.toLocaleString()}</strong>
                                    </div>
                                    <div className="expense-tracker__calc-item">
                                        <span>Total Expenses</span>
                                        <strong>+ £{formCalculations.totalExpenses.toLocaleString()}</strong>
                                    </div>
                                    <div className="expense-tracker__calc-item expense-tracker__calc-item--total">
                                        <span>Total Cost</span>
                                        <strong>£{formCalculations.totalCost.toLocaleString()}</strong>
                                    </div>
                                    <div className="expense-tracker__calc-item">
                                        <span>Selling Price</span>
                                        <strong>{formState.status === 'Sold' ? `£${formCalculations.selling.toLocaleString()}` : '— (In Stock)'}</strong>
                                    </div>
                                    <div className={`expense-tracker__calc-item expense-tracker__calc-item--pL ${formState.status === 'Sold' ? (formCalculations.profitLoss >= 0 ? 'expense-tracker__calc-item--profit' : 'expense-tracker__calc-item--loss') : ''}`}>
                                        <span>Profit / Loss</span>
                                        <strong>
                                            {formState.status === 'Sold' 
                                                ? (formCalculations.profitLoss >= 0 ? `+£${formCalculations.profitLoss.toLocaleString()}` : `-£${Math.abs(formCalculations.profitLoss).toLocaleString()}`) 
                                                : '— (Pending Sale)'
                                            }
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            <div className="expense-tracker__form-actions">
                                {isEditing && (
                                    <button 
                                        type="button" 
                                        onClick={handleCancelEdit} 
                                        className="btn btn--outline"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button type="submit" className="btn btn--primary">
                                    {isEditing ? 'Update Vehicle Record' : 'Save Vehicle Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </aside>

                {/* Table Column */}
                <main className="expense-tracker__table-container">
                    <div className="expense-tracker__card">
                        <div className="expense-tracker__table-header">
                            <h2>Tracked Vehicles</h2>
                            <div className="expense-tracker__filters">
                                <input 
                                    type="text" 
                                    value={searchQuery} 
                                    onChange={(e) => setSearchQuery(e.target.value)} 
                                    placeholder="Search by Make, Model, or Reg..."
                                    className="form-input expense-tracker__search"
                                />
                                <select 
                                    value={filterMake} 
                                    onChange={(e) => setFilterMake(e.target.value)} 
                                    className="form-select expense-tracker__filter-select"
                                >
                                    <option value="All">All Makes</option>
                                    {tableMakes.filter(m => m !== 'All').map(make => (
                                        <option key={make} value={make}>{make}</option>
                                    ))}
                                </select>
                                <select 
                                    value={filterStatus} 
                                    onChange={(e) => setFilterStatus(e.target.value)} 
                                    className="form-select expense-tracker__filter-select"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Sold">Sold</option>
                                    <option value="Unsold">Unsold</option>
                                </select>
                            </div>
                        </div>

                        {sortedAndFilteredRecords.length > 0 ? (
                            <div className="expense-tracker__table-scroll">
                                <table className="expense-tracker__table">
                                    <thead>
                                        <tr>
                                            <th onClick={() => handleSort('registration')} style={{ cursor: 'pointer' }}>
                                                Registration {renderSortIcon('registration')}
                                            </th>
                                            <th onClick={() => handleSort('make')} style={{ cursor: 'pointer' }}>
                                                Make {renderSortIcon('make')}
                                            </th>
                                            <th onClick={() => handleSort('model')} style={{ cursor: 'pointer' }}>
                                                Model {renderSortIcon('model')}
                                            </th>
                                            <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                                                Date Added {renderSortIcon('date')}
                                            </th>
                                            <th onClick={() => handleSort('buying_price')} style={{ cursor: 'pointer' }}>
                                                Buying Price {renderSortIcon('buying_price')}
                                            </th>
                                            <th onClick={() => handleSort('expenses')} style={{ cursor: 'pointer' }}>
                                                Expenses {renderSortIcon('expenses')}
                                            </th>
                                            <th onClick={() => handleSort('total_cost')} style={{ cursor: 'pointer' }}>
                                                Total Cost {renderSortIcon('total_cost')}
                                            </th>
                                            <th onClick={() => handleSort('selling_price')} style={{ cursor: 'pointer' }}>
                                                Selling Price {renderSortIcon('selling_price')}
                                            </th>
                                            <th onClick={() => handleSort('profit_loss')} style={{ cursor: 'pointer' }}>
                                                Profit / Loss {renderSortIcon('profit_loss')}
                                            </th>
                                            <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                                                Status {renderSortIcon('status')}
                                            </th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedAndFilteredRecords.map(rec => {
                                            const totalExp = (rec.expenses || []).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
                                            const totalCost = parseFloat(rec.buying_price || 0) + totalExp;
                                            const pL = parseFloat(rec.profit_loss || 0);

                                            return (
                                                <tr key={rec.id}>
                                                    <td style={{ fontFamily: 'monospace', fontWeight: 'var(--font-weight-semibold)', textTransform: 'uppercase' }}>
                                                        {rec.registration ? rec.registration : '—'}
                                                    </td>
                                                    <td>{rec.make}</td>
                                                    <td>{rec.model}</td>
                                                    <td>
                                                        {rec.created_at ? new Date(rec.created_at).toLocaleDateString('en-GB') : '—'}
                                                    </td>
                                                    <td>£{parseFloat(rec.buying_price || 0).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                                    <td>£{totalExp.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                                    <td>£{totalCost.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                                    <td>
                                                        {rec.status === 'Sold' ? `£${parseFloat(rec.selling_price || 0).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '—'}
                                                    </td>
                                                    <td>
                                                        {rec.status === 'Sold' ? (
                                                            <span className={`expense-tracker__pL-badge ${pL >= 0 ? 'expense-tracker__pL-badge--profit' : 'expense-tracker__pL-badge--loss'}`}>
                                                                {pL >= 0 ? `+£${pL.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : `-£${Math.abs(pL).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                                                            </span>
                                                        ) : (
                                                            <span className="expense-tracker__pL-badge expense-tracker__pL-badge--pending">
                                                                Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={`expense-tracker__status-badge expense-tracker__status-badge--${rec.status.toLowerCase().replace(' ', '-')}`}>
                                                            {rec.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="expense-tracker__actions">
                                                            <button 
                                                                onClick={() => handleViewDetails(rec)} 
                                                                className="btn btn--sm btn--outline"
                                                                style={{ padding: '0.4rem 0.8rem' }}
                                                            >
                                                                View
                                                            </button>
                                                            <button 
                                                                onClick={() => handleEditRecord(rec)} 
                                                                className="btn btn--sm btn--secondary"
                                                                style={{ padding: '0.4rem 0.8rem' }}
                                                            >
                                                                Edit
                                                            </button>
                                                            {rec.status === 'In Stock' && (
                                                                <button 
                                                                    onClick={() => handleQuickMarkSold(rec)} 
                                                                    className="btn btn--sm btn--primary"
                                                                    style={{ padding: '0.4rem 0.8rem' }}
                                                                >
                                                                    Mark Sold
                                                                </button>
                                                            )}
                                                            <button 
                                                                onClick={() => triggerDelete(rec)} 
                                                                className="btn btn--sm btn--outline expense-tracker__delete-action"
                                                                style={{ padding: '0.4rem 0.8rem' }}
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
                            </div>
                        ) : (
                            <p className="expense-tracker__empty-records">No tracked vehicle records match your criteria.</p>
                        )}
                    </div>
                </main>
            </div>

            {/* Custom Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="expense-tracker__modal-overlay">
                    <div className="expense-tracker__modal">
                        <h3>Delete Expense Record</h3>
                        <p>Are you sure you want to delete the reconditioning and sales history for <strong>{recordToDelete?.make} {recordToDelete?.model}</strong>?</p>
                        <p className="expense-tracker__modal-warning">This action cannot be undone.</p>
                        <div className="expense-tracker__modal-actions">
                            <button 
                                onClick={() => setShowDeleteModal(false)} 
                                className="btn btn--outline"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete} 
                                className="btn btn--primary expense-tracker__modal-delete-btn"
                            >
                                Delete Record
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {showDetailsModal && detailsRecord && (
                <div className="expense-tracker__modal-overlay">
                    <div className="expense-tracker__modal expense-tracker__modal--large">
                        <h3>Vehicle Expense Details</h3>
                        <div className="expense-tracker__details-grid">
                            <div className="expense-tracker__details-item">
                                <span>Vehicle</span>
                                <strong>{detailsRecord.make} {detailsRecord.model}</strong>
                            </div>
                            {detailsRecord.registration && (
                                <div className="expense-tracker__details-item">
                                    <span>Registration</span>
                                    <strong style={{ fontFamily: 'monospace', color: 'var(--color-warning)' }}>{detailsRecord.registration}</strong>
                                </div>
                            )}
                            <div className="expense-tracker__details-item">
                                <span>Status</span>
                                <span className={`expense-tracker__status-badge expense-tracker__status-badge--${detailsRecord.status.toLowerCase().replace(' ', '-')}`}>
                                    {detailsRecord.status}
                                </span>
                            </div>
                            <div className="expense-tracker__details-item">
                                <span>Buying Price</span>
                                <strong>£{parseFloat(detailsRecord.buying_price).toLocaleString()}</strong>
                            </div>
                            <div className="expense-tracker__details-item">
                                <span>Total Expenses</span>
                                <strong>£{(detailsRecord.expenses || []).reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</strong>
                            </div>
                            <div className="expense-tracker__details-item">
                                <span>Total Cost</span>
                                <strong>£{(parseFloat(detailsRecord.buying_price) + (detailsRecord.expenses || []).reduce((sum, e) => sum + e.amount, 0)).toLocaleString()}</strong>
                            </div>
                            {detailsRecord.status === 'Sold' && (
                                <>
                                    <div className="expense-tracker__details-item">
                                        <span>Selling Price</span>
                                        <strong>£{parseFloat(detailsRecord.selling_price).toLocaleString()}</strong>
                                    </div>
                                    <div className="expense-tracker__details-item">
                                        <span>Profit / Loss</span>
                                        <span className={`expense-tracker__pL-badge ${parseFloat(detailsRecord.profit_loss) >= 0 ? 'expense-tracker__pL-badge--profit' : 'expense-tracker__pL-badge--loss'}`}>
                                            {parseFloat(detailsRecord.profit_loss) >= 0 ? `+£${parseFloat(detailsRecord.profit_loss).toLocaleString()}` : `-£${Math.abs(parseFloat(detailsRecord.profit_loss)).toLocaleString()}`}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="expense-tracker__details-expenses">
                            <h4>Workshop Expenses History</h4>
                            {(detailsRecord.expenses || []).length > 0 ? (
                                <table className="expense-tracker__temp-table">
                                    <thead>
                                        <tr>
                                            <th>Type</th>
                                            <th>Amount</th>
                                            <th>Date Added</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detailsRecord.expenses.map((exp, idx) => (
                                            <tr key={idx}>
                                                <td>{exp.type}</td>
                                                <td>£{exp.amount.toLocaleString()}</td>
                                                <td>{exp.date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="expense-tracker__no-expenses">No reconditioning costs recorded.</p>
                            )}
                        </div>

                        <div className="expense-tracker__modal-actions">
                            <button 
                                onClick={() => { setShowDetailsModal(false); setDetailsRecord(null); }} 
                                className="btn btn--primary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Mark Sold Modal */}
            {showMarkSoldModal && markSoldRecord && (
                <div className="expense-tracker__modal-overlay">
                    <div className="expense-tracker__modal">
                        <h3>Mark Vehicle as Sold</h3>
                        <p>Enter the final selling price for <strong>{markSoldRecord.make} {markSoldRecord.model}</strong> to calculate profitability.</p>
                        <form onSubmit={submitQuickMarkSold} className="expense-tracker__form">
                            <div className="form-group">
                                <label className="form-label">Selling Price (£)</label>
                                <input 
                                    type="number" 
                                    value={quickSellingPrice} 
                                    onChange={(e) => setQuickSellingPrice(e.target.value)} 
                                    min="0"
                                    placeholder="e.g. 19500"
                                    className="form-input" 
                                    required 
                                    autoFocus
                                />
                            </div>
                            <div className="expense-tracker__modal-actions">
                                <button 
                                    type="button" 
                                    onClick={() => { setShowMarkSoldModal(false); setMarkSoldRecord(null); }} 
                                    className="btn btn--outline"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn--primary"
                                >
                                    Mark Sold
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
