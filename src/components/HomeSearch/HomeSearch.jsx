import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMakes, getModelsByMake } from '../../services/dataService';
import './HomeSearch.css';

export default function HomeSearch() {
    const navigate = useNavigate();
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [bodyType, setBodyType] = useState('All');
    const [fuel, setFuel] = useState('All');
    const [transmission, setTransmission] = useState('All');

    const makes = useMemo(() => getMakes(), []);
    const models = useMemo(() => {
        if (!make) return [];
        return getModelsByMake(make);
    }, [make]);

    // Reset model if make changes
    useEffect(() => {
        setModel('');
    }, [make]);

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (make) params.append('make', make);
        if (model) params.append('model', model);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (bodyType && bodyType !== 'All') params.append('bodyType', bodyType);
        if (fuel && fuel !== 'All') params.append('fuel', fuel);
        if (transmission && transmission !== 'All') params.append('transmission', transmission);
        
        navigate(`/buy?${params.toString()}`);
    };

    return (
        <div className="home-search">
            <div className="home-search__container container">
                <form onSubmit={handleSearch} className="home-search__card shadow-xl">
                    <div className="home-search__header">
                        <h3 className="home-search__title">Search Our Stock</h3>
                        <p className="home-search__subtitle">Find your next premium vehicle today</p>
                    </div>
                    
                    <div className="home-search__grid">
                        <div className="form-group">
                            <label className="form-label">Make</label>
                            <select 
                                className="form-select home-search__select" 
                                value={make} 
                                onChange={(e) => setMake(e.target.value)}
                            >
                                <option value="">All Makes</option>
                                {makes.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Model</label>
                            <select 
                                className="form-select home-search__select" 
                                value={model} 
                                onChange={(e) => setModel(e.target.value)}
                                disabled={!make}
                            >
                                <option value="">All Models</option>
                                {models.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Max Price</label>
                            <select 
                                className="form-select home-search__select" 
                                value={maxPrice} 
                                onChange={(e) => setMaxPrice(e.target.value)}
                            >
                                <option value="">No Max</option>
                                <option value="15000">£15,000</option>
                                <option value="20000">£20,000</option>
                                <option value="30000">£30,000</option>
                                <option value="40000">£40,000</option>
                                <option value="50000">£50,000</option>
                                <option value="75000">£75,000</option>
                                <option value="100000">£100,000</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Body Type</label>
                            <select 
                                className="form-select home-search__select" 
                                value={bodyType} 
                                onChange={(e) => setBodyType(e.target.value)}
                            >
                                {['All', 'SUV', 'Saloon', 'Hatchback', 'Estate', 'Sport', 'Van'].map(b => (
                                    <option key={b} value={b}>{b === 'All' ? 'All Body Types' : b}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Fuel Type</label>
                            <select 
                                className="form-select home-search__select" 
                                value={fuel} 
                                onChange={(e) => setFuel(e.target.value)}
                            >
                                <option value="All">All Fuels</option>
                                <option value="Petrol">Petrol</option>
                                <option value="Diesel">Diesel</option>
                                <option value="Electric">Electric</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Transmission</label>
                            <select 
                                className="form-select home-search__select" 
                                value={transmission} 
                                onChange={(e) => setTransmission(e.target.value)}
                            >
                                <option value="All">All Transmissions</option>
                                <option value="Automatic">Automatic</option>
                                <option value="Manual">Manual</option>
                            </select>
                        </div>
                    </div>

                    <div className="home-search__footer">
                        <button type="submit" className="btn btn--primary btn--lg w-full md:w-auto shadow-md">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-2 inline"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            Search Vehicles
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
