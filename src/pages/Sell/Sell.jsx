import { useState } from 'react';
import { submitInquiry, lookupVehicle, getConditionValuation } from '../../services/dataService';
import './Sell.css';

const STEPS = ['Vehicle Info', 'Condition', 'Contact Details', 'Confirmation'];

export default function Sell() {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState({
        registration: '', make: '', model: '', year: '', mileage: '',
        condition: 'Good', serviceHistory: 'Yes', accidents: 'No',
        name: '', email: '', phone: '', message: ''
    });
    
    const [isManual, setIsManual] = useState(false);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState(null);
    const [vehicleDetails, setVehicleDetails] = useState(null);
    const [valuation, setValuation] = useState(null);
    const [valuationLoading, setValuationLoading] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 0));

    const handleLookup = async (e) => {
        if (e) e.preventDefault();
        if (!form.registration.trim()) {
            setLookupError('Please enter your vehicle registration.');
            return;
        }
        if (!form.mileage) {
            setLookupError('Please enter your vehicle mileage to calculate a valuation.');
            return;
        }

        setLookupLoading(true);
        setLookupError(null);
        setVehicleDetails(null);
        setValuation(null);

        try {
            const data = await lookupVehicle(form.registration, form.mileage);
            if (data.vehicle) {
                setVehicleDetails(data.vehicle);
                setValuation(data.valuations);
                setForm(prev => ({
                    ...prev,
                    make: data.vehicle.make || '',
                    model: data.vehicle.model || '',
                    year: data.vehicle.year || '',
                }));
            } else {
                throw new Error('Vehicle details unavailable.');
            }
        } catch (err) {
            console.error(err);
            setLookupError('We couldn\'t find your vehicle registration. Please verify it or enter details manually.');
        } finally {
            setLookupLoading(false);
        }
    };

    const handleConditionChange = async (newCondition) => {
        update('condition', newCondition);
        if (vehicleDetails && vehicleDetails.derivativeId && !isManual) {
            setValuationLoading(true);
            try {
                let atCondition = 'Good';
                if (newCondition === 'Excellent') atCondition = 'Excellent';
                else if (newCondition === 'Fair') atCondition = 'Fair';
                
                const data = await getConditionValuation(
                    vehicleDetails.derivativeId,
                    vehicleDetails.firstRegistrationDate,
                    form.mileage,
                    atCondition
                );
                if (data.valuations) {
                    setValuation(data.valuations);
                }
            } catch (err) {
                console.error('Failed to update valuation based on condition:', err);
            } finally {
                setValuationLoading(false);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await submitInquiry({
                type: 'sell_valuation',
                name: form.name,
                email: form.email,
                phone: form.phone,
                subject: `Valuation Request: ${form.make} ${form.model} (${form.registration.toUpperCase()})`,
                message: form.message,
                vehicle_details: {
                    registration: form.registration,
                    make: form.make,
                    model: form.model,
                    year: form.year,
                    mileage: form.mileage,
                    condition: form.condition,
                    serviceHistory: form.serviceHistory,
                    accidents: form.accidents,
                    autotrader_valuation: valuation ? {
                        trade: valuation.trade?.amountGBP || null,
                        partExchange: valuation.partExchange?.amountGBP || null,
                        retail: valuation.retail?.amountGBP || null,
                        private: valuation.private?.amountGBP || null,
                        derivativeId: vehicleDetails?.derivativeId || null,
                        derivativeName: vehicleDetails?.derivative || null
                    } : null
                }
            });
            nextStep();
        } catch (err) {
            console.error(err);
            setError('Failed to submit valuation request. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        if (!price) return 'N/A';
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            minimumFractionDigits: 0
        }).format(price);
    };

    return (
        <div className="sell">
            <div className="container">
                <div className="sell__header">
                    <h1 className="sell__title">Sell Your Car</h1>
                    <p className="sell__subtitle">Get an instant estimation and a free dealer offer valuation</p>
                </div>

                {/* Progress Steps */}
                <div className="sell__steps">
                    {STEPS.map((s, i) => (
                        <div key={s} className={`sell__step ${i <= step ? 'sell__step--active' : ''} ${i < step ? 'sell__step--done' : ''}`}>
                            <div className="sell__step-number">{i < step ? '✓' : i + 1}</div>
                            <span className="sell__step-label">{s}</span>
                        </div>
                    ))}
                </div>

                <form className="sell__form" onSubmit={handleSubmit}>
                    {/* Step 1: Vehicle Info */}
                    {step === 0 && (
                        <div className="sell__panel animate-fade-in">
                            <h2>Vehicle Details</h2>
                            {!isManual ? (
                                <div className="sell__lookup-section">
                                    <p className="sell__lookup-intro">
                                        Enter your registration number and current mileage to instantly retrieve your vehicle specs and live market valuation.
                                    </p>
                                    
                                    <div className="sell__lookup-row">
                                        <div className="form-group registration-input-group">
                                            <label className="form-label">Registration Number</label>
                                            <div className="plate-input-container">
                                                <span className="plate-uk-badge">GB</span>
                                                <input 
                                                    className="form-input plate-input" 
                                                    placeholder="AB12 CDE" 
                                                    value={form.registration} 
                                                    onChange={e => update('registration', e.target.value)} 
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group mileage-input-group">
                                            <label className="form-label">Odometer Reading (Miles)</label>
                                            <input 
                                                className="form-input" 
                                                type="number"
                                                placeholder="e.g. 25000" 
                                                value={form.mileage} 
                                                onChange={e => update('mileage', e.target.value)} 
                                            />
                                        </div>
                                    </div>

                                    {lookupError && (
                                        <div className="sell__lookup-error">
                                            {lookupError}
                                        </div>
                                    )}

                                    {!vehicleDetails && (
                                        <div className="sell__lookup-actions">
                                            <button 
                                                type="button" 
                                                className="btn btn--primary btn--lg" 
                                                onClick={handleLookup}
                                                disabled={lookupLoading}
                                            >
                                                {lookupLoading ? (
                                                    <>
                                                        <span className="mini-spinner"></span> Retrieving Specs...
                                                    </>
                                                ) : 'Find My Vehicle'}
                                            </button>
                                            <button 
                                                type="button" 
                                                className="btn btn--link"
                                                onClick={() => setIsManual(true)}
                                            >
                                                Enter Details Manually
                                            </button>
                                        </div>
                                    )}

                                    {vehicleDetails && (
                                        <div className="sell__spec-card animate-slide-up">
                                            <div className="sell__spec-card-header">
                                                <span className="sell__spec-plate">{vehicleDetails.registration}</span>
                                                <h3 className="sell__spec-title">{vehicleDetails.make} {vehicleDetails.model}</h3>
                                                <p className="sell__spec-desc">{vehicleDetails.derivative}</p>
                                            </div>
                                            <div className="sell__spec-grid">
                                                <div className="sell__spec-item">
                                                    <span className="sell__spec-label">Year</span>
                                                    <span className="sell__spec-value">{vehicleDetails.year}</span>
                                                </div>
                                                <div className="sell__spec-item">
                                                    <span className="sell__spec-label">Gearbox</span>
                                                    <span className="sell__spec-value">{vehicleDetails.transmissionType}</span>
                                                </div>
                                                <div className="sell__spec-item">
                                                    <span className="sell__spec-label">Fuel</span>
                                                    <span className="sell__spec-value">{vehicleDetails.fuelType}</span>
                                                </div>
                                                <div className="sell__spec-item">
                                                    <span className="sell__spec-label">Colour</span>
                                                    <span className="sell__spec-value">{vehicleDetails.colour}</span>
                                                </div>
                                            </div>

                                            <div className="sell__confirmation-prompt">
                                                <p>Is this your vehicle?</p>
                                                <div className="sell__confirmation-buttons">
                                                    <button 
                                                        type="button" 
                                                        className="btn btn--primary" 
                                                        onClick={nextStep}
                                                    >
                                                        Yes, Continue
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        className="btn btn--outline" 
                                                        onClick={() => {
                                                            setVehicleDetails(null);
                                                            setValuation(null);
                                                            update('registration', '');
                                                        }}
                                                    >
                                                        No, Search Again
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="sell__manual-section">
                                    <div className="sell__form-grid">
                                        <div className="form-group">
                                            <label className="form-label">Registration Number (Optional)</label>
                                            <input className="form-input" placeholder="AB12 CDE" value={form.registration} onChange={e => update('registration', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Make</label>
                                            <input className="form-input" placeholder="e.g. BMW" value={form.make} onChange={e => update('make', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Model</label>
                                            <input className="form-input" placeholder="e.g. X5" value={form.model} onChange={e => update('model', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Year</label>
                                            <input className="form-input" type="number" placeholder="e.g. 2022" value={form.year} onChange={e => update('year', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Mileage</label>
                                            <input className="form-input" type="number" placeholder="e.g. 25000" value={form.mileage} onChange={e => update('mileage', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="sell__form-actions">
                                        <button type="button" className="btn btn--link" onClick={() => setIsManual(false)}>Use Registration Lookup</button>
                                        <button type="button" className="btn btn--primary btn--lg" onClick={nextStep} disabled={!form.make || !form.model || !form.mileage}>Continue</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Condition & Dynamic Valuation */}
                    {step === 1 && (
                        <div className="sell__panel sell__panel--valuation animate-fade-in">
                            <div className="sell__step2-layout">
                                <div className="sell__step2-inputs">
                                    <h2>Vehicle Condition</h2>
                                    <div className="sell__form-grid">
                                        <div className="form-group">
                                            <label className="form-label">Overall Condition</label>
                                            <div className="sell__option-group">
                                                {['Excellent', 'Good', 'Fair'].map(c => (
                                                    <button 
                                                        key={c} 
                                                        type="button" 
                                                        className={`sell__option ${form.condition === c ? 'sell__option--active' : ''}`} 
                                                        onClick={() => handleConditionChange(c)}
                                                    >
                                                        {c}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Full Service History?</label>
                                            <div className="sell__option-group">
                                                {['Yes', 'Partial', 'No'].map(o => (
                                                    <button 
                                                        key={o} 
                                                        type="button" 
                                                        className={`sell__option ${form.serviceHistory === o ? 'sell__option--active' : ''}`} 
                                                        onClick={() => update('serviceHistory', o)}
                                                    >
                                                        {o}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Any Previous Accidents?</label>
                                            <div className="sell__option-group">
                                                {['No', 'Yes - Minor', 'Yes - Major'].map(a => (
                                                    <button 
                                                        key={a} 
                                                        type="button" 
                                                        className={`sell__option ${form.accidents === a ? 'sell__option--active' : ''}`} 
                                                        onClick={() => update('accidents', a)}
                                                    >
                                                        {a}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="sell__step2-valuation">
                                    <h2>Estimated Offer</h2>
                                    {valuation ? (
                                        <div className={`sell__val-card ${valuationLoading ? 'sell__val-card--loading' : ''}`}>
                                            {valuationLoading && <div className="valuation-overlay-spinner"></div>}
                                            <div className="sell__val-brand-badge">AutoTrader Valuation</div>
                                            <div className="sell__val-offer">
                                                <span className="sell__val-price-label">Estimated Dealership Offer</span>
                                                <span className="sell__val-price">
                                                    {formatPrice(valuation.partExchange?.amountGBP)}
                                                </span>
                                                <p className="sell__val-guarantee-text">
                                                    Offer subject to visual inspection. Final offer may vary based on actual condition and options.
                                                </p>
                                            </div>
                                            <div className="sell__val-metrics">
                                                <div className="sell__val-metric">
                                                    <span>Private Sale Value</span>
                                                    <strong>{formatPrice(valuation.private?.amountGBP)}</strong>
                                                </div>
                                                <div className="sell__val-metric">
                                                    <span>Dealer Retail Value</span>
                                                    <strong>{formatPrice(valuation.retail?.amountGBP)}</strong>
                                                </div>
                                            </div>
                                            <div className="sell__val-footer">
                                                <span className="autotrader-badge-icon">AT</span>
                                                <span>Powered by Auto Trader Connect</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="sell__val-card sell__val-card--placeholder">
                                            <div className="sell__val-placeholder-icon">💰</div>
                                            <h3>Manual Estimation</h3>
                                            <p>Since details were entered manually, our valuation specialists will calculate a custom offer for your car within 24 hours.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="sell__form-actions sell__form-actions--spaced">
                                <button type="button" className="btn btn--outline btn--lg" onClick={prevStep}>Back</button>
                                <button type="button" className="btn btn--primary btn--lg" onClick={nextStep}>Continue</button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Contact Details */}
                    {step === 2 && (
                        <div className="sell__panel animate-fade-in">
                            <h2>Contact Details</h2>
                            <div className="sell__form-grid">
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input className="form-input" placeholder="Your name" value={form.name} onChange={e => update('name', e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input className="form-input" type="email" placeholder="your@email.com" value={form.email} onChange={e => update('email', e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input className="form-input" type="tel" placeholder="07xxx xxxxxx" value={form.phone} onChange={e => update('phone', e.target.value)} required />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Additional Notes</label>
                                    <textarea className="form-input" placeholder="Any other details about your vehicle (e.g. factory options, modifications, tyre condition)..." value={form.message} onChange={e => update('message', e.target.value)} />
                                </div>
                            </div>
                            {error && (
                                <div style={{ color: 'var(--color-error)', width: '100%', marginBottom: '1rem', fontWeight: 'bold' }}>
                                    {error}
                                </div>
                            )}
                            <div className="sell__form-actions">
                                <button type="button" className="btn btn--outline btn--lg" onClick={prevStep} disabled={loading}>Back</button>
                                <button type="submit" className="btn btn--primary btn--lg" disabled={loading}>
                                    {loading ? 'Submitting Request...' : 'Submit & Request Buying Offer'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Confirmation */}
                    {step === 3 && (
                        <div className="sell__panel sell__confirmation animate-fade-in">
                            <div className="sell__confirmation-icon">✓</div>
                            <h2>Thank You, {form.name}!</h2>
                            <p>Your vehicle valuation request has been submitted successfully.</p>
                            
                            {valuation && (
                                <div className="sell__confirmation-offer-summary">
                                    <p>Estimated Buying Offer:</p>
                                    <h3>{formatPrice(valuation.partExchange?.amountGBP)}</h3>
                                    <span>Based on Auto Trader market metrics for {form.make} {form.model}</span>
                                </div>
                            )}

                            <div className="sell__confirmation-summary">
                                <h4>What happens next?</h4>
                                <ol>
                                    <li>Our acquisition specialists will review your vehicle details</li>
                                    <li>We will contact you via email or phone to arrange a quick visual check</li>
                                    <li>We inspect the vehicle (in person or via a video call)</li>
                                    <li>If everything matches, we complete the bank transfer the same day!</li>
                                </ol>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

