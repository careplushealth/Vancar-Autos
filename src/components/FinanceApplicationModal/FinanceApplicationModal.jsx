import { useState, useMemo, useEffect } from 'react';
import { submitFinanceApplication } from '../../services/dataService';
import './FinanceApplicationModal.css';

const MARITAL_STATUSES = [
    'Single',
    'Married',
    'Civil Partnership',
    'Living with Partner',
    'Divorced',
    'Widowed'
];

const EMPLOYMENT_STATUSES = [
    'Employed Full-Time',
    'Employed Part-Time',
    'Self-Employed',
    'Retired',
    'Director / Business Owner',
    'Other'
];

export default function FinanceApplicationModal({
    isOpen,
    onClose,
    calculatorData = {},
    vehicle = null
}) {
    // Current active wizard step (1 to 5)
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [applicationRef, setApplicationRef] = useState('');

    // Pre-fill finance details from calculator
    const [formData, setFormData] = useState({
        // Section A: Personal Details
        fullName: '',
        dateOfBirth: '',
        maritalStatus: 'Single',

        // Section B: Address History
        addresses: [
            {
                doorNumber: '',
                street: '',
                town: '',
                postcode: '',
                years: 3,
                months: 0
            }
        ],

        // Section C: Employment Details
        employmentStatus: 'Employed Full-Time',
        jobTitle: '',
        employer: '',
        monthlyIncome: '',

        // Section D: Contact Details
        email: '',
        phone: '',

        // Section E: Bank Details
        bankSortCode: '',
        bankAccountNumber: '',

        // Section F: Finance Details (from calculator)
        borrowAmount: calculatorData.borrowAmount || 10000,
        termYears: calculatorData.termYears || 5,
        creditScore: calculatorData.creditScore || 'Good',
        estimatedMonthly: calculatorData.estimatedMonthly || 222,
        estimatedApr: calculatorData.estimatedApr || 12.9,
        totalRepayable: calculatorData.totalRepayable || 13320,

        // Section G: Consent
        consentGiven: false
    });

    // Update whenever calculatorData changes
    useEffect(() => {
        if (calculatorData) {
            setFormData(prev => ({
                ...prev,
                borrowAmount: calculatorData.borrowAmount || prev.borrowAmount,
                termYears: calculatorData.termYears || prev.termYears,
                creditScore: calculatorData.creditScore || prev.creditScore,
                estimatedMonthly: calculatorData.estimatedMonthly || prev.estimatedMonthly,
                estimatedApr: calculatorData.estimatedApr || prev.estimatedApr,
                totalRepayable: calculatorData.totalRepayable || prev.totalRepayable
            }));
        }
    }, [calculatorData]);

    // Validation errors state
    const [errors, setErrors] = useState({});

    // Lock body scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Calculate total months across addresses
    const totalAddressMonths = useMemo(() => {
        return formData.addresses.reduce((acc, curr) => {
            const y = parseInt(curr.years || 0, 10);
            const m = parseInt(curr.months || 0, 10);
            return acc + (y * 12) + m;
        }, 0);
    }, [formData.addresses]);

    const isThreeYearsCovered = totalAddressMonths >= 36;

    // Field change handlers
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    // Format sort code with dashes (XX-XX-XX)
    const handleSortCodeChange = (e) => {
        const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
        let formatted = cleaned;
        if (cleaned.length > 2 && cleaned.length <= 4) {
            formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
        } else if (cleaned.length > 4) {
            formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4)}`;
        }
        handleChange('bankSortCode', formatted);
    };

    // Account number change
    const handleAccountNumberChange = (e) => {
        const cleaned = e.target.value.replace(/\D/g, '').slice(0, 8);
        handleChange('bankAccountNumber', cleaned);
    };

    // Address list manipulation
    const handleAddressChange = (index, field, value) => {
        const updated = [...formData.addresses];
        updated[index] = { ...updated[index], [field]: value };
        setFormData(prev => ({ ...prev, addresses: updated }));

        if (errors[`address_${index}_${field}`]) {
            setErrors(prev => ({ ...prev, [`address_${index}_${field}`]: null }));
        }
    };

    const addPreviousAddress = () => {
        setFormData(prev => ({
            ...prev,
            addresses: [
                ...prev.addresses,
                { doorNumber: '', street: '', town: '', postcode: '', years: 1, months: 0 }
            ]
        }));
    };

    const removeAddress = (index) => {
        if (formData.addresses.length <= 1) return;
        const updated = formData.addresses.filter((_, idx) => idx !== index);
        setFormData(prev => ({ ...prev, addresses: updated }));
    };

    // Validation per step
    const validateStep = (currentStep) => {
        const newErrors = {};

        if (currentStep === 1) {
            // Personal Details
            if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
                newErrors.fullName = 'Please enter your full name as shown on legal ID';
            }
            if (!formData.dateOfBirth) {
                newErrors.dateOfBirth = 'Please enter your date of birth';
            } else {
                const dob = new Date(formData.dateOfBirth);
                const today = new Date();
                let age = today.getFullYear() - dob.getFullYear();
                const m = today.getMonth() - dob.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                    age--;
                }
                if (age < 18) {
                    newErrors.dateOfBirth = 'You must be at least 18 years old to apply for vehicle finance';
                } else if (age > 100 || isNaN(dob.getTime())) {
                    newErrors.dateOfBirth = 'Please enter a valid date of birth';
                }
            }
        } else if (currentStep === 2) {
            // Address History
            formData.addresses.forEach((addr, idx) => {
                if (!addr.doorNumber.trim()) {
                    newErrors[`address_${idx}_doorNumber`] = 'Door number or house name is required';
                }
                if (!addr.street.trim()) {
                    newErrors[`address_${idx}_street`] = 'Street name is required';
                }
                if (!addr.town.trim()) {
                    newErrors[`address_${idx}_town`] = 'Town / City is required';
                }
                if (!addr.postcode.trim()) {
                    newErrors[`address_${idx}_postcode`] = 'Postcode is required';
                } else {
                    const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
                    if (!ukPostcodeRegex.test(addr.postcode.trim())) {
                        newErrors[`address_${idx}_postcode`] = 'Please enter a valid UK postcode (e.g. M12 6LB)';
                    }
                }
            });

            if (!isThreeYearsCovered) {
                newErrors.addressHistory = `You must provide 3 full years (36 months) of address history. Current total: ${Math.floor(totalAddressMonths / 12)} years ${totalAddressMonths % 12} months. Please add your previous address.`;
            }
        } else if (currentStep === 3) {
            // Employment Details
            if (!formData.jobTitle.trim() || formData.jobTitle.trim().length < 2) {
                newErrors.jobTitle = 'Please enter your current job title';
            }
            if (!formData.employer.trim() || formData.employer.trim().length < 2) {
                newErrors.employer = 'Please enter your employer or company name';
            }
            const income = Number(formData.monthlyIncome);
            if (!formData.monthlyIncome || isNaN(income) || income <= 0) {
                newErrors.monthlyIncome = 'Please enter a valid net monthly take-home income';
            }
        } else if (currentStep === 4) {
            // Contact & Bank Details
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
                newErrors.email = 'Please enter a valid email address';
            }
            const cleanPhone = formData.phone.replace(/[\s()-]/g, '');
            if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 14) {
                newErrors.phone = 'Please enter a valid UK telephone number';
            }

            const cleanSort = formData.bankSortCode.replace(/\D/g, '');
            if (cleanSort.length !== 6) {
                newErrors.bankSortCode = 'Sort code must be 6 digits (XX-XX-XX)';
            }
            const cleanAcc = formData.bankAccountNumber.replace(/\D/g, '');
            if (cleanAcc.length !== 8) {
                newErrors.bankAccountNumber = 'Account number must be 8 digits';
            }
        } else if (currentStep === 5) {
            // Review & Consent
            if (!formData.consentGiven) {
                newErrors.consentGiven = 'You must grant consent to proceed with your finance application.';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(prev => prev + 1);
            // Scroll modal body to top on step change
            const modalBody = document.querySelector('.finance-modal__body');
            if (modalBody) modalBody.scrollTop = 0;
        }
    };

    const handleBack = () => {
        setStep(prev => Math.max(1, prev - 1));
        const modalBody = document.querySelector('.finance-modal__body');
        if (modalBody) modalBody.scrollTop = 0;
    };

    // Submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(5)) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const payload = {
                borrow_amount: formData.borrowAmount,
                term_years: formData.termYears,
                credit_score: formData.creditScore,
                full_name: formData.fullName,
                date_of_birth: formData.dateOfBirth,
                marital_status: formData.maritalStatus,
                addresses: formData.addresses,
                employment_status: formData.employmentStatus,
                job_title: formData.jobTitle,
                employer: formData.employer,
                monthly_income: formData.monthlyIncome,
                email: formData.email,
                phone: formData.phone,
                bank_sort_code: formData.bankSortCode,
                bank_account_number: formData.bankAccountNumber,
                vehicle_id: vehicle ? vehicle.id : null,
                vehicle_details: vehicle ? {
                    id: vehicle.id,
                    title: vehicle.title,
                    make: vehicle.make,
                    model: vehicle.model,
                    year: vehicle.year,
                    registration: vehicle.registration || 'N/A',
                    price: vehicle.price
                } : null,
                consent_given: true
            };

            const result = await submitFinanceApplication(payload);
            setApplicationRef(result.referenceNumber || 'VA-FIN-REF');
            setSubmitSuccess(true);
        } catch (err) {
            console.error(err);
            setSubmitError(err.message || 'An error occurred while submitting your application. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="finance-modal-backdrop" onClick={onClose}>
            <div className="finance-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="finance-modal__header">
                    <div className="finance-modal__header-info">
                        <span className="finance-modal__badge">FCA Regulated Credit Broker</span>
                        <h2 className="finance-modal__title">Vehicle Finance Application</h2>
                        <p className="finance-modal__subtitle">
                            Quick, secure application &bull; Soft credit search won't affect your score
                        </p>
                    </div>
                    <button className="finance-modal__close-btn" onClick={onClose} aria-label="Close modal">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>

                {!submitSuccess ? (
                    <>
                        {/* Progress Stepper */}
                        <div className="finance-modal__stepper">
                            {[
                                { num: 1, label: 'Personal' },
                                { num: 2, label: 'Addresses' },
                                { num: 3, label: 'Income' },
                                { num: 4, label: 'Bank' },
                                { num: 5, label: 'Review' }
                            ].map(s => (
                                <div 
                                    key={s.num} 
                                    className={`finance-modal__step-item ${step === s.num ? 'finance-modal__step-item--active' : ''} ${step > s.num ? 'finance-modal__step-item--completed' : ''}`}
                                >
                                    <div className="finance-modal__step-circle">
                                        {step > s.num ? '✓' : s.num}
                                    </div>
                                    <span className="finance-modal__step-label">{s.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Modal Body */}
                        <div className="finance-modal__body">
                            {/* Summary Pill for Borrow Amount */}
                            <div className="finance-modal__finance-summary-bar">
                                <div className="finance-modal__summary-col">
                                    <span className="finance-modal__summary-label">Borrow Amount</span>
                                    <strong className="finance-modal__summary-val">£{Number(formData.borrowAmount).toLocaleString('en-GB')}</strong>
                                </div>
                                <div className="finance-modal__summary-col">
                                    <span className="finance-modal__summary-label">Term</span>
                                    <strong className="finance-modal__summary-val">{formData.termYears} Years</strong>
                                </div>
                                <div className="finance-modal__summary-col">
                                    <span className="finance-modal__summary-label">Est. Monthly</span>
                                    <strong className="finance-modal__summary-val finance-modal__summary-val--green">£{Number(formData.estimatedMonthly).toLocaleString('en-GB')}</strong>
                                </div>
                                <div className="finance-modal__summary-col">
                                    <span className="finance-modal__summary-label">Representative APR</span>
                                    <strong className="finance-modal__summary-val">{formData.estimatedApr}%</strong>
                                </div>
                            </div>

                            {/* STEP 1: Personal Details */}
                            {step === 1 && (
                                <div className="finance-modal__step-content animate-fade-in">
                                    <h3 className="finance-modal__step-heading">Section A: Personal Details</h3>
                                    <p className="finance-modal__step-desc">Please enter your legal personal details exactly as they appear on your driving licence or passport.</p>

                                    <div className="form-group mb-4">
                                        <label className="form-label font-bold text-xs text-slate-700 uppercase">
                                            Full Legal Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-input ${errors.fullName ? 'form-input--error' : ''}`}
                                            placeholder="e.g. John Alexander Smith"
                                            value={formData.fullName}
                                            onChange={e => handleChange('fullName', e.target.value)}
                                        />
                                        {errors.fullName && <span className="form-error">{errors.fullName}</span>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="form-group">
                                            <label className="form-label font-bold text-xs text-slate-700 uppercase">
                                                Date of Birth <span className="text-red-500">* (18+ only)</span>
                                            </label>
                                            <input
                                                type="date"
                                                className={`form-input ${errors.dateOfBirth ? 'form-input--error' : ''}`}
                                                value={formData.dateOfBirth}
                                                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                                                onChange={e => handleChange('dateOfBirth', e.target.value)}
                                            />
                                            {errors.dateOfBirth && <span className="form-error">{errors.dateOfBirth}</span>}
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label font-bold text-xs text-slate-700 uppercase">
                                                Marital Status
                                            </label>
                                            <select
                                                className="form-select"
                                                value={formData.maritalStatus}
                                                onChange={e => handleChange('maritalStatus', e.target.value)}
                                            >
                                                {MARITAL_STATUSES.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Address History */}
                            {step === 2 && (
                                <div className="finance-modal__step-content animate-fade-in">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                                        <div>
                                            <h3 className="finance-modal__step-heading">Section B: 3-Year Address History</h3>
                                            <p className="finance-modal__step-desc">Underwriters require at least 3 continuous years (36 months) of UK address records.</p>
                                        </div>
                                        <div className={`finance-modal__address-status-pill ${isThreeYearsCovered ? 'finance-modal__address-status-pill--success' : 'finance-modal__address-status-pill--warning'}`}>
                                            {isThreeYearsCovered ? '✓ 3 Years Covered' : `Covered: ${Math.floor(totalAddressMonths / 12)}y ${totalAddressMonths % 12}m / 3y needed`}
                                        </div>
                                    </div>

                                    {errors.addressHistory && (
                                        <div className="finance-modal__alert finance-modal__alert--warning mb-4">
                                            {errors.addressHistory}
                                        </div>
                                    )}

                                    {formData.addresses.map((addr, idx) => (
                                        <div key={idx} className="finance-modal__address-card">
                                            <div className="finance-modal__address-header">
                                                <h4 className="finance-modal__address-title">
                                                    {idx === 0 ? 'Current Address' : `Previous Address #${idx}`}
                                                </h4>
                                                {idx > 0 && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeAddress(idx)} 
                                                        className="text-xs text-red-500 font-semibold hover:underline"
                                                    >
                                                        Remove Address
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                <div className="form-group">
                                                    <label className="form-label text-xs font-semibold">House No. / Name & Street <span className="text-red-500">*</span></label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Flat 4, 12 Elm Grove"
                                                        className={`form-input ${errors[`address_${idx}_doorNumber`] || errors[`address_${idx}_street`] ? 'form-input--error' : ''}`}
                                                        value={addr.doorNumber ? `${addr.doorNumber} ${addr.street}`.trim() : addr.street}
                                                        onChange={e => {
                                                            const parts = e.target.value.split(' ');
                                                            const door = parts[0] || '';
                                                            const street = parts.slice(1).join(' ') || door;
                                                            handleAddressChange(idx, 'doorNumber', door);
                                                            handleAddressChange(idx, 'street', street);
                                                        }}
                                                    />
                                                    {(errors[`address_${idx}_doorNumber`] || errors[`address_${idx}_street`]) && (
                                                        <span className="form-error">Address street is required</span>
                                                    )}
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label text-xs font-semibold">Town / City <span className="text-red-500">*</span></label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Manchester"
                                                        className={`form-input ${errors[`address_${idx}_town`] ? 'form-input--error' : ''}`}
                                                        value={addr.town}
                                                        onChange={e => handleAddressChange(idx, 'town', e.target.value)}
                                                    />
                                                    {errors[`address_${idx}_town`] && <span className="form-error">{errors[`address_${idx}_town`]}</span>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div className="form-group">
                                                    <label className="form-label text-xs font-semibold">Postcode <span className="text-red-500">*</span></label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. M12 6LB"
                                                        className={`form-input uppercase ${errors[`address_${idx}_postcode`] ? 'form-input--error' : ''}`}
                                                        value={addr.postcode}
                                                        onChange={e => handleAddressChange(idx, 'postcode', e.target.value.toUpperCase())}
                                                    />
                                                    {errors[`address_${idx}_postcode`] && <span className="form-error">{errors[`address_${idx}_postcode`]}</span>}
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label text-xs font-semibold">Years at address</label>
                                                    <select
                                                        className="form-select"
                                                        value={addr.years}
                                                        onChange={e => handleAddressChange(idx, 'years', parseInt(e.target.value, 10))}
                                                    >
                                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map(y => (
                                                            <option key={y} value={y}>{y} {y === 1 ? 'Year' : 'Years'}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label text-xs font-semibold">Months at address</label>
                                                    <select
                                                        className="form-select"
                                                        value={addr.months}
                                                        onChange={e => handleAddressChange(idx, 'months', parseInt(e.target.value, 10))}
                                                    >
                                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(m => (
                                                            <option key={m} value={m}>{m} {m === 1 ? 'Month' : 'Months'}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {!isThreeYearsCovered && (
                                        <button
                                            type="button"
                                            onClick={addPreviousAddress}
                                            className="btn btn--outline btn--sm w-full mt-2"
                                            style={{ borderStyle: 'dashed' }}
                                        >
                                            + Add Previous Address (Cover 3 Years)
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* STEP 3: Employment Details */}
                            {step === 3 && (
                                <div className="finance-modal__step-content animate-fade-in">
                                    <h3 className="finance-modal__step-heading">Section C: Employment & Income</h3>
                                    <p className="finance-modal__step-desc">Your employment information is used strictly to assess loan affordability and repayment suitability.</p>

                                    <div className="form-group mb-4">
                                        <label className="form-label font-bold text-xs text-slate-700 uppercase">
                                            Employment Status
                                        </label>
                                        <select
                                            className="form-select"
                                            value={formData.employmentStatus}
                                            onChange={e => handleChange('employmentStatus', e.target.value)}
                                        >
                                            {EMPLOYMENT_STATUSES.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="form-group">
                                            <label className="form-label font-bold text-xs text-slate-700 uppercase">
                                                Job Title <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-input ${errors.jobTitle ? 'form-input--error' : ''}`}
                                                placeholder="e.g. Sales Manager, Electrician"
                                                value={formData.jobTitle}
                                                onChange={e => handleChange('jobTitle', e.target.value)}
                                            />
                                            {errors.jobTitle && <span className="form-error">{errors.jobTitle}</span>}
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label font-bold text-xs text-slate-700 uppercase">
                                                Employer / Company Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-input ${errors.employer ? 'form-input--error' : ''}`}
                                                placeholder="e.g. ACME Logistics Ltd"
                                                value={formData.employer}
                                                onChange={e => handleChange('employer', e.target.value)}
                                            />
                                            {errors.employer && <span className="form-error">{errors.employer}</span>}
                                        </div>
                                    </div>

                                    <div className="form-group mb-4">
                                        <label className="form-label font-bold text-xs text-slate-700 uppercase">
                                            Net Monthly Income (£) <span className="text-red-500">* (Take-home pay after tax)</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">£</span>
                                            <input
                                                type="number"
                                                className={`form-input pl-8 ${errors.monthlyIncome ? 'form-input--error' : ''}`}
                                                placeholder="e.g. 2400"
                                                value={formData.monthlyIncome}
                                                onChange={e => handleChange('monthlyIncome', e.target.value)}
                                            />
                                        </div>
                                        {errors.monthlyIncome && <span className="form-error">{errors.monthlyIncome}</span>}
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: Contact & Bank Details */}
                            {step === 4 && (
                                <div className="finance-modal__step-content animate-fade-in">
                                    <h3 className="finance-modal__step-heading">Section D & E: Contact & Bank Details</h3>
                                    <p className="finance-modal__step-desc">Provide your contact info and UK bank account details. These are required by lenders for identity verification.</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="form-group">
                                            <label className="form-label font-bold text-xs text-slate-700 uppercase">
                                                Email Address <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                                                placeholder="e.g. john@example.com"
                                                value={formData.email}
                                                onChange={e => handleChange('email', e.target.value)}
                                            />
                                            {errors.email && <span className="form-error">{errors.email}</span>}
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label font-bold text-xs text-slate-700 uppercase">
                                                Telephone Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                className={`form-input ${errors.phone ? 'form-input--error' : ''}`}
                                                placeholder="e.g. 07700 900123"
                                                value={formData.phone}
                                                onChange={e => handleChange('phone', e.target.value)}
                                            />
                                            {errors.phone && <span className="form-error">{errors.phone}</span>}
                                        </div>
                                    </div>

                                    {/* Bank Details Box */}
                                    <div className="finance-modal__bank-box">
                                        <div className="finance-modal__bank-header">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                            <span>Bank Account Details (Encrypted AES-256)</span>
                                        </div>
                                        <p className="finance-modal__bank-note">
                                            Your account details are used by our panel lenders solely to verify your identity and affordability. We never take any unauthorized payments or upfront arrangement fees.
                                        </p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                            <div className="form-group">
                                                <label className="form-label font-bold text-xs text-slate-700 uppercase">
                                                    Sort Code (6 digits) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    maxLength="8"
                                                    placeholder="e.g. 20-40-60"
                                                    className={`form-input font-mono ${errors.bankSortCode ? 'form-input--error' : ''}`}
                                                    value={formData.bankSortCode}
                                                    onChange={handleSortCodeChange}
                                                />
                                                {errors.bankSortCode && <span className="form-error">{errors.bankSortCode}</span>}
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label font-bold text-xs text-slate-700 uppercase">
                                                    Account Number (8 digits) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    maxLength="8"
                                                    placeholder="e.g. 12345678"
                                                    className={`form-input font-mono ${errors.bankAccountNumber ? 'form-input--error' : ''}`}
                                                    value={formData.bankAccountNumber}
                                                    onChange={handleAccountNumberChange}
                                                />
                                                {errors.bankAccountNumber && <span className="form-error">{errors.bankAccountNumber}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 5: Final Review & Consent */}
                            {step === 5 && (
                                <div className="finance-modal__step-content animate-fade-in">
                                    <h3 className="finance-modal__step-heading">Section F & G: Review & Submit</h3>
                                    <p className="finance-modal__step-desc">Please review your application summary carefully before submitting for underwriting.</p>

                                    <div className="finance-modal__review-grid">
                                        <div className="finance-modal__review-card">
                                            <h4 className="finance-modal__review-title">Finance Selection</h4>
                                            <div className="finance-modal__review-row">
                                                <span>Amount to Borrow:</span>
                                                <strong>£{Number(formData.borrowAmount).toLocaleString('en-GB')}</strong>
                                            </div>
                                            <div className="finance-modal__review-row">
                                                <span>Term:</span>
                                                <strong>{formData.termYears} Years ({formData.termYears * 12} Months)</strong>
                                            </div>
                                            <div className="finance-modal__review-row">
                                                <span>Estimated Repayment:</span>
                                                <strong className="text-[var(--color-accent)]">£{Number(formData.estimatedMonthly).toLocaleString('en-GB')} / month</strong>
                                            </div>
                                            <div className="finance-modal__review-row">
                                                <span>Representative APR:</span>
                                                <strong>{formData.estimatedApr}%</strong>
                                            </div>
                                            <div className="finance-modal__review-row">
                                                <span>Total Repayable:</span>
                                                <strong>£{Number(formData.totalRepayable).toLocaleString('en-GB')}</strong>
                                            </div>
                                        </div>

                                        <div className="finance-modal__review-card">
                                            <h4 className="finance-modal__review-title">Applicant Summary</h4>
                                            <div className="finance-modal__review-row">
                                                <span>Full Name:</span>
                                                <strong>{formData.fullName}</strong>
                                            </div>
                                            <div className="finance-modal__review-row">
                                                <span>DOB:</span>
                                                <strong>{formData.dateOfBirth}</strong>
                                            </div>
                                            <div className="finance-modal__review-row">
                                                <span>Email:</span>
                                                <strong>{formData.email}</strong>
                                            </div>
                                            <div className="finance-modal__review-row">
                                                <span>Phone:</span>
                                                <strong>{formData.phone}</strong>
                                            </div>
                                            <div className="finance-modal__review-row">
                                                <span>Current Address:</span>
                                                <span>{formData.addresses[0]?.doorNumber} {formData.addresses[0]?.street}, {formData.addresses[0]?.postcode}</span>
                                            </div>
                                            <div className="finance-modal__review-row">
                                                <span>Employment:</span>
                                                <strong>{formData.jobTitle} at {formData.employer}</strong>
                                            </div>
                                            <div className="finance-modal__review-row">
                                                <span>Bank Account:</span>
                                                <span className="font-mono text-xs">Sort: **-**-{formData.bankSortCode.replace(/\D/g, '').slice(-2)} | Acc: ****{formData.bankAccountNumber.slice(-4)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Consent & Privacy Notice */}
                                    <div className="finance-modal__consent-card">
                                        <label className="finance-modal__consent-label">
                                            <input
                                                type="checkbox"
                                                className="finance-modal__checkbox"
                                                checked={formData.consentGiven}
                                                onChange={e => handleChange('consentGiven', e.target.checked)}
                                            />
                                            <span className="text-xs text-slate-700 leading-relaxed">
                                                I confirm that all details provided are complete and accurate. I explicitly authorize Vancar Autos Limited to share my application with its panel of FCA-authorized lenders for the purpose of a soft credit assessment that will <strong>not</strong> impact my credit score.
                                            </span>
                                        </label>
                                        {errors.consentGiven && <span className="form-error block mt-2">{errors.consentGiven}</span>}
                                    </div>

                                    {submitError && (
                                        <div className="finance-modal__alert finance-modal__alert--error mb-4">
                                            <strong>Submission Failed:</strong> {submitError}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer Controls */}
                        <div className="finance-modal__footer">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="btn btn--outline btn--sm"
                                    disabled={isSubmitting}
                                >
                                    ← Back
                                </button>
                            ) : (
                                <div />
                            )}

                            {step < 5 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="btn btn--primary btn--sm"
                                >
                                    Continue →
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !formData.consentGiven}
                                    className="btn btn--primary btn--sm flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                                            Submitting Securely...
                                        </>
                                    ) : (
                                        'Submit Application ✓'
                                    )}
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    /* Post-Submission Success Screen */
                    <div className="finance-modal__success animate-scale-up">
                        <div className="finance-modal__success-icon">✓</div>
                        <h3 className="finance-modal__success-title">Application Submitted!</h3>
                        <p className="finance-modal__success-subtitle">
                            Thank you, {formData.fullName}. Your vehicle finance application has been securely transmitted.
                        </p>

                        <div className="finance-modal__ref-box">
                            <span className="finance-modal__ref-label">Your Application Reference</span>
                            <strong className="finance-modal__ref-number">{applicationRef}</strong>
                        </div>

                        <div className="finance-modal__next-steps">
                            <h4>What happens next?</h4>
                            <div className="finance-modal__next-step-item">
                                <span className="finance-modal__step-num">1</span>
                                <div>
                                    <strong>Application Received & Logged</strong>
                                    <p>A confirmation email has been dispatched to <strong>{formData.email}</strong> with your application reference.</p>
                                </div>
                            </div>
                            <div className="finance-modal__next-step-item">
                                <span className="finance-modal__step-num">2</span>
                                <div>
                                    <strong>Panel Lender Matching</strong>
                                    <p>Our underwriting partners are performing a soft eligibility check across 30+ UK automotive lenders.</p>
                                </div>
                            </div>
                            <div className="finance-modal__next-step-item">
                                <span className="finance-modal__step-num">3</span>
                                <div>
                                    <strong>Dedicated Advisor Contact</strong>
                                    <p>A Vancar Autos finance specialist will contact you on <strong>{formData.phone}</strong> within 2-4 business hours.</p>
                                </div>
                            </div>
                        </div>

                        <button 
                            className="btn btn--primary w-full mt-6"
                            onClick={onClose}
                        >
                            Return to Website
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
