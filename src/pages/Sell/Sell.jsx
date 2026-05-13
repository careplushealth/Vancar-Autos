import { useState } from 'react';
import './Sell.css';

const STEPS = ['Vehicle Info', 'Condition', 'Contact Details', 'Confirmation'];

export default function Sell() {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState({
        registration: '', make: '', model: '', year: '', mileage: '',
        condition: '', serviceHistory: '', accidents: '',
        name: '', email: '', phone: '', message: ''
    });

    const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 0));

    const handleSubmit = (e) => {
        e.preventDefault();
        nextStep();
    };

    return (
        <div className="sell">
            <div className="container">
                <div className="sell__header">
                    <h1 className="sell__title">Sell Your Car</h1>
                    <p className="sell__subtitle">Get a free, no-obligation valuation in minutes</p>
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
                            <h2>Vehicle Information</h2>
                            <div className="sell__form-grid">
                                <div className="form-group">
                                    <label className="form-label">Registration Number</label>
                                    <input className="form-input" placeholder="e.g. AB12 CDE" value={form.registration} onChange={e => update('registration', e.target.value)} />
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
                                <button type="button" className="btn btn--primary btn--lg" onClick={nextStep}>Continue</button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Condition */}
                    {step === 1 && (
                        <div className="sell__panel animate-fade-in">
                            <h2>Vehicle Condition</h2>
                            <div className="sell__form-grid">
                                <div className="form-group">
                                    <label className="form-label">Overall Condition</label>
                                    <div className="sell__option-group">
                                        {['Excellent', 'Good', 'Fair'].map(c => (
                                            <button key={c} type="button" className={`sell__option ${form.condition === c ? 'sell__option--active' : ''}`} onClick={() => update('condition', c)}>{c}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Full Service History?</label>
                                    <div className="sell__option-group">
                                        {['Yes', 'Partial', 'No'].map(o => (
                                            <button key={o} type="button" className={`sell__option ${form.serviceHistory === o ? 'sell__option--active' : ''}`} onClick={() => update('serviceHistory', o)}>{o}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Any Previous Accidents?</label>
                                    <div className="sell__option-group">
                                        {['No', 'Yes - Minor', 'Yes - Major'].map(a => (
                                            <button key={a} type="button" className={`sell__option ${form.accidents === a ? 'sell__option--active' : ''}`} onClick={() => update('accidents', a)}>{a}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="sell__form-actions">
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
                                    <input className="form-input" placeholder="Your name" value={form.name} onChange={e => update('name', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input className="form-input" type="email" placeholder="your@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input className="form-input" type="tel" placeholder="07xxx xxxxxx" value={form.phone} onChange={e => update('phone', e.target.value)} />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Additional Notes</label>
                                    <textarea className="form-input" placeholder="Any other details about your vehicle..." value={form.message} onChange={e => update('message', e.target.value)} />
                                </div>
                            </div>
                            <div className="sell__form-actions">
                                <button type="button" className="btn btn--outline btn--lg" onClick={prevStep}>Back</button>
                                <button type="submit" className="btn btn--primary btn--lg">Submit Valuation Request</button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Confirmation */}
                    {step === 3 && (
                        <div className="sell__panel sell__confirmation animate-fade-in">
                            <div className="sell__confirmation-icon">✓</div>
                            <h2>Thank You!</h2>
                            <p>Your valuation request has been submitted successfully. Our team will review your details and contact you within 24 hours with an offer.</p>
                            <div className="sell__confirmation-summary">
                                <h4>What happens next?</h4>
                                <ol>
                                    <li>Our team reviews your vehicle details</li>
                                    <li>We contact you with a valuation within 24 hours</li>
                                    <li>If you accept, we arrange a convenient collection or drop-off</li>
                                    <li>You get paid the same day!</li>
                                </ol>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
