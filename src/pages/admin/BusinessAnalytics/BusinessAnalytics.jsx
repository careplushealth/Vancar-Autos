import { useState, useMemo, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { getVehicleExpenses, getGeneralExpenses, getCars } from '../../../services/dataService';
import { normalizeMake, deduplicateMakes } from '../../../utils/makeUtils';
import './BusinessAnalytics.css';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

const GREEN = '#55A01F';
const GREEN_DARK = '#3d7515';
const GREEN_LIGHT = 'rgba(85, 160, 31, 0.15)';
const AMBER = '#f59e0b';
const RED = '#ef4444';
const BLUE = '#3b82f6';
const PURPLE = '#8b5cf6';
const PINK = '#ec4899';
const CYAN = '#06b6d4';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmt = (n) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(n || 0);

const fmtFull = (n) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(n || 0);

const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#e2e8f0',
            bodyColor: '#94a3b8',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
                label: (ctx) => ` ${fmtFull(ctx.raw)}`
            }
        }
    },
    scales: {
        x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', font: { size: 11 } }
        },
        y: {
            grid: { color: 'rgba(15,23,42,0.05)' },
            ticks: {
                color: '#94a3b8',
                font: { size: 11 },
                callback: (v) => fmt(v)
            }
        }
    }
};

const EXPENSE_TYPES = [
    "All", "MOT", "Service", "Repairs", "Bodywork", "Valeting", "Tyres", "Transport", "Advertising", "Fuel", "Other"
];

export default function BusinessAnalytics() {
    const [vehicleExpenses, setVehicleExpenses] = useState(() => getVehicleExpenses());
    const [generalExpenses, setGeneralExpenses] = useState(() => getGeneralExpenses());

    // Filters
    const [periodFilter, setPeriodFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [filterMake, setFilterMake] = useState('All');
    const [filterGenCat, setFilterGenCat] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterVatScheme, setFilterVatScheme] = useState('All');
    const [filterExpType, setFilterExpType] = useState('All');
    const [minRevenue, setMinRevenue] = useState('');
    const [maxRevenue, setMaxRevenue] = useState('');
    const [minProfit, setMinProfit] = useState('');
    const [maxProfit, setMaxProfit] = useState('');

    useEffect(() => {
        setVehicleExpenses(getVehicleExpenses());
        setGeneralExpenses(getGeneralExpenses());
    }, []);

    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();

    // Calculate helper for date comparison
    const isWithinPeriod = (dateStr) => {
        if (!dateStr) return true;
        const d = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr);
        if (isNaN(d.getTime())) return true;

        if (periodFilter === 'today') {
            return d.toDateString() === now.toDateString();
        }
        if (periodFilter === 'this_week') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            return d >= startOfWeek;
        }
        if (periodFilter === 'this_month') {
            return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
        }
        if (periodFilter === 'last_month') {
            const lastM = thisMonth === 0 ? 11 : thisMonth - 1;
            const lastMY = thisMonth === 0 ? thisYear - 1 : thisYear;
            return d.getFullYear() === lastMY && d.getMonth() === lastM;
        }
        if (periodFilter === 'this_quarter') {
            const currentQuarter = Math.floor(thisMonth / 3);
            const itemQuarter = Math.floor(d.getMonth() / 3);
            return d.getFullYear() === thisYear && itemQuarter === currentQuarter;
        }
        if (periodFilter === 'this_year') {
            return d.getFullYear() === thisYear;
        }
        if (periodFilter === 'custom' && dateFrom && dateTo) {
            const from = new Date(dateFrom + 'T00:00:00');
            const to = new Date(dateTo + 'T23:59:59');
            return d >= from && d <= to;
        }
        return true;
    };

    // Filter vehicle expenses strictly by all selected filters
    const filteredVehicle = useMemo(() => {
        return vehicleExpenses.filter(r => {
            const normMake = normalizeMake(r.make);
            if (filterMake !== 'All' && normMake !== filterMake) return false;
            if (filterStatus !== 'All') {
                if (filterStatus === 'Sold' && r.status !== 'Sold') return false;
                if (filterStatus === 'In Stock' && r.status === 'Sold') return false;
            }
            if (filterVatScheme !== 'All' && (r.vat_scheme || 'VAT Margin') !== filterVatScheme) return false;
            if (filterExpType !== 'All') {
                const hasType = (r.expenses || []).some(e => e.type === filterExpType);
                if (!hasType) return false;
            }
            const rev = parseFloat(r.selling_price || 0);
            if (minRevenue !== '' && rev < parseFloat(minRevenue)) return false;
            if (maxRevenue !== '' && rev > parseFloat(maxRevenue)) return false;

            const pL = parseFloat(r.profit_loss || 0);
            if (minProfit !== '' && pL < parseFloat(minProfit)) return false;
            if (maxProfit !== '' && pL > parseFloat(maxProfit)) return false;

            // Filter date: use sale/creation date
            return isWithinPeriod(r.created_at);
        });
    }, [vehicleExpenses, filterMake, filterStatus, filterVatScheme, filterExpType, minRevenue, maxRevenue, minProfit, maxProfit, periodFilter, dateFrom, dateTo]);

    // Filter general expenses strictly by selected filters
    const filteredGeneral = useMemo(() => {
        return generalExpenses.filter(r => {
            if (filterGenCat !== 'All' && r.category !== filterGenCat) return false;
            return isWithinPeriod(r.date);
        });
    }, [generalExpenses, filterGenCat, periodFilter, dateFrom, dateTo]);

    // KPI calculations based strictly on filtered datasets
    const kpis = useMemo(() => {
        const soldVehicles = filteredVehicle.filter(r => r.status === 'Sold');
        const totalRevenue = soldVehicles.reduce((s, r) => s + parseFloat(r.selling_price || 0), 0);
        const totalBuyingCost = filteredVehicle.reduce((s, r) => s + parseFloat(r.buying_price || 0), 0);

        let totalGrossVehicleExpenses = 0;
        let totalReclaimableVehicleVat = 0;

        filteredVehicle.forEach(r => {
            (r.expenses || []).forEach(e => {
                const net = parseFloat(e.netAmount ?? e.amount ?? 0);
                const vat = e.vatAmount !== undefined ? parseFloat(e.vatAmount || 0) : (e.calculateVat ? net * 0.20 : 0);
                const gross = e.grossAmount !== undefined ? parseFloat(e.grossAmount || 0) : (net + vat);
                totalGrossVehicleExpenses += gross;
                totalReclaimableVehicleVat += vat;
            });
        });

        const totalNetVehicleExpenses = totalGrossVehicleExpenses - totalReclaimableVehicleVat;
        const totalGeneralExpenses = filteredGeneral.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
        const totalExpenses = totalBuyingCost + totalGrossVehicleExpenses + totalGeneralExpenses;

        let totalOutputVatMargin = 0;
        let totalOutputVatCommercial = 0;
        let totalNetProfit = 0;

        soldVehicles.forEach(r => {
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
            totalNetProfit += pL;
        });

        const grossProfit = totalRevenue - totalBuyingCost;
        const netProfitOverall = totalNetProfit - totalGeneralExpenses;
        const vehiclesSold = soldVehicles.length;
        const avgProfitPerVehicle = vehiclesSold > 0 ? totalNetProfit / vehiclesSold : 0;

        const totalOutputVat = totalOutputVatMargin + totalOutputVatCommercial;
        const netVatPayable = totalOutputVat - totalReclaimableVehicleVat;

        return {
            totalRevenue, totalGrossVehicleExpenses, totalReclaimableVehicleVat, totalBuyingCost, totalGeneralExpenses,
            totalExpenses, totalNetProfit: netProfitOverall, grossProfit,
            vehiclesSold, avgProfitPerVehicle,
            totalOutputVatMargin, totalOutputVatCommercial, totalOutputVat, netVatPayable,
            inStockCount: filteredVehicle.filter(r => r.status !== 'Sold').length
        };
    }, [filteredVehicle, filteredGeneral]);

    // Monthly Chart Data built strictly from FILTERED datasets
    const monthlyChartData = useMemo(() => {
        const months = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(thisYear, thisMonth - i, 1);
            months.push({ year: d.getFullYear(), month: d.getMonth(), label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear().toString().slice(2)}` });
        }

        const revenues = months.map(({ year, month }) =>
            filteredVehicle
                .filter(r => r.status === 'Sold' && new Date(r.created_at).getFullYear() === year && new Date(r.created_at).getMonth() === month)
                .reduce((s, r) => s + parseFloat(r.selling_price || 0), 0)
        );

        const vehExp = months.map(({ year, month }) =>
            filteredVehicle
                .filter(r => new Date(r.created_at).getFullYear() === year && new Date(r.created_at).getMonth() === month)
                .reduce((s, r) => s + (r.expenses || []).reduce((es, e) => es + parseFloat(e.amount || 0), 0) + parseFloat(r.buying_price || 0), 0)
        );

        const genExp = months.map(({ year, month }) => {
            const ys = year.toString();
            const ms = (month + 1).toString().padStart(2, '0');
            return filteredGeneral
                .filter(r => (r.date || '').startsWith(`${ys}-${ms}`))
                .reduce((s, r) => s + parseFloat(r.amount || 0), 0);
        });

        const profits = revenues.map((rev, i) => rev - vehExp[i] - genExp[i]);

        return {
            labels: months.map(m => m.label),
            revenues, vehExp, genExp,
            totalExp: vehExp.map((v, i) => v + genExp[i]),
            profits
        };
    }, [filteredVehicle, filteredGeneral, thisYear, thisMonth]);

    // Vehicle expense type breakdown (from filtered dataset)
    const vehicleExpBreakdown = useMemo(() => {
        const byType = {};
        filteredVehicle.forEach(r => {
            (r.expenses || []).forEach(e => {
                byType[e.type] = (byType[e.type] || 0) + parseFloat(e.amount || 0);
            });
        });
        return Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 8);
    }, [filteredVehicle]);

    // General expense category breakdown (from filtered dataset)
    const genExpBreakdown = useMemo(() => {
        const byCat = {};
        filteredGeneral.forEach(r => {
            byCat[r.category] = (byCat[r.category] || 0) + parseFloat(r.amount || 0);
        });
        return Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 8);
    }, [filteredGeneral]);

    // Top profitable vehicles (from filtered dataset)
    const topVehicles = useMemo(() =>
        filteredVehicle
            .filter(r => r.status === 'Sold')
            .sort((a, b) => parseFloat(b.profit_loss || 0) - parseFloat(a.profit_loss || 0))
            .slice(0, 8),
        [filteredVehicle]);

    // Lead Source Analytics (Vehicles sold by channel & average Auto Trader days)
    const leadSourceAnalytics = useMemo(() => {
        const cars = getCars().filter(c => c.status === 'sold' && (c.lead_source || c.leadSource));
        const counts = {};
        let autotraderSum = 0;
        let autotraderCount = 0;

        cars.forEach(c => {
            const src = c.lead_source || c.leadSource;
            counts[src] = (counts[src] || 0) + 1;
            if (src === 'Auto Trader') {
                const days = parseInt(c.autotrader_days_advertised ?? c.autotraderDaysAdvertised);
                if (!isNaN(days) && days >= 0) {
                    autotraderSum += days;
                    autotraderCount++;
                }
            }
        });

        const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const avgAutotraderDays = autotraderCount > 0 ? (autotraderSum / autotraderCount).toFixed(1) : null;

        return {
            entries: sortedEntries,
            totalSoldWithSource: cars.length,
            avgAutotraderDays,
            autotraderCount
        };
    }, []);

    // Unique standardized makes for filter
    const makes = useMemo(() => ['All', ...deduplicateMakes(vehicleExpenses.map(r => r.make))], [vehicleExpenses]);
    const genCats = useMemo(() => ['All', ...new Set(generalExpenses.map(r => r.category))].sort(), [generalExpenses]);

    const DONUT_COLORS = [GREEN, BLUE, AMBER, PURPLE, PINK, CYAN, '#f97316', '#64748b'];

    // Export CSV
    const exportCSV = () => {
        const rows = [
            ['Metric', 'Value'],
            ['Total Revenue', kpis.totalRevenue.toFixed(2)],
            ['Gross Profit', kpis.grossProfit.toFixed(2)],
            ['Net Profit', kpis.totalNetProfit.toFixed(2)],
            ['Vehicles Sold', kpis.vehiclesSold],
            ['Average Profit Per Vehicle', kpis.avgProfitPerVehicle.toFixed(2)],
            ['Gross Vehicle Expenses', kpis.totalGrossVehicleExpenses.toFixed(2)],
            ['Reclaimable Expense VAT', kpis.totalReclaimableVehicleVat.toFixed(2)],
            ['General Expenses', kpis.totalGeneralExpenses.toFixed(2)],
            ['Total Output VAT (Margin)', kpis.totalOutputVatMargin.toFixed(2)],
            ['Total Output VAT (Commercial)', kpis.totalOutputVatCommercial.toFixed(2)],
            ['Net VAT Payable to HMRC', kpis.netVatPayable.toFixed(2)],
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const KPICard = ({ label, value, subtitle, color, icon }) => (
        <div className="ba-kpi-card">
            <div className="ba-kpi-top">
                <div className="ba-kpi-icon" style={{ background: `${color}18`, color }}>
                    {icon}
                </div>
                <div className="ba-kpi-body">
                    <span className="ba-kpi-label">{label}</span>
                    <span className="ba-kpi-value">{value}</span>
                    {subtitle && <span className="ba-kpi-sub">{subtitle}</span>}
                </div>
            </div>
        </div>
    );

    return (
        <div className="ba">
            {/* Header */}
            <header className="ba-header">
                <div>
                    <h1>Business Analytics</h1>
                    <p>Dynamic KPI reporting, VAT Margin & Commercial tracking, and real-time profitability analytics.</p>
                </div>
                <button className="ba-export-btn" onClick={exportCSV}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Export Report
                </button>
            </header>

            {/* Filters */}
            <section className="ba-filters">
                <div className="ba-filters__group">
                    <label className="ba-filters__label">Period</label>
                    <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} className="ba-filters__select">
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="this_week">This Week</option>
                        <option value="this_month">This Month</option>
                        <option value="last_month">Last Month</option>
                        <option value="this_quarter">This Quarter</option>
                        <option value="this_year">This Year ({thisYear})</option>
                        <option value="custom">Custom Date Range</option>
                    </select>
                </div>
                {periodFilter === 'custom' && (
                    <>
                        <div className="ba-filters__group">
                            <label className="ba-filters__label">From</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="ba-filters__input" />
                        </div>
                        <div className="ba-filters__group">
                            <label className="ba-filters__label">To</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="ba-filters__input" />
                        </div>
                    </>
                )}
                <div className="ba-filters__group">
                    <label className="ba-filters__label">Make</label>
                    <select value={filterMake} onChange={e => setFilterMake(e.target.value)} className="ba-filters__select">
                        {makes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div className="ba-filters__group">
                    <label className="ba-filters__label">Status</label>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="ba-filters__select">
                        <option value="All">All Statuses</option>
                        <option value="Sold">Sold Only</option>
                        <option value="In Stock">In Stock Only</option>
                    </select>
                </div>
                <div className="ba-filters__group">
                    <label className="ba-filters__label">VAT Scheme</label>
                    <select value={filterVatScheme} onChange={e => setFilterVatScheme(e.target.value)} className="ba-filters__select">
                        <option value="All">All VAT Schemes</option>
                        <option value="VAT Margin">VAT Margin</option>
                        <option value="VAT Commercial">VAT Commercial</option>
                    </select>
                </div>
                <div className="ba-filters__group">
                    <label className="ba-filters__label">Expense Type</label>
                    <select value={filterExpType} onChange={e => setFilterExpType(e.target.value)} className="ba-filters__select">
                        {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="ba-filters__group">
                    <label className="ba-filters__label">General Category</label>
                    <select value={filterGenCat} onChange={e => setFilterGenCat(e.target.value)} className="ba-filters__select">
                        {genCats.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="ba-filters__group">
                    <label className="ba-filters__label">Min Revenue (£)</label>
                    <input type="number" placeholder="e.g. 5000" value={minRevenue} onChange={e => setMinRevenue(e.target.value)} className="ba-filters__input" />
                </div>
                <div className="ba-filters__group">
                    <label className="ba-filters__label">Min Profit (£)</label>
                    <input type="number" placeholder="e.g. 500" value={minProfit} onChange={e => setMinProfit(e.target.value)} className="ba-filters__input" />
                </div>
                {(filterMake !== 'All' || filterStatus !== 'All' || filterVatScheme !== 'All' || filterExpType !== 'All' || filterGenCat !== 'All' || minRevenue || maxRevenue || minProfit || maxProfit || periodFilter !== 'all') && (
                    <button className="ba-clear-filters-btn" onClick={() => {
                        setPeriodFilter('all'); setFilterMake('All'); setFilterStatus('All'); setFilterVatScheme('All');
                        setFilterExpType('All'); setFilterGenCat('All'); setMinRevenue(''); setMaxRevenue('');
                        setMinProfit(''); setMaxProfit(''); setDateFrom(''); setDateTo('');
                    }}>
                        Reset Filters
                    </button>
                )}
            </section>

            {/* KPI Grid */}
            <section className="ba-kpi-grid">
                <KPICard label="Total Revenue" value={fmt(kpis.totalRevenue)} subtitle="From vehicle sales" color={GREEN}
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>} />
                <KPICard label="Gross Profit" value={fmt(kpis.grossProfit)} subtitle="Revenue minus buying cost" color={GREEN_DARK}
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>} />
                <KPICard label="Net Profit" value={fmt(kpis.totalNetProfit)} subtitle="After expenses & VAT" color={kpis.totalNetProfit >= 0 ? GREEN : RED}
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>} />
                <KPICard label="Vehicles Sold" value={kpis.vehiclesSold} subtitle={`${kpis.inStockCount} in stock`} color={BLUE}
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>} />
                <KPICard label="Avg Profit / Vehicle" value={fmt(kpis.avgProfitPerVehicle)} subtitle="Sold vehicles only" color={PURPLE}
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>} />
                <KPICard label="Gross Vehicle Expenses" value={fmt(kpis.totalGrossVehicleExpenses)} subtitle="Workshop & prep costs" color={AMBER}
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>} />
                <KPICard label="General Expenses" value={fmt(kpis.totalGeneralExpenses)} subtitle="Business overheads" color={PINK}
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>} />
                <KPICard label="Total Combined Expenses" value={fmt(kpis.totalExpenses)} subtitle="Buying + Vehicle + General" color={RED}
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>} />
                <KPICard label="Total Output VAT" value={fmt(kpis.totalOutputVat)} subtitle={`Margin (${fmt(kpis.totalOutputVatMargin)}) + Comm (${fmt(kpis.totalOutputVatCommercial)})`} color={CYAN}
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>} />
                <KPICard label="Input VAT Reclaimed" value={fmt(kpis.totalReclaimableVehicleVat)} subtitle="Reclaimable expense VAT" color={GREEN}
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>} />
                <KPICard label="Net VAT Payable" value={fmt(kpis.netVatPayable)} subtitle="Output VAT - Input VAT" color={kpis.netVatPayable >= 0 ? AMBER : GREEN}
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>} />
                <KPICard label="Stock Buying Capital" value={fmt(kpis.totalBuyingCost)} subtitle="Acquisition value" color={BLUE}
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /></svg>} />
            </section>

            {/* VAT Compliance Summary Banner */}
            <section className="ba-vat-summary">
                <div className="ba-vat-summary__title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    <span>HMRC VAT Liability & Reclaim Summary</span>
                </div>
                <div className="ba-vat-summary__grid">
                    <div className="ba-vat-summary__item">
                        <span>VAT Margin Output (1/6 Profit)</span>
                        <strong>{fmt(kpis.totalOutputVatMargin)}</strong>
                    </div>
                    <div className="ba-vat-summary__item">
                        <span>VAT Commercial Output (20% Sale)</span>
                        <strong>{fmt(kpis.totalOutputVatCommercial)}</strong>
                    </div>
                    <div className="ba-vat-summary__item">
                        <span>Input VAT Reclaimable</span>
                        <strong style={{ color: '#55A01F' }}>-{fmt(kpis.totalReclaimableVehicleVat)}</strong>
                    </div>
                    <div className="ba-vat-summary__item ba-vat-summary__item--highlight">
                        <span>Net VAT Liability</span>
                        <strong style={{ color: kpis.netVatPayable >= 0 ? '#f59e0b' : '#55A01F' }}>{fmt(kpis.netVatPayable)}</strong>
                    </div>
                </div>
            </section>

            {/* Charts Row 1: Revenue vs Expenses + Profit Trend */}
            <div className="ba-charts-row">
                <div className="ba-chart-card ba-chart-card--wide">
                    <div className="ba-chart-header">
                        <h3>Revenue vs. Total Expenses — Dynamic Trend</h3>
                    </div>
                    <div className="ba-chart-legend">
                        <span className="ba-legend-dot" style={{ background: GREEN }} /> Revenue
                        <span className="ba-legend-dot" style={{ background: RED }} /> Total Expenses
                        <span className="ba-legend-dot" style={{ background: BLUE }} /> Net Profit
                    </div>
                    <div className="ba-chart-wrap">
                        <Line
                            data={{
                                labels: monthlyChartData.labels,
                                datasets: [
                                    {
                                        label: 'Revenue',
                                        data: monthlyChartData.revenues,
                                        borderColor: GREEN,
                                        backgroundColor: GREEN_LIGHT,
                                        fill: true,
                                        tension: 0.4,
                                        pointRadius: 4,
                                        pointHoverRadius: 6,
                                        borderWidth: 2.5,
                                    },
                                    {
                                        label: 'Total Expenses',
                                        data: monthlyChartData.totalExp,
                                        borderColor: RED,
                                        backgroundColor: 'rgba(239,68,68,0.06)',
                                        fill: true,
                                        tension: 0.4,
                                        pointRadius: 4,
                                        pointHoverRadius: 6,
                                        borderWidth: 2,
                                    },
                                    {
                                        label: 'Net Profit',
                                        data: monthlyChartData.profits,
                                        borderColor: BLUE,
                                        backgroundColor: 'transparent',
                                        tension: 0.4,
                                        pointRadius: 4,
                                        pointHoverRadius: 6,
                                        borderWidth: 2,
                                        borderDash: [5, 4],
                                    }
                                ]
                            }}
                            options={{
                                ...chartDefaults,
                                plugins: {
                                    ...chartDefaults.plugins,
                                    legend: { display: false },
                                    tooltip: {
                                        ...chartDefaults.plugins.tooltip,
                                        callbacks: {
                                            label: (ctx) => ` ${ctx.dataset.label}: ${fmtFull(ctx.raw)}`
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="ba-chart-card">
                    <div className="ba-chart-header">
                        <h3>Monthly Profitability Trend</h3>
                    </div>
                    <div className="ba-chart-wrap">
                        <Bar
                            data={{
                                labels: monthlyChartData.labels,
                                datasets: [{
                                    data: monthlyChartData.profits,
                                    backgroundColor: monthlyChartData.profits.map(v => v >= 0 ? GREEN : RED),
                                    borderRadius: 6,
                                    borderSkipped: false,
                                }]
                            }}
                            options={chartDefaults}
                        />
                    </div>
                </div>
            </div>

            {/* Charts Row 2: Breakdown donuts + VAT breakdown bar */}
            <div className="ba-charts-row ba-charts-row--3col">
                <div className="ba-chart-card">
                    <div className="ba-chart-header">
                        <h3>Vehicle Expense Types</h3>
                    </div>
                    {vehicleExpBreakdown.length > 0 ? (
                        <>
                            <div className="ba-chart-wrap ba-chart-wrap--donut">
                                <Doughnut
                                    data={{
                                        labels: vehicleExpBreakdown.map(([k]) => k),
                                        datasets: [{
                                            data: vehicleExpBreakdown.map(([, v]) => v),
                                            backgroundColor: DONUT_COLORS,
                                            borderWidth: 2,
                                            borderColor: '#fff',
                                            hoverOffset: 6,
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        cutout: '65%',
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                                ...chartDefaults.plugins.tooltip,
                                                callbacks: { label: (ctx) => ` ${ctx.label}: ${fmtFull(ctx.raw)}` }
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <div className="ba-donut-legend">
                                {vehicleExpBreakdown.map(([cat, amt], i) => (
                                    <div key={cat} className="ba-donut-legend-item">
                                        <span className="ba-donut-dot" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                                        <span className="ba-donut-label">{cat}</span>
                                        <span className="ba-donut-value">{fmt(amt)}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="ba-chart-empty">No vehicle expense data for selected filters</div>
                    )}
                </div>

                <div className="ba-chart-card">
                    <div className="ba-chart-header">
                        <h3>General Expense Categories</h3>
                    </div>
                    {genExpBreakdown.length > 0 ? (
                        <>
                            <div className="ba-chart-wrap ba-chart-wrap--donut">
                                <Doughnut
                                    data={{
                                        labels: genExpBreakdown.map(([k]) => k),
                                        datasets: [{
                                            data: genExpBreakdown.map(([, v]) => v),
                                            backgroundColor: DONUT_COLORS.map((c, i) => DONUT_COLORS[(i + 2) % DONUT_COLORS.length]),
                                            borderWidth: 2,
                                            borderColor: '#fff',
                                            hoverOffset: 6,
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        cutout: '65%',
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                                ...chartDefaults.plugins.tooltip,
                                                callbacks: { label: (ctx) => ` ${ctx.label}: ${fmtFull(ctx.raw)}` }
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <div className="ba-donut-legend">
                                {genExpBreakdown.map(([cat, amt], i) => (
                                    <div key={cat} className="ba-donut-legend-item">
                                        <span className="ba-donut-dot" style={{ background: DONUT_COLORS[(i + 2) % DONUT_COLORS.length] }} />
                                        <span className="ba-donut-label">{cat}</span>
                                        <span className="ba-donut-value">{fmt(amt)}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="ba-chart-empty">No general expense data for selected filters</div>
                    )}
                </div>

                <div className="ba-chart-card">
                    <div className="ba-chart-header">
                        <h3>VAT Analysis (Output vs Input)</h3>
                    </div>
                    <div className="ba-chart-wrap">
                        <Bar
                            data={{
                                labels: ['VAT Margin\nOutput', 'Commercial\nOutput', 'Input VAT\nReclaimed'],
                                datasets: [{
                                    data: [kpis.totalOutputVatMargin, kpis.totalOutputVatCommercial, kpis.totalReclaimableVehicleVat],
                                    backgroundColor: [CYAN, BLUE, GREEN],
                                    borderRadius: 8,
                                    borderSkipped: false,
                                }]
                            }}
                            options={chartDefaults}
                        />
                    </div>
                </div>
            </div>

            {/* Top Profitable Vehicles Table */}
            <div className="ba-table-card">
                <div className="ba-table-header">
                    <h3>Most Profitable Vehicles ({filteredVehicle.filter(r => r.status === 'Sold').length} Sold)</h3>
                </div>
                {topVehicles.length === 0 ? (
                    <div className="ba-chart-empty">No sold vehicles match your filter criteria.</div>
                ) : (
                    <div className="ba-table-wrap">
                        <table className="ba-table">
                            <thead>
                                <tr>
                                    <th>Vehicle</th>
                                    <th>Registration</th>
                                    <th>VAT Scheme</th>
                                    <th className="ba-th--right">Buying Price</th>
                                    <th className="ba-th--right">Expenses</th>
                                    <th className="ba-th--right">Selling Price</th>
                                    <th className="ba-th--right">Output VAT</th>
                                    <th className="ba-th--right">Net Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topVehicles.map(r => {
                                    const normMake = normalizeMake(r.make);
                                    const grossExp = (r.expenses || []).reduce((s, e) => s + parseFloat(e.grossAmount ?? (e.calculateVat ? parseFloat(e.amount) * 1.20 : e.amount)), 0);
                                    const netExp = (r.expenses || []).reduce((s, e) => s + parseFloat(e.netAmount ?? e.amount ?? 0), 0);
                                    const selling = parseFloat(r.selling_price || 0);
                                    const buying = parseFloat(r.buying_price || 0);
                                    const scheme = r.vat_scheme || 'VAT Margin';

                                    let outVat = 0;
                                    if (scheme === 'VAT Commercial') {
                                        outVat = selling * 0.20;
                                    } else {
                                        const margin = selling - buying - netExp;
                                        outVat = margin > 0 ? margin * (1 / 6) : 0;
                                    }

                                    const netProfit = selling - buying - netExp - outVat;

                                    return (
                                        <tr key={r.id}>
                                            <td><strong>{normMake} {r.model}</strong></td>
                                            <td><span className="ba-reg-badge">{r.registration || '—'}</span></td>
                                            <td><span className="ba-scheme-tag">{scheme}</span></td>
                                            <td className="ba-td--right">{fmt(buying)}</td>
                                            <td className="ba-td--right">{fmt(grossExp)}</td>
                                            <td className="ba-td--right">{fmt(selling)}</td>
                                            <td className="ba-td--right" style={{ color: '#ef4444' }}>{fmt(outVat)}</td>
                                            <td className="ba-td--right">
                                                <span className={`ba-pl-badge ${netProfit >= 0 ? 'ba-pl-badge--profit' : 'ba-pl-badge--loss'}`}>
                                                    {netProfit >= 0 ? '+' : ''}{fmt(netProfit)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Sales Channel & Lead Source Analytics */}
            <div className="ba-table-card" style={{ marginTop: '24px' }}>
                <div className="ba-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                        <h3>Lead Source Performance ({leadSourceAnalytics.totalSoldWithSource} Vehicles Tracked)</h3>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Sales volume by advertising channel</span>
                    </div>
                    {leadSourceAnalytics.avgAutotraderDays !== null && (
                        <div style={{ background: '#002F6C', color: '#ffffff', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                            ⏱️ Auto Trader Avg Duration: {leadSourceAnalytics.avgAutotraderDays} days
                        </div>
                    )}
                </div>
                {leadSourceAnalytics.entries.length === 0 ? (
                    <div className="ba-chart-empty">No sold vehicle lead sources recorded yet. Mark vehicles as Sold in Manage Inventory to track lead channel performance.</div>
                ) : (
                    <div className="ba-table-wrap">
                        <table className="ba-table">
                            <thead>
                                <tr>
                                    <th>Lead Channel</th>
                                    <th>Vehicles Sold</th>
                                    <th>Share of Total</th>
                                    {leadSourceAnalytics.avgAutotraderDays !== null && <th>Auto Trader Metrics</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {leadSourceAnalytics.entries.map(([source, count]) => {
                                    const pct = leadSourceAnalytics.totalSoldWithSource > 0 
                                        ? Math.round((count / leadSourceAnalytics.totalSoldWithSource) * 100) 
                                        : 0;
                                    return (
                                        <tr key={source}>
                                            <td><strong>📍 {source}</strong></td>
                                            <td>{count} vehicle{count === 1 ? '' : 's'}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '160px' }}>
                                                    <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${pct}%`, height: '100%', background: '#55A01F', borderRadius: '4px' }} />
                                                    </div>
                                                    <span style={{ fontSize: '12px', fontWeight: 'bold', width: '36px' }}>{pct}%</span>
                                                </div>
                                            </td>
                                            {leadSourceAnalytics.avgAutotraderDays !== null && (
                                                <td>
                                                    {source === 'Auto Trader' ? (
                                                        <span style={{ color: '#55A01F', fontWeight: 'bold', fontSize: '13px' }}>
                                                            {leadSourceAnalytics.avgAutotraderDays} days avg duration ({leadSourceAnalytics.autotraderCount} sales)
                                                        </span>
                                                    ) : (
                                                        <span style={{ opacity: 0.4 }}>—</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
