import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import KarmaHero from '../../components/KarmaHero/KarmaHero';
import HomeSearch from '../../components/HomeSearch/HomeSearch';
import CarCard from '../../components/CarCard/CarCard';
import { getFeaturedCars, getAvailableCars } from '../../services/dataService';
import './Home.css';

export default function Home() {
    const featuredCars = useMemo(() => getFeaturedCars().slice(0, 3), []);
    const allCars = useMemo(() => getAvailableCars(), []);

    // Finance Calculator State
    const [selectedCarId, setSelectedCarId] = useState(allCars[0]?.id || '');
    const [customPrice, setCustomPrice] = useState(25000);
    const [deposit, setDeposit] = useState(2500);
    const [term, setTerm] = useState(48); // months

    // Update customPrice and deposit when selected car changes
    useEffect(() => {
        if (selectedCarId) {
            const car = allCars.find(c => c.id === selectedCarId);
            if (car) {
                setCustomPrice(car.price);
                setDeposit(Math.round(car.price * 0.1));
            }
        }
    }, [selectedCarId, allCars]);

    // Handle manual custom price slider/input
    const handlePriceChange = (val) => {
        setCustomPrice(val);
        setSelectedCarId(''); // switch to manual custom price mode
        // Auto-scale deposit to 10%
        setDeposit(Math.round(val * 0.1));
    };

    // Calculate monthly finance payment using standard loan amortization
    // representative APR = 9.9%
    const monthlyPayment = useMemo(() => {
        const principal = customPrice - deposit;
        if (principal <= 0) return 0;
        const annualRate = 0.099;
        const monthlyRate = annualRate / 12;
        const payments = term;
        
        // Amortization formula: P * (r * (1+r)^n) / ((1+r)^n - 1)
        const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, payments)) / 
                        (Math.pow(1 + monthlyRate, payments) - 1);
        
        return Math.round(payment);
    }, [customPrice, deposit, term]);

    // Testimonial Carousel State
    const testimonials = [
        {
            text: "Exceptional service from start to finish! The car was in absolutely pristine condition, the pricing was completely transparent, and they delivered it straight to my door.",
            author: "David L.",
            location: "Manchester",
            rating: 5
        },
        {
            text: "I traded in my old Audi for a beautiful Mercedes SUV. They gave me a fair part exchange valuation and the vehicle has been incredibly reliable. Highly recommended!",
            author: "Sarah M.",
            location: "Leeds",
            rating: 5
        },
        {
            text: "Very honest dealership. No pushy sales tactics, and the comprehensive warranty package gives complete peace of mind. Excellent communication.",
            author: "Thomas K.",
            location: "Cheshire",
            rating: 5
        }
    ];
    const [activeTestimonial, setActiveTestimonial] = useState(0);

    const nextTestimonial = () => {
        setActiveTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    };

    const prevTestimonial = () => {
        setActiveTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    };

    // Auto-scroll testimonials
    useEffect(() => {
        const interval = setInterval(nextTestimonial, 6000);
        return () => clearInterval(interval);
    }, []);

    const formatPrice = (p) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(p);

    return (
        <div className="home bg-white text-slate-900 overflow-x-hidden">
            {/* 1. Hero Showcase */}
            <KarmaHero />

            {/* 2. Horizontal Search widget (Overlaps hero) */}
            <HomeSearch />

            {/* 3. Featured Vehicles Section */}
            <section className="section bg-white home__featured-vehicles">
                <div className="container">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
                        <div>
                            <span className="text-red-600 font-bold text-xs uppercase tracking-wider block mb-2">Curated Showroom</span>
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Featured Vehicles</h2>
                        </div>
                        <Link to="/buy" className="link-arrow text-slate-800 hover:text-red-600 font-semibold mt-4 md:mt-0">
                            Browse All Stock
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {featuredCars.map(car => (
                            <CarCard key={car.id} car={car} />
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. Why Choose Us (Trust Badges Grid) */}
            <section className="section bg-slate-50 border-y border-slate-100 home__why-choose">
                <div className="container text-center">
                    <span className="text-red-600 font-bold text-xs uppercase tracking-wider block mb-2">Our Promise</span>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">Why Choose Vancar Autos?</h2>
                    <p className="text-slate-500 max-w-xl mx-auto mb-12 font-medium">We pride ourselves on offering a simple, transparent, and premium car buying experience.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {[
                          { title: "Quality Approved", desc: "Thoroughly inspected stock", icon: "🔍" },
                          { title: "HPI Checked", desc: "Complete history report", icon: "📜" },
                          { title: "Part Exchange", desc: "Instant value valuations", icon: "🔄" },
                          { title: "Warranty Included", desc: "Drive away protected", icon: "🛡️" },
                          { title: "Nationwide Delivery", desc: "Straight to your door", icon: "🚚" },
                          { title: "5-Star Service", desc: "Honest customer care", icon: "⭐" },
                        ].map((badge, idx) => (
                            <div key={idx} className="home__trust-card shadow-sm hover:shadow-md">
                                <div className="home__trust-icon">{badge.icon}</div>
                                <h3 className="home__trust-title">{badge.title}</h3>
                                <p className="home__trust-desc">{badge.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. Value & Affordability Promo Area & Slider Calculator */}
            <section id="finance-section" className="section bg-white home__finance-calc">
                <div className="container">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Info Block */}
                        <div>
                            <span className="text-red-600 font-bold text-xs uppercase tracking-wider block mb-2">Value & Affordability</span>
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-6">Smart Ownership Made Simple</h2>
                            <p className="text-slate-600 mb-6 leading-relaxed">
                                We believe that driving a high-quality, reliable car shouldn't cost a fortune. Vancar Autos is dedicated to providing high-value used vehicles that fit your budget perfectly, with transparent cash pricing and zero hidden dealer fees.
                            </p>
                            <p className="text-slate-600 mb-8 leading-relaxed">
                                Use our budget planner below to see how affordable owning a dependable car can be. Simply choose one of our stock vehicles or configure a custom price to check what fits your budget!
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link to="/buy" className="btn btn--primary">View All Vehicles</Link>
                                <Link to="/contact" className="btn btn--outline">Speak to an Advisor</Link>
                            </div>
                        </div>

                        {/* Interactive Calculator Block */}
                        <div className="home__calc-box shadow-xl border border-slate-100 rounded-2xl">
                            <div className="home__calc-header bg-slate-900 text-white">
                                <h3 className="text-xl font-bold">Affordability Planner</h3>
                                <p className="text-slate-400 text-xs">Plan your budget & purchase options</p>
                            </div>
                            
                            <div className="home__calc-body">
                                {/* Select Vehicle */}
                                <div className="form-group mb-6">
                                    <label className="form-label font-bold text-xs text-slate-700 uppercase mb-2">Configure For Stock Car</label>
                                    <select 
                                        className="form-select home__calc-select" 
                                        value={selectedCarId}
                                        onChange={(e) => setSelectedCarId(e.target.value)}
                                    >
                                        <option value="">Custom Manual Value</option>
                                        {allCars.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.year} {c.make} {c.model} - {formatPrice(c.price)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Custom Price Slider */}
                                <div className="form-group mb-6">
                                    <div className="flex justify-between mb-2">
                                        <label className="form-label font-bold text-xs text-slate-700 uppercase">Vehicle Price</label>
                                        <span className="font-bold text-slate-900">{formatPrice(customPrice)}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="5000" 
                                        max="100000" 
                                        step="500"
                                        value={customPrice} 
                                        onChange={(e) => handlePriceChange(Number(e.target.value))}
                                        className="home__calc-range w-full"
                                    />
                                </div>

                                {/* Deposit Slider */}
                                <div className="form-group mb-6">
                                    <div className="flex justify-between mb-2">
                                        <label className="form-label font-bold text-xs text-slate-700 uppercase">Deposit</label>
                                        <span className="font-bold text-slate-900">{formatPrice(deposit)}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max={Math.round(customPrice * 0.5)} 
                                        step="100"
                                        value={deposit} 
                                        onChange={(e) => setDeposit(Number(e.target.value))}
                                        className="home__calc-range w-full"
                                    />
                                </div>

                                {/* Term Selector */}
                                <div className="form-group mb-8">
                                    <label className="form-label font-bold text-xs text-slate-700 uppercase mb-2">Term (Months)</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[24, 36, 48, 60].map(m => (
                                            <button 
                                                key={m} 
                                                type="button"
                                                onClick={() => setTerm(m)}
                                                className={`home__calc-term-btn ${term === m ? 'home__calc-term-btn--active' : ''}`}
                                            >
                                                {m}m
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Result Output */}
                                <div className="home__calc-result bg-slate-50 border border-slate-100 rounded-xl">
                                    <span className="text-slate-500 font-medium text-sm block mb-1">Estimated Monthly Budget Contribution</span>
                                    <span className="home__calc-monthly">{formatPrice(monthlyPayment)}<span className="text-sm font-medium text-slate-500">/mo</span></span>
                                    <small className="text-[10px] text-slate-400 block mt-3">
                                        Based on typical purchase options. Deposit: {formatPrice(deposit)}. Balance: {formatPrice(customPrice - deposit)}. Flexible purchase plans available.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Customer Testimonials (Trustpilot Style Carousel) */}
            <section className="section bg-slate-50 border-y border-slate-100 home__testimonials">
                <div className="container text-center">
                    <div className="home__reviews-badge mb-4">
                        <span className="home__reviews-stars">★★★★★</span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">Rated 4.8 / 5 on Trustpilot</h4>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-12">What Our Customers Say</h2>
                    
                    <div className="relative max-w-3xl mx-auto home__carousel-wrap px-12">
                        {/* Testimonial card */}
                        <div className="home__testimonial-card bg-white p-8 md:p-12 shadow-md rounded-2xl animate-fade-in" key={activeTestimonial}>
                            <p className="home__testimonial-text">
                                "{testimonials[activeTestimonial].text}"
                            </p>
                            <h4 className="home__testimonial-author">
                                {testimonials[activeTestimonial].author}
                            </h4>
                            <span className="home__testimonial-location">
                                {testimonials[activeTestimonial].location}
                            </span>
                        </div>

                        {/* Controls */}
                        <button onClick={prevTestimonial} className="home__carousel-btn home__carousel-btn--prev" aria-label="Previous review">
                            ‹
                        </button>
                        <button onClick={nextTestimonial} className="home__carousel-btn home__carousel-btn--next" aria-label="Next review">
                            ›
                        </button>
                    </div>
                </div>
            </section>

            {/* 7. About Dealership introduction (Split-screen layout) */}
            <section className="section bg-white home__about-split">
                <div className="container">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="home__about-image rounded-2xl overflow-hidden shadow-lg">
                            <img 
                                src="https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80" 
                                alt="Vancar Autos Showroom" 
                                className="w-full h-full object-cover aspect-[4/3] hover:scale-105 transition-transform duration-[6000ms]"
                            />
                        </div>

                        <div>
                            <span className="text-red-600 font-bold text-xs uppercase tracking-wider block mb-2">Our Dealership</span>
                            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-6">About Vancar Autos</h2>
                            <p className="text-slate-600 mb-6 leading-relaxed">
                                Vancar Autos is a leading independent used car dealership in Manchester. Over the last 15 years, we have built our reputation on providing high-quality, pre-owned vehicles backed by honest advice and absolute transparency.
                            </p>
                            <p className="text-slate-600 mb-8 leading-relaxed">
                                Every single car in our inventory undergoes a rigorous safety check, comes with a complete history audit, and includes a comprehensive warranty, ensuring you can drive away with total peace of mind.
                            </p>
                            
                            <div className="grid grid-cols-3 gap-6 text-center border-t border-slate-100 pt-6">
                                <div>
                                    <span className="block text-2xl font-bold text-red-600">15+</span>
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Years Experience</span>
                                </div>
                                <div>
                                    <span className="block text-2xl font-bold text-red-600">5k+</span>
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Happy Clients</span>
                                </div>
                                <div>
                                    <span className="block text-2xl font-bold text-red-600">200+</span>
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Premium Cars</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section home__cta-banner bg-slate-900 text-white text-center">
                <div className="container relative z-10 max-w-3xl">
                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-white">Ready to Find Your Next Car?</h2>
                    <p className="text-slate-400 text-lg mb-10 leading-relaxed font-medium">
                        Browse our online showroom of quality-guaranteed vehicles or contact our team today for honest, expert advice. We make the car buying process simple, honest, and completely stress-free.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link to="/buy" className="btn btn--primary btn--lg shadow-md">
                            Browse Used Cars
                        </Link>
                        <Link to="/contact" className="btn btn--white btn--lg shadow-md">
                            Contact Our Team
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
