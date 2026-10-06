import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { submitInquiry } from '../../services/dataService';
import './Concierge.css';

const FAQS = [
    {
        q: "Is there an upfront search fee or deposit to start?",
        a: "No. Opening a vehicle search with Vancar Autos is completely free with zero upfront fees and no deposit. You only pay for the vehicle once we have located it, you have inspected and approved it, and we agree to proceed."
    },
    {
        q: "Am I obligated to buy the car you find?",
        a: "Not at all. We will present you with vehicle options, high-definition photographs, walkaround videos, and complete HPI provenance records. If a vehicle doesn't match your expectations, you are under no obligation to proceed, and we will simply continue our search."
    },
    {
        q: "How long does the vehicle sourcing process usually take?",
        a: "Most vehicle briefs are fulfilled within 1 to 3 weeks. If you have very unique or rare specifications, it may take slightly longer, but we will provide an honest timeline during our initial consultation and keep you regularly updated."
    },
    {
        q: "Can I trade in or part-exchange my current vehicle?",
        a: "Yes, absolutely. We can appraise your current car or van upfront and deduct its valuation directly from the purchase price of your sourced vehicle, keeping the entire transaction seamless."
    },
    {
        q: "Can I finance a vehicle sourced through Concierge?",
        a: "Yes. Sourced vehicles are eligible for the same competitive Hire Purchase (HP) and PCP finance packages as our showroom forecourt stock. We can arrange a decision in principle before we even begin searching."
    },
    {
        q: "Do you source commercial vans as well as cars?",
        a: "Yes! Alongside personal and luxury cars, we regularly source commercial vans and light commercial vehicles for sole traders and businesses, all held to the exact same rigorous workshop inspection standards."
    }
];

export default function Concierge() {
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        makeModel: '',
        budget: '',
        condition: 'Any',
        fuel: 'Any',
        transmission: 'Any',
        maxMileage: 'Any',
        hasPartExchange: 'No',
        partExchangeDetails: '',
        timeline: 'Within 2 weeks',
        notes: ''
    });

    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submittedData, setSubmittedData] = useState(null);
    const [error, setError] = useState(null);
    const [openFaq, setOpenFaq] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = "Vehicle Concierge & Sourcing | Vancar Autos Manchester";
    }, []);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Basic phone & email validation
        if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.makeModel.trim()) {
            setError('Please fill in all required fields (Name, Email, Phone, and Preferred Vehicle).');
            setLoading(false);
            return;
        }

        const formattedBudget = form.budget 
            ? (!isNaN(form.budget) ? `£${Number(form.budget).toLocaleString('en-GB')}` : form.budget)
            : 'Not specified / Flexible';

        const formattedMessage = [
            `=== VEHICLE SOURCING CONCIERGE BRIEF ===`,
            `Preferred Vehicle / Make & Model: ${form.makeModel.trim()}`,
            `Target Budget: ${formattedBudget}`,
            `Condition / Age Preference: ${form.condition}`,
            `Fuel Preference: ${form.fuel}`,
            `Transmission: ${form.transmission}`,
            `Maximum Mileage: ${form.maxMileage}`,
            `Part Exchange: ${form.hasPartExchange}${form.hasPartExchange === 'Yes' && form.partExchangeDetails ? ` (Details: ${form.partExchangeDetails.trim()})` : ''}`,
            `Purchase Timeline: ${form.timeline}`,
            ``,
            `Customer Requirements & Additional Notes:`,
            form.notes.trim() || 'No additional notes provided.'
        ].join('\n');

        try {
            await submitInquiry({
                type: 'contact',
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                subject: `Concierge Sourcing: ${form.makeModel.trim()} (${formattedBudget})`,
                message: formattedMessage
            });

            setSubmittedData({
                name: form.name,
                makeModel: form.makeModel,
                budget: formattedBudget,
                email: form.email
            });
            setSubmitted(true);
        } catch (err) {
            console.error('Error submitting concierge enquiry:', err);
            setError('Failed to submit your brief. Please check your network connection or call us directly on 07386 533337.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setForm({
            name: '',
            email: '',
            phone: '',
            makeModel: '',
            budget: '',
            condition: 'Any',
            fuel: 'Any',
            transmission: 'Any',
            maxMileage: 'Any',
            hasPartExchange: 'No',
            partExchangeDetails: '',
            timeline: 'Within 2 weeks',
            notes: ''
        });
        setSubmitted(false);
        setSubmittedData(null);
        setError(null);
    };

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const scrollToForm = () => {
        const el = document.getElementById('concierge-form-section');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="concierge">
            {/* 1. Hero Section */}
            <section className="concierge__hero">
                <div className="container">
                    <span className="concierge__badge">
                        <span className="concierge__badge-dot"></span>
                        Vancar Autos Concierge Service
                    </span>
                    <h1 className="concierge__hero-title">
                        Can't Find Your Ideal Car?<br />
                        <span className="highlight">We'll Source It For You.</span>
                    </h1>
                    <p className="concierge__hero-subtitle">
                        Not sitting on our Manchester forecourt yet? Tell us your preferred make, model, specification, 
                        and budget. We'll search verified trade-only auctions and our nationwide dealer network to find 
                        the exact vehicle you want — hand-inspected in our Manchester workshop with zero search fee and no obligation.
                    </p>

                    {/* Trust Highlights */}
                    <div className="concierge__hero-pills">
                        <span className="concierge__pill">
                            <span className="concierge__pill-check">✓</span> No Search Fee
                        </span>
                        <span className="concierge__pill">
                            <span className="concierge__pill-check">✓</span> Zero Obligation
                        </span>
                        <span className="concierge__pill">
                            <span className="concierge__pill-check">✓</span> Multi-Point Workshop Inspected
                        </span>
                        <span className="concierge__pill">
                            <span className="concierge__pill-check">✓</span> Trade-Ins & Finance Available
                        </span>
                    </div>

                    <div className="concierge__hero-actions">
                        <button onClick={scrollToForm} className="btn btn--primary btn--lg">
                            Start Your Vehicle Brief
                            <span className="ml-1">↓</span>
                        </button>
                        <a href="tel:07386533337" className="btn btn--outline btn--lg">
                            <span>📞</span> Speak to an Advisor
                        </a>
                    </div>
                </div>
            </section>

            {/* 2. Stats / Fast Overview */}
            <section className="concierge__stats section">
                <div className="container">
                    <div className="concierge__stats-grid">
                        <div className="concierge__stat-card">
                            <span className="concierge__stat-number">£0</span>
                            <span className="concierge__stat-label">Upfront Search Fee</span>
                            <p className="concierge__stat-desc">Zero deposit required to begin your bespoke search.</p>
                        </div>
                        <div className="concierge__stat-card">
                            <span className="concierge__stat-number">1-3</span>
                            <span className="concierge__stat-label">Weeks Average Turnaround</span>
                            <p className="concierge__stat-desc">From initial brief to vehicle handover at our showroom.</p>
                        </div>
                        <div className="concierge__stat-card">
                            <span className="concierge__stat-number">100%</span>
                            <span className="concierge__stat-label">Inspected & HPI Verified</span>
                            <p className="concierge__stat-desc">Every vehicle audited for provenance, safety, and mechanical health.</p>
                        </div>
                        <div className="concierge__stat-card">
                            <span className="concierge__stat-number">5,000+</span>
                            <span className="concierge__stat-label">Happy Drivers Served</span>
                            <p className="concierge__stat-desc">Trusted Manchester dealer with over 15 years in motor retail.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. The 3-Step Process (Customer Journey) */}
            <section className="concierge__process section">
                <div className="container">
                    <div className="text-center mb-12">
                        <span className="concierge__section-tag">How It Works</span>
                        <h2 className="section-title">A Simple, Stress-Free Sourcing Journey</h2>
                        <p className="concierge__section-sub">
                            You handle the 2-minute brief. We take care of the search, verification, and mechanical preparation.
                        </p>
                    </div>

                    <div className="concierge__steps-grid">
                        <div className="concierge__step-card">
                            <div className="concierge__step-badge">01</div>
                            <div className="concierge__step-time">Takes ~2 Mins</div>
                            <h3 className="concierge__step-title">Give Us The Brief</h3>
                            <p className="concierge__step-text">
                                Tell us the make, model, trim, gearbox, fuel type, maximum mileage, and budget. 
                                Spell out your specific requirements or keep it flexible — we're here to help you refine it.
                            </p>
                            <ul className="concierge__step-list">
                                <li>✓ Specify exact options & colours</li>
                                <li>✓ Set your comfortable budget</li>
                                <li>✓ Optional part exchange valuation</li>
                            </ul>
                        </div>

                        <div className="concierge__step-card">
                            <div className="concierge__step-badge">02</div>
                            <div className="concierge__step-time">Usually 1–3 Weeks</div>
                            <h3 className="concierge__step-title">We Go Hunting</h3>
                            <p className="concierge__step-text">
                                We scan exclusive trade-only auctions, franchised dealer part-exchanges, and verified UK trade contacts. 
                                We access prime stock that never makes it to public automotive classifieds.
                            </p>
                            <ul className="concierge__step-list">
                                <li>✓ National trade network access</li>
                                <li>✓ Full HPI provenance background check</li>
                                <li>✓ High-resolution photos & video sent to you</li>
                            </ul>
                        </div>

                        <div className="concierge__step-card">
                            <div className="concierge__step-badge">03</div>
                            <div className="concierge__step-time">You Decide</div>
                            <h3 className="concierge__step-title">You Approve, We Prep</h3>
                            <p className="concierge__step-text">
                                Nothing is purchased without your green light. Once you approve the vehicle, our technicians 
                                run it through our Manchester workshop for a multi-point inspection, full valet, and warranty setup.
                            </p>
                            <ul className="concierge__step-list">
                                <li>✓ Rigorous workshop multi-point inspection</li>
                                <li>✓ Comprehensive warranty included</li>
                                <li>✓ Showroom collection or home delivery</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. On Every Sourced Vehicle (Key Benefits) */}
            <section className="concierge__benefits section">
                <div className="container">
                    <div className="text-center mb-12">
                        <span className="concierge__section-tag">Quality Standards</span>
                        <h2 className="section-title">Built Into Every Sourced Vehicle</h2>
                        <p className="concierge__section-sub">
                            A car or van we source gets the exact same high standard of care as anything on our showroom forecourt.
                        </p>
                    </div>

                    <div className="concierge__benefits-grid">
                        <div className="concierge__benefit-card">
                            <div className="concierge__benefit-icon">🛡️</div>
                            <h3>HPI & Provenance Checked</h3>
                            <p>Every vehicle is screened against national databases for outstanding finance, insurance write-offs, theft markers, and mileage discrepancies.</p>
                        </div>

                        <div className="concierge__benefit-card">
                            <div className="concierge__benefit-icon">🔧</div>
                            <h3>Manchester Workshop Inspected</h3>
                            <p>Booked into our own workshop for a thorough multi-point mechanical inspection by experienced technicians before handover.</p>
                        </div>

                        <div className="concierge__benefit-card">
                            <div className="concierge__benefit-icon">📜</div>
                            <h3>Comprehensive Warranty</h3>
                            <p>Drive away with confidence. All sourced vehicles come with standard warranty coverage and extended warranty upgrade options.</p>
                        </div>

                        <div className="concierge__benefit-card">
                            <div className="concierge__benefit-icon">🔄</div>
                            <h3>Part Exchange Welcome</h3>
                            <p>Roll your existing car or commercial van into the deal. We will provide an upfront trade valuation that reduces your final balance.</p>
                        </div>

                        <div className="concierge__benefit-card">
                            <div className="concierge__benefit-icon">💳</div>
                            <h3>Flexible Finance Packages</h3>
                            <p>Competitive Hire Purchase (HP) and PCP finance options through our vetted lending partners with decisions in principle available upfront.</p>
                        </div>

                        <div className="concierge__benefit-card">
                            <div className="concierge__benefit-icon">🚚</div>
                            <h3>Showroom Collection or Delivery</h3>
                            <p>Collect your vehicle directly from our Midland Street showroom in Manchester, or let us arrange safe delivery straight to your doorstep.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Prominent Enquiry Form Section */}
            <section id="concierge-form-section" className="concierge__form-section section">
                <div className="container">
                    <div className="concierge__form-wrapper">
                        <div className="concierge__form-header">
                            <span className="concierge__form-pill">No Fee • No Obligation</span>
                            <h2 className="concierge__form-title">Submit Your Vehicle Brief</h2>
                            <p className="concierge__form-subtitle">
                                Tell us the specifications you're looking for. Our Manchester concierge team will review your brief 
                                and contact you with matched options within 24 hours.
                            </p>
                        </div>

                        {submitted ? (
                            <div className="concierge__success-card animate-fade-in">
                                <div className="concierge__success-icon">✓</div>
                                <h3 className="concierge__success-title">Vehicle Brief Submitted!</h3>
                                <p className="concierge__success-message">
                                    Thank you, <strong>{submittedData?.name}</strong>. Our sourcing specialists have received your request for:
                                </p>
                                
                                <div className="concierge__success-summary">
                                    <div className="concierge__summary-row">
                                        <span>Preferred Vehicle:</span>
                                        <strong>{submittedData?.makeModel}</strong>
                                    </div>
                                    <div className="concierge__summary-row">
                                        <span>Target Budget:</span>
                                        <strong>{submittedData?.budget}</strong>
                                    </div>
                                    <div className="concierge__summary-row">
                                        <span>Contact Email:</span>
                                        <strong>{submittedData?.email}</strong>
                                    </div>
                                </div>

                                <p className="concierge__success-next">
                                    We are already cross-referencing upcoming trade stock and dealer channels. An advisor will contact you 
                                    shortly to confirm your brief and share potential candidates.
                                </p>

                                <div className="concierge__success-actions">
                                    <button onClick={handleReset} className="btn btn--outline">
                                        Submit Another Brief
                                    </button>
                                    <Link to="/buy" className="btn btn--primary">
                                        Browse Current Forecourt Stock
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <form className="concierge__form" onSubmit={handleSubmit}>
                                {error && (
                                    <div className="concierge__alert-error">
                                        <span>⚠️</span>
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Group 1: Contact Information */}
                                <div className="concierge__fieldset">
                                    <h3 className="concierge__fieldset-legend">1. Your Contact Details</h3>
                                    <div className="concierge__form-grid">
                                        <div className="form-group">
                                            <label className="form-label" htmlFor="concierge-name">
                                                Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="concierge-name"
                                                type="text"
                                                className="form-input"
                                                placeholder="e.g. John Smith"
                                                value={form.name}
                                                onChange={e => handleChange('name', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label" htmlFor="concierge-email">
                                                Email Address <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="concierge-email"
                                                type="email"
                                                className="form-input"
                                                placeholder="e.g. john@example.com"
                                                value={form.email}
                                                onChange={e => handleChange('email', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="form-group concierge__col-full">
                                            <label className="form-label" htmlFor="concierge-phone">
                                                Phone Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="concierge-phone"
                                                type="tel"
                                                className="form-input"
                                                placeholder="e.g. 07123 456789"
                                                value={form.phone}
                                                onChange={e => handleChange('phone', e.target.value)}
                                                required
                                            />
                                            <span className="concierge__input-hint">Used to send vehicle photos, updates, and walkaround videos.</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Group 2: Vehicle Requirements */}
                                <div className="concierge__fieldset">
                                    <h3 className="concierge__fieldset-legend">2. Preferred Vehicle Requirements</h3>
                                    <div className="concierge__form-grid">
                                        <div className="form-group concierge__col-full">
                                            <label className="form-label" htmlFor="concierge-makemodel">
                                                Make & Model / Vehicle You Want <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="concierge-makemodel"
                                                type="text"
                                                className="form-input"
                                                placeholder="e.g. BMW 3 Series M Sport, Audi Q5 S-Line, Ford Transit Custom"
                                                value={form.makeModel}
                                                onChange={e => handleChange('makeModel', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label" htmlFor="concierge-budget">
                                                Target Budget (£)
                                            </label>
                                            <input
                                                id="concierge-budget"
                                                type="text"
                                                className="form-input"
                                                placeholder="e.g. £15,000 - £20,000"
                                                value={form.budget}
                                                onChange={e => handleChange('budget', e.target.value)}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label" htmlFor="concierge-condition">
                                                Condition / Age Preference
                                            </label>
                                            <select
                                                id="concierge-condition"
                                                className="form-select"
                                                value={form.condition}
                                                onChange={e => handleChange('condition', e.target.value)}
                                            >
                                                <option value="Any">Any Age / Flexible</option>
                                                <option value="Nearly New (Up to 2 years)">Nearly New (Up to 2 years)</option>
                                                <option value="Up to 4 years old">Up to 4 years old</option>
                                                <option value="Up to 7 years old">Up to 7 years old</option>
                                                <option value="Over 7 years old">Over 7 years old / Classic</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label" htmlFor="concierge-transmission">
                                                Transmission
                                            </label>
                                            <select
                                                id="concierge-transmission"
                                                className="form-select"
                                                value={form.transmission}
                                                onChange={e => handleChange('transmission', e.target.value)}
                                            >
                                                <option value="Any">Any Transmission</option>
                                                <option value="Automatic">Automatic Only</option>
                                                <option value="Manual">Manual Only</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label" htmlFor="concierge-fuel">
                                                Fuel Type
                                            </label>
                                            <select
                                                id="concierge-fuel"
                                                className="form-select"
                                                value={form.fuel}
                                                onChange={e => handleChange('fuel', e.target.value)}
                                            >
                                                <option value="Any">Any Fuel Type</option>
                                                <option value="Petrol">Petrol</option>
                                                <option value="Diesel">Diesel</option>
                                                <option value="Hybrid">Hybrid</option>
                                                <option value="Electric">Electric</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label" htmlFor="concierge-mileage">
                                                Maximum Mileage
                                            </label>
                                            <select
                                                id="concierge-mileage"
                                                className="form-select"
                                                value={form.maxMileage}
                                                onChange={e => handleChange('maxMileage', e.target.value)}
                                            >
                                                <option value="Any">Any Mileage</option>
                                                <option value="Under 30,000 miles">Under 30,000 miles</option>
                                                <option value="Under 50,000 miles">Under 50,000 miles</option>
                                                <option value="Under 75,000 miles">Under 75,000 miles</option>
                                                <option value="Under 100,000 miles">Under 100,000 miles</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label" htmlFor="concierge-timeline">
                                                Purchase Timeline
                                            </label>
                                            <select
                                                id="concierge-timeline"
                                                className="form-select"
                                                value={form.timeline}
                                                onChange={e => handleChange('timeline', e.target.value)}
                                            >
                                                <option value="Ready now / Urgent">Ready immediately</option>
                                                <option value="Within 2 weeks">Within 2 weeks</option>
                                                <option value="Within 1 month">Within 1 month</option>
                                                <option value="Just researching / Flexible">Just researching / Flexible</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Group 3: Part Exchange & Additional Requirements */}
                                <div className="concierge__fieldset">
                                    <h3 className="concierge__fieldset-legend">3. Trade-In & Key Requirements</h3>
                                    
                                    <div className="form-group">
                                        <label className="form-label">Do you have a vehicle to part-exchange?</label>
                                        <div className="concierge__radio-group">
                                            <label className={`concierge__radio-label ${form.hasPartExchange === 'No' ? 'concierge__radio-label--active' : ''}`}>
                                                <input
                                                    type="radio"
                                                    name="partExchange"
                                                    value="No"
                                                    checked={form.hasPartExchange === 'No'}
                                                    onChange={() => handleChange('hasPartExchange', 'No')}
                                                />
                                                No, I don't
                                            </label>
                                            <label className={`concierge__radio-label ${form.hasPartExchange === 'Yes' ? 'concierge__radio-label--active' : ''}`}>
                                                <input
                                                    type="radio"
                                                    name="partExchange"
                                                    value="Yes"
                                                    checked={form.hasPartExchange === 'Yes'}
                                                    onChange={() => handleChange('hasPartExchange', 'Yes')}
                                                />
                                                Yes, I have a car/van to trade in
                                            </label>
                                        </div>
                                    </div>

                                    {form.hasPartExchange === 'Yes' && (
                                        <div className="form-group animate-fade-in">
                                            <label className="form-label" htmlFor="concierge-pxdetails">
                                                Current Vehicle Details (Registration, Make/Model, Mileage)
                                            </label>
                                            <input
                                                id="concierge-pxdetails"
                                                type="text"
                                                className="form-input"
                                                placeholder="e.g. AB18 CDE - 2018 Ford Focus, 48,000 miles"
                                                value={form.partExchangeDetails}
                                                onChange={e => handleChange('partExchangeDetails', e.target.value)}
                                            />
                                        </div>
                                    )}

                                    <div className="form-group mb-2">
                                        <label className="form-label" htmlFor="concierge-notes">
                                            Specific Requirements & Additional Notes
                                        </label>
                                        <textarea
                                            id="concierge-notes"
                                            rows={4}
                                            className="form-input"
                                            placeholder="Tell us about must-have features (e.g. panoramic sunroof, leather seats, Apple CarPlay, specific colours, towbar, etc.)"
                                            value={form.notes}
                                            onChange={e => handleChange('notes', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="concierge__form-footer">
                                    <button
                                        type="submit"
                                        className="btn btn--primary btn--lg w-full md:w-auto"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-sm mr-2"></span>
                                                Submitting Your Brief...
                                            </>
                                        ) : (
                                            <>
                                                Submit Concierge Brief
                                                <span className="ml-2">→</span>
                                            </>
                                        )}
                                    </button>
                                    <p className="concierge__footer-disclaimer">
                                        🔒 Your contact information is kept strictly confidential and only used to assist with your vehicle search. No spam, ever.
                                    </p>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* 6. Good to Know: FAQs in Plain English */}
            <section className="concierge__faq section">
                <div className="container">
                    <div className="text-center mb-12">
                        <span className="concierge__section-tag">Good To Know</span>
                        <h2 className="section-title">Frequently Asked Questions</h2>
                        <p className="concierge__section-sub">
                            Everything you need to know about the Van Car Autos Concierge service, explained in plain English.
                        </p>
                    </div>

                    <div className="concierge__faq-list">
                        {FAQS.map((faq, index) => {
                            const isOpen = openFaq === index;
                            return (
                                <div key={index} className={`concierge__faq-item ${isOpen ? 'concierge__faq-item--open' : ''}`}>
                                    <button
                                        className="concierge__faq-question"
                                        onClick={() => toggleFaq(index)}
                                        aria-expanded={isOpen}
                                    >
                                        <span>{faq.q}</span>
                                        <span className="concierge__faq-toggle">{isOpen ? '−' : '+'}</span>
                                    </button>
                                    {isOpen && (
                                        <div className="concierge__faq-answer animate-fade-in">
                                            <p>{faq.a}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 7. Direct Contact / Callout Banner */}
            <section className="concierge__cta section">
                <div className="container">
                    <div className="concierge__cta-card">
                        <div className="concierge__cta-content">
                            <span className="concierge__cta-badge">Ready To Talk?</span>
                            <h2 className="concierge__cta-title">Prefer to Discuss Your Brief Over The Phone?</h2>
                            <p className="concierge__cta-text">
                                Our sourcing experts are available 7 days a week. Give us a call or visit our Manchester showroom 
                                on Midland Street to discuss exactly what you're looking for.
                            </p>
                            <div className="concierge__cta-buttons">
                                <a href="tel:07386533337" className="btn btn--primary btn--lg">
                                    📞 Call 07386 533337
                                </a>
                                <Link to="/contact" className="btn btn--white btn--lg">
                                    Showroom Location & Directions
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
