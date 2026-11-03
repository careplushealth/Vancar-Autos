import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFinanceRates } from '../../services/dataService';
import FinanceApplicationModal from '../../components/FinanceApplicationModal/FinanceApplicationModal';
import './Finance.css';

const BORROW_PRESETS = [3000, 5000, 7500, 10000, 12500, 15000, 20000, 25000, 30000];

const TERM_OPTIONS = [
    { value: 1, label: '1 year (12 months)' },
    { value: 2, label: '2 years (24 months)' },
    { value: 3, label: '3 years (36 months)' },
    { value: 4, label: '4 years (48 months)' },
    { value: 5, label: '5 years (60 months)' },
    { value: 6, label: '6 years (72 months)' },
    { value: 7, label: '7 years (84 months)' },
];

const CREDIT_TIERS = [
    { value: 'Excellent', label: 'Excellent (APR 11.9%)' },
    { value: 'Good', label: 'Good (APR 12.9%)' },
    { value: 'Fair', label: 'Fair (APR 13.9%)' },
    { value: 'Bad', label: 'Bad (APR 19.9%)' },
];

export default function Finance() {
    // Calculator State
    const [borrowAmount, setBorrowAmount] = useState(10000);
    const [isCustomAmount, setIsCustomAmount] = useState(false);
    const [termYears, setTermYears] = useState(5);
    const [creditScore, setCreditScore] = useState('Good');
    const [rates, setRates] = useState({
        excellent: 11.9,
        good: 12.9,
        fair: 13.9,
        poor: 19.9,
        bad: 19.9,
        representativeApr: 11.9
    });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);

    // FAQ Accordion State (open question indices)
    const [openFaq, setOpenFaq] = useState([0]);

    // Fetch dynamic rates on mount
    useEffect(() => {
        getFinanceRates().then(data => {
            if (data) setRates(data);
        });
    }, []);

    // Get active APR based on selected tier
    const activeApr = useMemo(() => {
        switch (creditScore) {
            case 'Excellent': return rates.excellent || 11.9;
            case 'Good': return rates.good || 12.9;
            case 'Fair': return rates.fair || 13.9;
            case 'Bad':
            case 'Poor': return rates.bad || rates.poor || 19.9;
            default: return rates.representativeApr || 11.9;
        }
    }, [creditScore, rates]);

    // Mathematical Loan Amortization Calculation
    // Formula: M = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
    const calculation = useMemo(() => {
        const P = Number(borrowAmount) || 0;
        const n = termYears * 12;
        if (P <= 0 || n <= 0) {
            return { monthly: 0, totalRepayable: 0, totalInterest: 0, apr: activeApr };
        }

        const annualRate = activeApr / 100;
        const r = annualRate / 12;

        let monthly;
        if (r === 0) {
            monthly = Math.round(P / n);
        } else {
            monthly = Math.round(P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
        }

        const totalRepayable = monthly * n;
        const totalInterest = Math.max(0, totalRepayable - P);

        return {
            monthly,
            totalRepayable,
            totalInterest,
            apr: activeApr
        };
    }, [borrowAmount, termYears, activeApr]);

    // Toggle FAQ
    const toggleFaq = (index) => {
        setOpenFaq(prev => 
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    // Data package passed to the application wizard
    const calculatorPayload = useMemo(() => ({
        borrowAmount,
        termYears,
        creditScore,
        estimatedMonthly: calculation.monthly,
        estimatedApr: activeApr,
        totalRepayable: calculation.totalRepayable
    }), [borrowAmount, termYears, creditScore, calculation, activeApr]);

    return (
        <div className="finance-page">
            {/* 1. HERO SECTION WITH INTEGRATED CALCULATOR */}
            <section className="finance-hero">
                <div className="container">
                    <div className="finance-hero__inner">
                        {/* Hero Left: Intro Text */}
                        <div className="finance-hero__text">
                            <span className="finance-hero__tag">Vancar Autos Finance</span>
                            <h1 className="finance-hero__title">
                                Find the Right Finance for Your Next Car
                            </h1>
                            <p className="finance-hero__subtitle">
                                Calculate your monthly repayments and apply for finance online in minutes. 
                                Our fast, confidential eligibility check won't affect your credit rating.
                            </p>

                            <div className="finance-hero__usps">
                                <div className="finance-hero__usp">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#55A01F" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                    <span>Decision in minutes with no obligation</span>
                                </div>
                                <div className="finance-hero__usp">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#55A01F" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                    <span>Access to 30+ trusted UK lenders</span>
                                </div>
                                <div className="finance-hero__usp">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#55A01F" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                    <span>Competitive rates for Good & Bad credit</span>
                                </div>
                            </div>
                        </div>

                        {/* Hero Right: Interactive Calculator Card */}
                        <div className="finance-calc-card">
                            <div className="finance-calc-card__header">
                                <h2 className="finance-calc-card__title">Finance Calculator</h2>
                                <span className="finance-calc-card__badge">Live Estimate</span>
                            </div>

                            <div className="finance-calc-card__body">
                                {/* Borrow Amount */}
                                <div className="finance-calc-group">
                                    <div className="finance-calc-group__label-row">
                                        <label className="finance-calc-label">I'd like to borrow</label>
                                        <strong className="finance-calc-amount-display">
                                            £{Number(borrowAmount).toLocaleString('en-GB')}
                                        </strong>
                                    </div>

                                    {!isCustomAmount ? (
                                        <select
                                            className="finance-calc-select"
                                            value={borrowAmount}
                                            onChange={e => {
                                                if (e.target.value === 'custom') {
                                                    setIsCustomAmount(true);
                                                } else {
                                                    setBorrowAmount(Number(e.target.value));
                                                }
                                            }}
                                        >
                                            {BORROW_PRESETS.map(amount => (
                                                <option key={amount} value={amount}>
                                                    £{amount.toLocaleString('en-GB')}
                                                </option>
                                            ))}
                                            <option value="custom">Enter custom amount...</option>
                                        </select>
                                    ) : (
                                        <div className="finance-calc-custom-wrap">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">£</span>
                                                <input
                                                    type="number"
                                                    min="1000"
                                                    max="100000"
                                                    step="500"
                                                    className="finance-calc-input pl-8"
                                                    value={borrowAmount}
                                                    onChange={e => setBorrowAmount(Math.max(0, Number(e.target.value)))}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="finance-calc-preset-toggle"
                                                onClick={() => {
                                                    setIsCustomAmount(false);
                                                    setBorrowAmount(10000);
                                                }}
                                            >
                                                Presets
                                            </button>
                                        </div>
                                    )}

                                    {/* Slider */}
                                    <input
                                        type="range"
                                        min="2000"
                                        max="50000"
                                        step="500"
                                        value={borrowAmount}
                                        onChange={e => setBorrowAmount(Number(e.target.value))}
                                        className="finance-calc-range"
                                    />
                                </div>

                                {/* Term & Credit Rating Grid */}
                                <div className="finance-calc-grid">
                                    <div className="finance-calc-group">
                                        <label className="finance-calc-label">Over a period of</label>
                                        <select
                                            className="finance-calc-select"
                                            value={termYears}
                                            onChange={e => setTermYears(Number(e.target.value))}
                                        >
                                            {TERM_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="finance-calc-group">
                                        <label className="finance-calc-label">
                                            My credit score is 
                                            <span className="finance-calc-info-icon" title="Selecting your score helps estimate your monthly repayments accurately.">ℹ</span>
                                        </label>
                                        <select
                                            className="finance-calc-select"
                                            value={creditScore}
                                            onChange={e => setCreditScore(e.target.value)}
                                        >
                                            {CREDIT_TIERS.map(tier => (
                                                <option key={tier.value} value={tier.value}>{tier.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Illustrative Output Box */}
                                <div className="finance-calc-results">
                                    <div className="finance-calc-results__header">
                                        <span className="finance-calc-results__tag">Illustrative Example</span>
                                        <span className="finance-calc-results__note">Subject to credit score & status</span>
                                    </div>

                                    <div className="finance-calc-results__main">
                                        <div>
                                            <span className="finance-calc-results__label">Monthly Repayment</span>
                                            <div className="finance-calc-results__monthly">
                                                £{calculation.monthly.toLocaleString('en-GB')}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="finance-calc-results__label">Representative APR</span>
                                            <div className="finance-calc-results__apr">
                                                {activeApr}%
                                            </div>
                                        </div>
                                    </div>

                                    <div className="finance-calc-results__details">
                                        <div className="finance-calc-results__detail-col">
                                            <span>Total Repayable:</span>
                                            <strong>£{calculation.totalRepayable.toLocaleString('en-GB')}</strong>
                                        </div>
                                        <div className="finance-calc-results__detail-col">
                                            <span>Total Interest:</span>
                                            <strong>£{calculation.totalInterest.toLocaleString('en-GB')}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(true)}
                                    className="finance-calc-btn finance-calc-btn--apply"
                                >
                                    Apply Now →
                                </button>

                                <div className="text-center mt-3">
                                    <a href="#contact-section" className="finance-calc-advisor-link">
                                        Or speak to a finance advisor &rsaquo;
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. REPRESENTATIVE EXAMPLE BANNER */}
            <div className="finance-rep-banner">
                <div className="container">
                    <p className="finance-rep-banner__text">
                        <strong>Representative example:</strong> Borrowing <strong>£10,000</strong> over <strong>5 years (60 months)</strong> at a representative APR of <strong>11.9%</strong>, annual interest rate (fixed) <strong>11.9%</strong>, 60 monthly payments of <strong>£222.00</strong>. Total cost of credit is <strong>£3,320.00</strong>. Total amount repayable is <strong>£13,320.00</strong>.
                    </p>
                </div>
            </div>

            {/* 3. TRUST PILLARS BAR */}
            <section className="finance-pillars">
                <div className="container">
                    <div className="finance-pillars__grid">
                        <div className="finance-pillar-card">
                            <div className="finance-pillar-icon">⏱️</div>
                            <h3>Instant Soft Search</h3>
                            <p>Check your finance eligibility in 60 seconds with zero impact on your credit score.</p>
                        </div>
                        <div className="finance-pillar-card">
                            <div className="finance-pillar-icon">🤝</div>
                            <h3>30+ UK Panel Lenders</h3>
                            <p>We work with prime and specialist lenders to find the lowest possible rate for your profile.</p>
                        </div>
                        <div className="finance-pillar-card">
                            <div className="finance-pillar-icon">👤</div>
                            <h3>Dedicated Advisor</h3>
                            <p>A personal automotive finance specialist guides you from application through to handover.</p>
                        </div>
                        <div className="finance-pillar-card">
                            <div className="finance-pillar-icon">🛡️</div>
                            <h3>No Hidden Fees</h3>
                            <p>100% transparent agreements with zero upfront arrangement fees or hidden charges.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. WHAT DOES IT MEAN FOR YOU? */}
            <section className="section bg-white">
                <div className="container">
                    <div className="finance-meaning-grid">
                        <div className="finance-meaning-content">
                            <span className="finance-section-badge">Peace of Mind</span>
                            <h2 className="finance-section-title">What does finance with Vancar Autos mean for you?</h2>
                            <p className="finance-section-desc">
                                We believe car buying should be transparent, straightforward, and affordable. Our vehicle finance team removes the jargon and helps you secure competitive rates tailored to your budget.
                            </p>

                            <ul className="finance-check-list">
                                <li>
                                    <div className="finance-check-icon">✓</div>
                                    <div>
                                        <strong>Wide lender panel to help all credit profiles</strong>
                                        <p>Whether you have an excellent, fair, or poor credit history, we match your application with lenders ready to help.</p>
                                    </div>
                                </li>
                                <li>
                                    <div className="finance-check-icon">✓</div>
                                    <div>
                                        <strong>Eligibility quotes valid for 30 days</strong>
                                        <p>Shop with confidence knowing your finance quote is locked in while you pick your perfect vehicle.</p>
                                    </div>
                                </li>
                                <li>
                                    <div className="finance-check-icon">✓</div>
                                    <div>
                                        <strong>Free comprehensive vehicle inspection & warranty</strong>
                                        <p>Every vehicle delivered or financed through Vancar Autos undergoes our 150-point quality audit.</p>
                                    </div>
                                </li>
                            </ul>

                            <div className="mt-8 flex flex-wrap gap-4">
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="btn btn--primary"
                                >
                                    Check Your Eligibility Now
                                </button>
                                <Link to="/buy" className="btn btn--outline">
                                    Browse Available Cars
                                </Link>
                            </div>
                        </div>

                        <div className="finance-meaning-visual">
                            <div className="finance-meaning-card shadow-2xl">
                                <div className="finance-meaning-stat">
                                    <span className="finance-meaning-stat-num">97%</span>
                                    <span className="finance-meaning-stat-label">Approval Rate across our panel</span>
                                </div>
                                <div className="finance-meaning-tags">
                                    <span className="finance-tag">✓ Hire Purchase</span>
                                    <span className="finance-tag">✓ PCP</span>
                                    <span className="finance-tag">✓ Zero Deposit Options</span>
                                    <span className="finance-tag">✓ Part Exchange Accepted</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. FINANCE OPTIONS EXPLAINED */}
            <section className="section bg-slate-50 border-y border-slate-100">
                <div className="container">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <span className="finance-section-badge">Finance Explained</span>
                        <h2 className="finance-section-title">Vancar Autos Car Finance Options</h2>
                        <p className="finance-section-desc">
                            Explore the most popular types of car finance agreements to see which structure fits your lifestyle and ownership preferences.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* HP */}
                        <div className="finance-option-card">
                            <div className="finance-option-badge">Most Popular</div>
                            <h3 className="finance-option-title">Hire Purchase (HP)</h3>
                            <p className="finance-option-desc">
                                Spread the full cost of the vehicle across equal monthly repayments. Once the final payment is settled, the car is 100% yours outright.
                            </p>
                            <ul className="finance-option-points">
                                <li>Equal fixed monthly payments</li>
                                <li>No mileage restrictions or excess fees</li>
                                <li>You own the car at the end of the term</li>
                            </ul>
                        </div>

                        {/* PCP */}
                        <div className="finance-option-card">
                            <div className="finance-option-badge">Lower Monthly</div>
                            <h3 className="finance-option-title">Personal Contract Purchase (PCP)</h3>
                            <p className="finance-option-desc">
                                Enjoy lower monthly payments by deferring a portion of the vehicle cost to an optional final balloon payment at the end of the agreement.
                            </p>
                            <ul className="finance-option-points">
                                <li>Lower monthly payments than HP</li>
                                <li>Option to buy, return, or part-exchange</li>
                                <li>Annual agreed mileage allowance</li>
                            </ul>
                        </div>

                        {/* Personal Loan */}
                        <div className="finance-option-card">
                            <div className="finance-option-badge">Day 1 Ownership</div>
                            <h3 className="finance-option-title">Personal Car Loan</h3>
                            <p className="finance-option-desc">
                                An unsecured personal loan allows you to borrow funds to purchase the vehicle directly. You own the vehicle outright from day one.
                            </p>
                            <ul className="finance-option-points">
                                <li>Own the car outright immediately</li>
                                <li>Not secured against the vehicle</li>
                                <li>No deposit strictly required</li>
                            </ul>
                        </div>

                        {/* Leasing */}
                        <div className="finance-option-card">
                            <div className="finance-option-badge">Simple Rental</div>
                            <h3 className="finance-option-title">Leasing (Contract Hire)</h3>
                            <p className="finance-option-desc">
                                Pay predictable fixed monthly rentals to use the vehicle over an agreed term. At the end, you simply hand the vehicle back.
                            </p>
                            <ul className="finance-option-points">
                                <li>Simple predictable monthly cost</li>
                                <li>No depreciation or resale hassle</li>
                                <li>Vehicle is returned at the end</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. COMPARISON TABLE */}
            <section className="section bg-white">
                <div className="container">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <span className="finance-section-badge">At a Glance</span>
                        <h2 className="finance-section-title">Not sure what finance is right for you?</h2>
                        <p className="finance-section-desc">
                            Compare the key features of Hire Purchase, PCP, Personal Loan and Leasing side by side.
                        </p>
                    </div>

                    <div className="finance-table-container">
                        <table className="finance-table">
                            <thead>
                                <tr>
                                    <th className="finance-table__feature-col">Feature Comparison</th>
                                    <th>Hire Purchase (HP)</th>
                                    <th>Personal Contract Purchase (PCP)</th>
                                    <th>Personal Loan</th>
                                    <th>Leasing</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="finance-table__feature-title">Require initial deposit</td>
                                    <td><span className="finance-pill finance-pill--neutral">Usually requires deposit</span></td>
                                    <td><span className="finance-pill finance-pill--neutral">Usually requires deposit</span></td>
                                    <td><span className="finance-symbol finance-symbol--cross">✕</span></td>
                                    <td><span className="finance-pill finance-pill--neutral">Usually requires deposit</span></td>
                                </tr>
                                <tr>
                                    <td className="finance-table__feature-title">You own the car outright on Day 1</td>
                                    <td><span className="finance-symbol finance-symbol--cross">✕</span></td>
                                    <td><span className="finance-symbol finance-symbol--cross">✕</span></td>
                                    <td><span className="finance-symbol finance-symbol--check">✓</span></td>
                                    <td><span className="finance-symbol finance-symbol--cross">✕</span></td>
                                </tr>
                                <tr>
                                    <td className="finance-table__feature-title">Car is yours at the end of agreement</td>
                                    <td><span className="finance-symbol finance-symbol--check">✓</span></td>
                                    <td><span className="finance-pill finance-pill--green">Optional (Balloon)</span></td>
                                    <td><span className="finance-symbol finance-symbol--check">✓</span></td>
                                    <td><span className="finance-symbol finance-symbol--cross">✕</span></td>
                                </tr>
                                <tr>
                                    <td className="finance-table__feature-title">Optional final (balloon) payment</td>
                                    <td><span className="finance-symbol finance-symbol--cross">✕</span></td>
                                    <td><span className="finance-symbol finance-symbol--check">✓</span></td>
                                    <td><span className="finance-symbol finance-symbol--cross">✕</span></td>
                                    <td><span className="finance-symbol finance-symbol--cross">✕</span></td>
                                </tr>
                                <tr>
                                    <td className="finance-table__feature-title">Fixed monthly payments</td>
                                    <td><span className="finance-symbol finance-symbol--check">✓</span></td>
                                    <td><span className="finance-symbol finance-symbol--check">✓</span></td>
                                    <td><span className="finance-symbol finance-symbol--check">✓</span></td>
                                    <td><span className="finance-symbol finance-symbol--check">✓</span></td>
                                </tr>
                                <tr>
                                    <td className="finance-table__feature-title">Excess mileage charge</td>
                                    <td><span className="finance-symbol finance-symbol--cross">✕</span></td>
                                    <td><span className="finance-symbol finance-symbol--check">✓</span></td>
                                    <td><span className="finance-symbol finance-symbol--cross">✕</span></td>
                                    <td><span className="finance-symbol finance-symbol--check">✓</span></td>
                                </tr>
                                <tr>
                                    <td className="finance-table__feature-title">Secured against an asset</td>
                                    <td><span className="finance-symbol finance-symbol--check">✓</span></td>
                                    <td><span className="finance-symbol finance-symbol--check">✓</span></td>
                                    <td><span className="finance-symbol finance-symbol--cross">✕</span></td>
                                    <td><span className="finance-symbol finance-symbol--check">✓</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* 7. FREQUENTLY ASKED QUESTIONS */}
            <section className="section bg-slate-50 border-t border-slate-100">
                <div className="container">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <span className="finance-section-badge">Got Questions?</span>
                        <h2 className="finance-section-title">Frequently Asked Questions</h2>
                        <p className="finance-section-desc">
                            Answers to common questions about vehicle finance, eligibility, and the application process.
                        </p>
                    </div>

                    <div className="finance-faq-accordion">
                        {[
                            {
                                q: "What is car finance?",
                                a: "Car finance allows you to purchase a vehicle by spreading the cost across affordable monthly repayments over 1 to 7 years, rather than paying the full vehicle amount upfront in cash. Common types include Hire Purchase (HP) and Personal Contract Purchase (PCP)."
                            },
                            {
                                q: "Can I apply for finance with a poor credit score?",
                                a: "Yes. Vancar Autos works with a wide panel of over 30 UK automotive lenders, including specialist sub-prime lenders dedicated to helping customers with lower credit ratings, past defaults, or limited credit history."
                            },
                            {
                                q: "How long does a finance application take?",
                                a: "Our online application takes approximately 2 minutes to complete. Once submitted, our automated panel system conducts a soft search, and we generally receive underwriting decisions within minutes to a few hours."
                            },
                            {
                                q: "Does applying affect my credit score?",
                                a: "No. Your initial application through Vancar Autos involves a 'soft credit search', which allows lenders to assess your eligibility without leaving a visible footprint on your credit file or impacting your credit rating. A hard search is only conducted later when you formally accept and sign your final finance agreement."
                            },
                            {
                                q: "Can I finance a used car?",
                                a: "Absolutely. All eligible vehicles in our forecourt inventory can be financed through HP or PCP agreements, subject to lender status and vehicle age."
                            },
                            {
                                q: "How much deposit will I need?",
                                a: "Deposit requirements vary depending on the lender and your credit profile. Many of our lenders offer £0 deposit (zero deposit) options, allowing you to drive away without any upfront payment. You can also use your current vehicle as a part-exchange deposit."
                            },
                            {
                                q: "Can I settle my finance agreement early?",
                                a: "Yes. Under the Consumer Credit Act, you have the legal right to settle your finance agreement early at any time. Simply request an early settlement figure from the lender, which will reflect a rebate on any future interest charges."
                            },
                            {
                                q: "When will someone contact me after applying?",
                                a: "Once your application is submitted, you will receive an immediate confirmation email with your reference number. A dedicated Vancar Autos finance specialist will then review your options and contact you via phone or email within 2 to 4 business hours."
                            }
                        ].map((faq, idx) => {
                            const isOpen = openFaq.includes(idx);
                            return (
                                <div key={idx} className={`finance-faq-item ${isOpen ? 'finance-faq-item--open' : ''}`}>
                                    <button 
                                        type="button" 
                                        className="finance-faq-question" 
                                        onClick={() => toggleFaq(idx)}
                                        aria-expanded={isOpen}
                                    >
                                        <span>{faq.q}</span>
                                        <svg 
                                            width="18" 
                                            height="18" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2.5" 
                                            className="finance-faq-chevron"
                                        >
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                    </button>
                                    {isOpen && (
                                        <div className="finance-faq-answer animate-fade-in">
                                            <p>{faq.a}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 8. CONTACT SECTION */}
            <section id="contact-section" className="section bg-white border-t border-slate-100">
                <div className="container">
                    <div className="finance-contact-card shadow-xl">
                        <div className="finance-contact-grid">
                            <div>
                                <span className="finance-section-badge">Here to Help</span>
                                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
                                    Speak to a Vehicle Finance Specialist
                                </h2>
                                <p className="text-slate-600 mb-6 leading-relaxed">
                                    Have specific finance questions or want to discuss a tailored part-exchange deal? 
                                    Our experienced team is on hand 7 days a week.
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[var(--color-accent)] font-bold">
                                            📞
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Direct Phone</span>
                                            <a href="tel:07707700070" className="text-lg font-extrabold text-slate-900 hover:text-[var(--color-accent)]">
                                                07707 700070
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[var(--color-accent)] font-bold">
                                            ✉️
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Email Inquiries</span>
                                            <a href="mailto:hellovancarautos@gmail.com" className="text-sm font-bold text-slate-900 hover:text-[var(--color-accent)]">
                                                hellovancarautos@gmail.com
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[var(--color-accent)] font-bold">
                                            📍
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Showroom Address</span>
                                            <span className="text-sm font-semibold text-slate-800">
                                                Yard 1, Midland Street, Manchester, M12 6LB
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="finance-contact-hours">
                                <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4">Opening Hours</h3>
                                <ul className="space-y-2 text-sm text-slate-200">
                                    <li className="flex justify-between py-1 border-b border-slate-700">
                                        <span>Monday – Friday:</span>
                                        <strong className="text-white">10:00 – 18:00</strong>
                                    </li>
                                    <li className="flex justify-between py-1 border-b border-slate-700">
                                        <span>Saturday:</span>
                                        <strong className="text-white">10:00 – 17:00</strong>
                                    </li>
                                    <li className="flex justify-between py-1 border-b border-slate-700">
                                        <span>Sunday:</span>
                                        <strong className="text-white">10:00 – 16:00</strong>
                                    </li>
                                    <li className="flex justify-between py-1 text-yellow-400 font-semibold">
                                        <span>Bank Holidays:</span>
                                        <span>Closed</span>
                                    </li>
                                </ul>

                                <div className="mt-8 pt-6 border-t border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(true)}
                                        className="btn btn--primary w-full"
                                    >
                                        Start Online Application →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 9. REGULATORY DISCLOSURE & FOOTER */}
            <section className="finance-disclosure">
                <div className="container">
                    <div className="finance-disclosure__inner">
                        <h4 className="finance-disclosure__title">Regulatory & Credit Broker Disclosure</h4>
                        <p className="finance-disclosure__text">
                            Vancar Autos Limited is an independent motor vehicle dealership and credit broker, not a lender. We can introduce you to a carefully selected panel of lenders and their finance products. We do not charge fees for our credit broking services, however, lenders may pay us a fixed fee or a percentage of the amount you borrow for introducing you to them. Any commission received will not affect the amount you pay under your agreement.
                        </p>
                        <p className="finance-disclosure__text">
                            Finance is subject to status, affordability checks, and lender approval. Applicants must be 18 years or older and resident in the United Kingdom. Guarantees or indemnities may be required. 
                            <strong> PLEASE ENSURE YOU CAN AFFORD THE REPAYMENTS FOR THE DURATION OF A LOAN BEFORE ENTERING INTO A CREDIT AGREEMENT.</strong>
                        </p>
                        <p className="finance-disclosure__text finance-disclosure__text--legal">
                            Vancar Autos Limited is registered in England and Wales (Company No: 16593644). Registered office: Yard 1, Midland Street, Manchester, M12 6LB.
                        </p>
                    </div>
                </div>
            </section>

            {/* Application Modal Wizard */}
            <FinanceApplicationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                calculatorData={calculatorPayload}
            />
        </div>
    );
}
