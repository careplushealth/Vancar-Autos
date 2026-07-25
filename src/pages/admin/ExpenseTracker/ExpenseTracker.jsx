import { useState, useMemo } from 'react';
import { 
    getVehicleExpenses, 
    createVehicleExpense, 
    updateVehicleExpense, 
    deleteVehicleExpense
} from '../../../services/dataService';
import autotraderMakesModels from '../../../data/autotrader_makes_models.json';
import { normalizeMake, deduplicateMakes } from '../../../utils/makeUtils';
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
    vat_scheme: 'VAT Margin',
    expenses: [] // Array of { type, amount, date, description, calculateVat, netAmount, vatAmount }
};

const fmt = (n) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(n || 0);

const fmtInt = (n) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);

export default function ExpenseTracker() {
    // State
    const [records, setRecords] = useState(() => getVehicleExpenses());
    const [formState, setFormState] = useState(INITIAL_FORM_STATE);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    // Expense Input Form State
    const [expenseType, setExpenseType] = useState('Service');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [expenseDescription, setExpenseDescription] = useState('');
    const [expenseCalculateVat, setExpenseCalculateVat] = useState(false);
    const [editingExpenseIdx, setEditingExpenseIdx] = useState(null);

    // Filter & Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMake, setFilterMake] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterVatScheme, setFilterVatScheme] = useState('All');
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

        const totalGrossExp = (markSoldRecord.expenses || []).reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
        const totalNetExp = (markSoldRecord.expenses || []).reduce((sum, exp) => sum + parseFloat(exp.netAmount ?? exp.amount ?? 0), 0);
        const scheme = markSoldRecord.vat_scheme || 'VAT Margin';
        const buying = parseFloat(markSoldRecord.buying_price || 0);

        let outputVat = 0;
        if (scheme === 'VAT Commercial') {
            outputVat = price * 0.20;
        } else {
            const marginProfit = price - buying - totalNetExp;
            outputVat = marginProfit > 0 ? marginProfit * (1 / 6) : 0;
        }

        const profitLoss = price - buying - totalNetExp - outputVat;

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

    // Derived lists for Dropdowns with deduplication and standardization
    const systemMakes = useMemo(() => {
        try {
            const autotraderMakesList = Object.keys(autotraderMakesModels);
            const recordMakes = records.map(r => r.make);
            return deduplicateMakes([...autotraderMakesList, ...recordMakes]);
        } catch (err) {
            console.error(err);
            return deduplicateMakes(Object.keys(autotraderMakesModels));
        }
    }, [records]);

    const availableModels = useMemo(() => {
        if (!formState.make || formState.make === 'Other') return [];
        let models = [];
        const normFormMake = normalizeMake(formState.make);

        // Check autotrader dataset case-insensitively
        const matchKey = Object.keys(autotraderMakesModels).find(k => k.toLowerCase() === normFormMake.toLowerCase());
        if (matchKey && autotraderMakesModels[matchKey]) {
            models = [...autotraderMakesModels[matchKey]];
        }
        try {
            const recordModels = records
                .filter(r => normalizeMake(r.make) === normFormMake)
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

        if (!expenseDate) {
            alert("Please enter a valid expense date.");
            return;
        }

        const calculateVat = expenseCalculateVat;
        const vatAmount = calculateVat ? amount * 0.20 : 0;
        const netAmount = amount;
        const grossAmount = calculateVat ? amount * 1.20 : amount;

        const expenseItem = {
            type: expenseType,
            amount: amount,
            date: expenseDate,
            description: expenseDescription.trim(),
            calculateVat,
            vatAmount,
            netAmount,
            grossAmount
        };

        if (editingExpenseIdx !== null) {
            // Update existing expense
            setFormState(prev => {
                const updated = [...prev.expenses];
                updated[editingExpenseIdx] = expenseItem;
                return { ...prev, expenses: updated };
            });
            setEditingExpenseIdx(null);
        } else {
            // Add new expense
            setFormState(prev => ({
                ...prev,
                expenses: [...prev.expenses, expenseItem]
            }));
        }

        // Reset inputs
        setExpenseAmount('');
        setExpenseDescription('');
        setExpenseCalculateVat(false);
        setExpenseDate(new Date().toISOString().slice(0, 10));
    };

    const handleEditExpense = (idx) => {
        const exp = formState.expenses[idx];
        setExpenseType(exp.type);
        setExpenseAmount(exp.amount);
        setExpenseDate(exp.date || new Date().toISOString().slice(0, 10));
        setExpenseDescription(exp.description || '');
        setExpenseCalculateVat(!!exp.calculateVat);
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
            setExpenseDescription('');
            setExpenseCalculateVat(false);
            setExpenseDate(new Date().toISOString().slice(0, 10));
        }
    };

    // Live profit-loss and VAT calculations for the active form
    const formCalculations = useMemo(() => {
        const buying = parseFloat(formState.buyingPrice) || 0;
        const totalGrossExpenses = formState.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
        const totalVatReclaimable = formState.expenses.reduce((sum, exp) => sum + parseFloat(exp.vatAmount || 0), 0);
        const totalNetExpenses = totalGrossExpenses - totalVatReclaimable;
        const totalCost = buying + totalGrossExpenses;
        const selling = formState.status === 'Sold' ? (parseFloat(formState.sellingPrice) || 0) : 0;

        let outputVat = 0;
        if (formState.status === 'Sold') {
            if (formState.vat_scheme === 'VAT Commercial') {
                outputVat = selling * 0.20;
            } else {
                const marginProfit = selling - buying - totalNetExpenses;
                outputVat = marginProfit > 0 ? marginProfit * (1 / 6) : 0;
            }
        }

        const netProfitLoss = formState.status === 'Sold' ? (selling - buying - totalNetExpenses - outputVat) : -totalCost;

        return {
            buying,
            totalGrossExpenses,
            totalNetExpenses,
            totalVatReclaimable,
            totalCost,
            selling,
            outputVat,
            netProfitLoss
        };
    }, [formState.buyingPrice, formState.expenses, formState.status, formState.sellingPrice, formState.vat_scheme]);

    // Dashboard Statistics calculations with VAT and scheme metrics
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
        let totalVatReclaimed = 0;
        let totalOutputVatMargin = 0;
        let totalOutputVatCommercial = 0;
        let totalProfit = 0;
        let totalLoss = 0;

        filteredForStats.forEach(r => {
            totalBuyingPrice += parseFloat(r.buying_price || 0);

            (r.expenses || []).forEach(e => {
                const net = parseFloat(e.netAmount ?? e.amount ?? 0);
                const vat = e.vatAmount !== undefined ? parseFloat(e.vatAmount || 0) : (e.calculateVat ? net * 0.20 : 0);
                const gross = e.grossAmount !== undefined ? parseFloat(e.grossAmount || 0) : (net + vat);
                totalExpenses += gross;
                totalVatReclaimed += vat;
            });

            if (r.status === 'Sold') {
                const selling = parseFloat(r.selling_price || 0);
                const buying = parseFloat(r.buying_price || 0);
                const netExp = (r.expenses || []).reduce((s, e) => s + parseFloat(e.netAmount ?? e.amount ?? 0), 0);
                const scheme = r.vat_scheme || 'VAT Margin';

                let outVat = 0;
                if (scheme === 'VAT Commercial') {
                    outVat = selling * 0.20;
                    totalOutputVatCommercial += outVat;
                } else {
                    const margin = selling - buying - netExp;
                    outVat = margin > 0 ? margin * (1 / 6) : 0;
                    totalOutputVatMargin += outVat;
                }

                const pL = selling - buying - netExp - outVat;
                if (pL > 0) {
                    totalProfit += pL;
                } else if (pL < 0) {
                    totalLoss += Math.abs(pL);
                }
            }
        });

        const totalCost = totalBuyingPrice + totalExpenses;
        const totalOutputVat = totalOutputVatMargin + totalOutputVatCommercial;
        const netVatPayable = totalOutputVat - totalVatReclaimed;

        return {
            totalVehicles,
            soldVehicles,
            totalExpenses,
            totalVatReclaimed,
            totalOutputVatMargin,
            totalOutputVatCommercial,
            totalOutputVat,
            netVatPayable,
            totalCost,
            totalProfit,
            totalLoss
        };
    }, [records, dashboardFilter]);

    // Handle Main Form Submit
    const handleFormSubmit = (e) => {
        e.preventDefault();

        const rawMake = formState.make === 'Other' ? formState.customMake : formState.make;
        const finalMake = normalizeMake(rawMake);
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

        const totalNetExp = formState.expenses.reduce((sum, exp) => sum + parseFloat(exp.netAmount ?? exp.amount ?? 0), 0);
        const totalGrossExp = formState.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
        const totalCost = buying + totalGrossExp;

        let outputVat = 0;
        if (formState.status === 'Sold') {
            if (formState.vat_scheme === 'VAT Commercial') {
                outputVat = selling * 0.20;
            } else {
                const marginProfit = selling - buying - totalNetExp;
                outputVat = marginProfit > 0 ? marginProfit * (1 / 6) : 0;
            }
        }

        const profitLoss = formState.status === 'Sold' ? (selling - buying - totalNetExp - outputVat) : -totalCost;

        const payload = {
            make: finalMake,
            model: finalModel,
            registration: formState.registration.trim().toUpperCase(),
            buying_price: buying,
            status: formState.status,
            selling_price: formState.status === 'Sold' ? selling : 0,
            vat_scheme: formState.vat_scheme,
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
        setExpenseDescription('');
        setExpenseCalculateVat(false);
        setExpenseDate(new Date().toISOString().slice(0, 10));
        refreshData();
    };

    const handleCancelEdit = () => {
        setFormState(INITIAL_FORM_STATE);
        setIsEditing(false);
        setEditId(null);
        setEditingExpenseIdx(null);
        setExpenseAmount('');
        setExpenseDescription('');
        setExpenseCalculateVat(false);
        setExpenseDate(new Date().toISOString().slice(0, 10));
    };

    // Load record for edit
    const handleEditRecord = (record) => {
        setIsEditing(true);
        setEditId(record.id);
        
        const normRecordMake = normalizeMake(record.make);
        const isKnown = systemMakes.includes(normRecordMake);

        setFormState({
            make: isKnown ? normRecordMake : 'Other',
            model: isKnown ? record.model : 'Other',
            customMake: isKnown ? '' : normRecordMake,
            customModel: isKnown ? '' : record.model,
            registration: record.registration || '',
            buyingPrice: record.buying_price,
            status: record.status,
            sellingPrice: record.status === 'Sold' ? record.selling_price : '',
            vat_scheme: record.vat_scheme || 'VAT Margin',
            expenses: (record.expenses || []).map(e => ({
                ...e,
                date: e.date || (record.created_at ? record.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
                description: e.description || '',
                calculateVat: !!e.calculateVat,
                vatAmount: e.vatAmount !== undefined ? e.vatAmount : (e.calculateVat ? parseFloat(e.amount || 0) * 0.20 : 0),
                netAmount: e.netAmount !== undefined ? e.netAmount : parseFloat(e.amount || 0),
                grossAmount: e.grossAmount !== undefined ? e.grossAmount : (e.calculateVat ? parseFloat(e.amount || 0) * 1.20 : parseFloat(e.amount || 0))
            }))
        });
        
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

    // Unique standardized makes list for table filtering
    const tableMakes = useMemo(() => {
        const makes = records.map(r => normalizeMake(r.make));
        return ['All', ...deduplicateMakes(makes)];
    }, [records]);

    // Sorted and Filtered records for table display
    const sortedAndFilteredRecords = useMemo(() => {
        // 1. Filter
        const filtered = records.filter(r => {
            const normMake = normalizeMake(r.make);
            const matchesSearch = 
                normMake.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.registration && r.registration.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const matchesMake = filterMake === 'All' || normMake === filterMake;
            
            let matchesStatus = true;
            if (filterStatus === 'Sold') {
                matchesStatus = r.status === 'Sold';
            } else if (filterStatus === 'Unsold') {
                matchesStatus = r.status === 'In Stock';
            }

            const matchesVatScheme = filterVatScheme === 'All' || (r.vat_scheme || 'VAT Margin') === filterVatScheme;

            return matchesSearch && matchesMake && matchesStatus && matchesVatScheme;
        });

        // 2. Sort
        if (!sortField) return filtered;

        const getSortValue = (r) => {
            const totalExp = (r.expenses || []).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
            switch (sortField) {
                case 'registration':
                    return r.registration ? r.registration.toUpperCase() : '';
                case 'make':
                    return normalizeMake(r.make).toLowerCase();
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
                case 'vat_scheme':
                    return (r.vat_scheme || 'VAT Margin').toLowerCase();
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
    }, [records, searchQuery, filterMake, filterStatus, filterVatScheme, sortField, sortDirection]);

    return (
        <div className="expense-tracker">
            <header className="expense-tracker__header">
                <h1>Vehicle Expense Tracker</h1>
                <p>Track purchase values, workshop expenses, VAT Margin & Commercial schemes, and calculate net vehicle profitability.</p>
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
                    <span className="expense-tracker__stat-number">{fmtInt(stats.totalExpenses)}</span>
                    <span className="expense-tracker__stat-label">Gross Expenses</span>
                </div>
                <div className="expense-tracker__stat-card">
                    <span className="expense-tracker__stat-number" style={{ color: '#55A01F' }}>{fmtInt(stats.totalVatReclaimed)}</span>
                    <span className="expense-tracker__stat-label">Reclaimable Expense VAT</span>
                </div>
                <div className="expense-tracker__stat-card">
                    <span className="expense-tracker__stat-number" style={{ color: '#3b82f6' }}>{fmtInt(stats.totalOutputVat)}</span>
                    <span className="expense-tracker__stat-label">Total Output VAT (Sales)</span>
                </div>
                <div className="expense-tracker__stat-card">
                    <span className="expense-tracker__stat-number">{fmtInt(stats.totalCost)}</span>
                    <span className="expense-tracker__stat-label">Total Cost</span>
                </div>
                <div className="expense-tracker__stat-card expense-tracker__stat-card--profit">
                    <span className="expense-tracker__stat-number">{fmtInt(stats.totalProfit)}</span>
                    <span className="expense-tracker__stat-label">Net Profit</span>
                </div>
                <div className="expense-tracker__stat-card expense-tracker__stat-card--loss">
                    <span className="expense-tracker__stat-number">{fmtInt(stats.totalLoss)}</span>
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
                                        step="0.01"
                                        placeholder="e.g. 15000"
                                        className="form-input" 
                                        required 
                                    />
                                </div>
                            </div>

                            {/* VAT Scheme & Status */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">VAT Scheme</label>
                                    <select
                                        name="vat_scheme"
                                        value={formState.vat_scheme}
                                        onChange={handleInputChange}
                                        className="form-select"
                                    >
                                        <option value="VAT Margin">VAT Margin (1/6 Profit)</option>
                                        <option value="VAT Commercial">VAT Commercial (20% Sale)</option>
                                    </select>
                                </div>
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
                            </div>

                            {/* Conditional Selling Price */}
                            {formState.status === 'Sold' && (
                                <div className="form-row animate-slide-down">
                                    <div className="form-group">
                                        <label className="form-label">Selling Price (£)</label>
                                        <input 
                                            type="number" 
                                            name="sellingPrice" 
                                            value={formState.sellingPrice} 
                                            onChange={handleInputChange} 
                                            min="0"
                                            step="0.01"
                                            placeholder="e.g. 18500"
                                            className="form-input" 
                                            required 
                                        />
                                    </div>
                                </div>
                            )}

                            <hr className="expense-tracker__divider" />

                            {/* Expense Sub-form */}
                            <div className="expense-tracker__expense-section">
                                <h3>Workshop & Reconditioning Expenses</h3>
                                
                                <div className="expense-tracker__expense-grid">
                                    <div className="form-group">
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
                                    <div className="form-group">
                                        <label className="form-label">Expense Amount (£)</label>
                                        <input 
                                            type="number" 
                                            value={expenseAmount} 
                                            onChange={(e) => setExpenseAmount(e.target.value)} 
                                            min="0"
                                            step="0.01"
                                            placeholder="e.g. 120"
                                            className="form-input" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Expense Date</label>
                                        <input 
                                            type="date" 
                                            value={expenseDate} 
                                            onChange={(e) => setExpenseDate(e.target.value)} 
                                            className="form-input" 
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">Description / Notes</label>
                                        <input 
                                            type="text" 
                                            value={expenseDescription} 
                                            onChange={(e) => setExpenseDescription(e.target.value)} 
                                            placeholder="e.g. New front brake pads"
                                            className="form-input" 
                                        />
                                    </div>
                                    <div className="form-group form-group--checkbox" style={{ gridColumn: 'span 2' }}>
                                        <label className="expense-tracker__checkbox-label">
                                            <input 
                                                type="checkbox" 
                                                checked={expenseCalculateVat} 
                                                onChange={(e) => setExpenseCalculateVat(e.target.checked)} 
                                            />
                                            Calculate VAT (20%) — Reclaimable Input VAT (£{(parseFloat(expenseAmount) * 0.20 || 0).toFixed(2)})
                                        </label>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={handleAddExpense} 
                                    className="btn btn--secondary expense-tracker__add-expense-btn"
                                    style={{ marginTop: '0.75rem', width: '100%' }}
                                >
                                    {editingExpenseIdx !== null ? 'Update Expense Entry' : '+ Add Expense Entry'}
                                </button>

                                {/* Temporary Expense List */}
                                {formState.expenses.length > 0 ? (
                                    <div className="expense-tracker__temp-table-container" style={{ marginTop: '1.25rem' }}>
                                        <table className="expense-tracker__temp-table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Type</th>
                                                    <th>Description</th>
                                                    <th>Net</th>
                                                    <th>VAT</th>
                                                    <th>Gross</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formState.expenses.map((exp, idx) => (
                                                    <tr key={idx}>
                                                        <td>{exp.date}</td>
                                                        <td><strong>{exp.type}</strong></td>
                                                        <td>{exp.description || '—'}</td>
                                                        <td>{fmt(exp.netAmount ?? exp.amount)}</td>
                                                        <td>{exp.calculateVat ? <span className="expense-tracker__vat-badge">{fmt(exp.vatAmount ?? (exp.amount * 0.20))}</span> : '£0.00'}</td>
                                                        <td><strong>{fmt(exp.grossAmount ?? (exp.calculateVat ? exp.amount * 1.20 : exp.amount))}</strong></td>
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
                                            <span>Gross Expenses: <strong>{fmt(formCalculations.totalGrossExpenses)}</strong></span>
                                            <span style={{ color: '#55A01F' }}>Reclaimable VAT: <strong>{fmt(formCalculations.totalVatReclaimable)}</strong></span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="expense-tracker__no-expenses">No reconditioning costs added yet.</p>
                                )}
                            </div>

                            <hr className="expense-tracker__divider" />

                            {/* Profit Calculation Summary Card */}
                            <div className="expense-tracker__calculations-summary">
                                <h4>Cost & Profit Summary ({formState.vat_scheme})</h4>
                                <div className="expense-tracker__calc-grid">
                                    <div className="expense-tracker__calc-item">
                                        <span>Buying Price</span>
                                        <strong>{fmt(formCalculations.buying)}</strong>
                                    </div>
                                    <div className="expense-tracker__calc-item">
                                        <span>Gross Expenses</span>
                                        <strong>+ {fmt(formCalculations.totalGrossExpenses)}</strong>
                                    </div>
                                    <div className="expense-tracker__calc-item">
                                        <span>Expense VAT Reclaim</span>
                                        <strong style={{ color: '#55A01F' }}>- {fmt(formCalculations.totalVatReclaimable)}</strong>
                                    </div>
                                    <div className="expense-tracker__calc-item expense-tracker__calc-item--total">
                                        <span>Total Gross Cost</span>
                                        <strong>{fmt(formCalculations.totalCost)}</strong>
                                    </div>
                                    <div className="expense-tracker__calc-item">
                                        <span>Selling Price</span>
                                        <strong>{formState.status === 'Sold' ? fmt(formCalculations.selling) : '— (In Stock)'}</strong>
                                    </div>
                                    {formState.status === 'Sold' && (
                                        <div className="expense-tracker__calc-item">
                                            <span>Output VAT Liability ({formState.vat_scheme === 'VAT Commercial' ? '20%' : '1/6 Margin'})</span>
                                            <strong style={{ color: '#ef4444' }}>- {fmt(formCalculations.outputVat)}</strong>
                                        </div>
                                    )}
                                    <div className={`expense-tracker__calc-item expense-tracker__calc-item--pL ${formState.status === 'Sold' ? (formCalculations.netProfitLoss >= 0 ? 'expense-tracker__calc-item--profit' : 'expense-tracker__calc-item--loss') : ''}`}>
                                        <span>Net Profit / Loss</span>
                                        <strong>
                                            {formState.status === 'Sold' 
                                                ? (formCalculations.netProfitLoss >= 0 ? `+${fmt(formCalculations.netProfitLoss)}` : `-${fmt(Math.abs(formCalculations.netProfitLoss))}`) 
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
                                    placeholder="Search Make, Model, or Reg..."
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
                                <select 
                                    value={filterVatScheme} 
                                    onChange={(e) => setFilterVatScheme(e.target.value)} 
                                    className="form-select expense-tracker__filter-select"
                                >
                                    <option value="All">All VAT Schemes</option>
                                    <option value="VAT Margin">VAT Margin</option>
                                    <option value="VAT Commercial">VAT Commercial</option>
                                </select>
                            </div>
                        </div>

                        {sortedAndFilteredRecords.length > 0 ? (
                            <div className="expense-tracker__table-scroll">
                                <table className="expense-tracker__table">
                                    <thead>
                                        <tr>
                                            <th onClick={() => handleSort('registration')} style={{ cursor: 'pointer' }}>
                                                Reg {renderSortIcon('registration')}
                                            </th>
                                            <th onClick={() => handleSort('make')} style={{ cursor: 'pointer' }}>
                                                Make {renderSortIcon('make')}
                                            </th>
                                            <th onClick={() => handleSort('model')} style={{ cursor: 'pointer' }}>
                                                Model {renderSortIcon('model')}
                                            </th>
                                            <th onClick={() => handleSort('vat_scheme')} style={{ cursor: 'pointer' }}>
                                                VAT Scheme {renderSortIcon('vat_scheme')}
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
                                                Net Profit {renderSortIcon('profit_loss')}
                                            </th>
                                            <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                                                Status {renderSortIcon('status')}
                                            </th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedAndFilteredRecords.map(rec => {
                                            const normMake = normalizeMake(rec.make);
                                            const totalExp = (rec.expenses || []).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
                                            const totalCost = parseFloat(rec.buying_price || 0) + totalExp;
                                            const pL = parseFloat(rec.profit_loss || 0);
                                            const scheme = rec.vat_scheme || 'VAT Margin';

                                            return (
                                                <tr key={rec.id}>
                                                    <td style={{ fontFamily: 'monospace', fontWeight: 'var(--font-weight-semibold)', textTransform: 'uppercase' }}>
                                                        {rec.registration ? rec.registration : '—'}
                                                    </td>
                                                    <td><strong>{normMake}</strong></td>
                                                    <td>{rec.model}</td>
                                                    <td>
                                                        <span className="expense-tracker__scheme-badge">
                                                            {scheme}
                                                        </span>
                                                    </td>
                                                    <td>{fmtInt(rec.buying_price)}</td>
                                                    <td>{fmtInt(totalExp)}</td>
                                                    <td>{fmtInt(totalCost)}</td>
                                                    <td>
                                                        {rec.status === 'Sold' ? fmtInt(rec.selling_price) : '—'}
                                                    </td>
                                                    <td>
                                                        {rec.status === 'Sold' ? (
                                                            <span className={`expense-tracker__pL-badge ${pL >= 0 ? 'expense-tracker__pL-badge--profit' : 'expense-tracker__pL-badge--loss'}`}>
                                                                {pL >= 0 ? `+${fmtInt(pL)}` : `-${fmtInt(Math.abs(pL))}`}
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
                        <p>Are you sure you want to delete the reconditioning and sales history for <strong>{normalizeMake(recordToDelete?.make)} {recordToDelete?.model}</strong>?</p>
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
                                <strong>{normalizeMake(detailsRecord.make)} {detailsRecord.model}</strong>
                            </div>
                            {detailsRecord.registration && (
                                <div className="expense-tracker__details-item">
                                    <span>Registration</span>
                                    <strong style={{ fontFamily: 'monospace', color: 'var(--color-warning)' }}>{detailsRecord.registration}</strong>
                                </div>
                            )}
                            <div className="expense-tracker__details-item">
                                <span>VAT Scheme</span>
                                <span className="expense-tracker__scheme-badge">{detailsRecord.vat_scheme || 'VAT Margin'}</span>
                            </div>
                            <div className="expense-tracker__details-item">
                                <span>Status</span>
                                <span className={`expense-tracker__status-badge expense-tracker__status-badge--${detailsRecord.status.toLowerCase().replace(' ', '-')}`}>
                                    {detailsRecord.status}
                                </span>
                            </div>
                            <div className="expense-tracker__details-item">
                                <span>Buying Price</span>
                                <strong>{fmt(detailsRecord.buying_price)}</strong>
                            </div>
                            <div className="expense-tracker__details-item">
                                <span>Gross Expenses</span>
                                <strong>{fmt((detailsRecord.expenses || []).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0))}</strong>
                            </div>
                            <div className="expense-tracker__details-item">
                                <span>Reclaimable Expense VAT</span>
                                <strong style={{ color: '#55A01F' }}>{fmt((detailsRecord.expenses || []).reduce((sum, e) => sum + parseFloat(e.vatAmount || 0), 0))}</strong>
                            </div>
                            <div className="expense-tracker__details-item">
                                <span>Total Cost</span>
                                <strong>{fmt(parseFloat(detailsRecord.buying_price) + (detailsRecord.expenses || []).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0))}</strong>
                            </div>
                            {detailsRecord.status === 'Sold' && (
                                <>
                                    <div className="expense-tracker__details-item">
                                        <span>Selling Price</span>
                                        <strong>{fmt(detailsRecord.selling_price)}</strong>
                                    </div>
                                    <div className="expense-tracker__details-item">
                                        <span>Net Profit / Loss</span>
                                        <span className={`expense-tracker__pL-badge ${parseFloat(detailsRecord.profit_loss) >= 0 ? 'expense-tracker__pL-badge--profit' : 'expense-tracker__pL-badge--loss'}`}>
                                            {parseFloat(detailsRecord.profit_loss) >= 0 ? `+${fmt(detailsRecord.profit_loss)}` : `-${fmt(Math.abs(parseFloat(detailsRecord.profit_loss)))}`}
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
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Description</th>
                                            <th>Net</th>
                                            <th>VAT</th>
                                            <th>Gross</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detailsRecord.expenses.map((exp, idx) => (
                                            <tr key={idx}>
                                                <td>{exp.date || '—'}</td>
                                                <td><strong>{exp.type}</strong></td>
                                                <td>{exp.description || '—'}</td>
                                                <td>{fmt(exp.netAmount ?? exp.amount)}</td>
                                                <td>{exp.calculateVat ? <span className="expense-tracker__vat-badge">{fmt(exp.vatAmount ?? (exp.amount * 0.20))}</span> : '£0.00'}</td>
                                                <td><strong>{fmt(exp.grossAmount ?? (exp.calculateVat ? exp.amount * 1.20 : exp.amount))}</strong></td>
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
                        <p>Enter the final selling price for <strong>{normalizeMake(markSoldRecord.make)} {markSoldRecord.model}</strong> ({markSoldRecord.vat_scheme || 'VAT Margin'}) to calculate profitability.</p>
                        <form onSubmit={submitQuickMarkSold} className="expense-tracker__form">
                            <div className="form-group">
                                <label className="form-label">Selling Price (£)</label>
                                <input 
                                    type="number" 
                                    value={quickSellingPrice} 
                                    onChange={(e) => setQuickSellingPrice(e.target.value)} 
                                    min="0"
                                    step="0.01"
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
