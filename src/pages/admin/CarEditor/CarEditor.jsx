import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCarById, createCar, updateCar } from '../../../services/dataService';
import './CarEditor.css';

const LEAD_SOURCES = [
    'Facebook',
    'Auto Trader',
    'Gumtree',
    'eBay',
    'Website',
    'Walk-in',
    'Referral',
    'Repeat Customer',
    'Other'
];

const INITIAL_FORM = {
    title: '', make: '', model: '', trim: '', year: new Date().getFullYear(),
    price: '', mileage: '', fuel: 'Petrol', transmission: 'Automatic',
    bodyType: 'SUV', colour: '', engine: '', doors: 5, seats: 5,
    description: '', features: [], images: [], status: 'available', featured: false,
    lead_source: '', autotrader_days_advertised: ''
};

export default function CarEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;
    const [form, setForm] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit) {
            const car = getCarById(id);
            if (car) setForm(car);
        }
    }, [id, isEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (name === 'featured' ? checked : value) : value
        }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ml_default');

        try {
            const res = await fetch('https://api.cloudinary.com/v1_1/dns07iokn/image/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.secure_url) {
                setForm(prev => ({ ...prev, images: [...prev.images, data.secure_url] }));
            }
        } catch (err) {
            console.error('Image upload failed:', err);
            alert('Upload failed. Please try again.');
        }
    };

    const addImageUrl = () => {
        const url = prompt("Enter image URL (e.g. /images/car-suv.png or external URL):");
        if (url) setForm(prev => ({ ...prev, images: [...prev.images, url] }));
    };

    const removeImage = (index) => {
        setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    };

    const handleFeatureChange = (e) => {
        const features = e.target.value.split(',').map(f => f.trim()).filter(f => f);
        setForm(prev => ({ ...prev, features }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (form.status === 'sold') {
            const src = form.lead_source || form.leadSource;
            if (!src) {
                alert('Customer Source / Lead Source is required when marking a vehicle as Sold.');
                return;
            }
            if (src === 'Auto Trader') {
                const days = form.autotrader_days_advertised ?? form.autotraderDaysAdvertised;
                if (days === '' || days === null || days === undefined || isNaN(days) || parseInt(days) < 0) {
                    alert('Number of Days Advertised on Auto Trader is required and must be a valid non-negative number.');
                    return;
                }
            }
        }

        setLoading(true);

        const payload = {
            ...form,
            lead_source: form.status === 'sold' ? (form.lead_source || form.leadSource) : form.lead_source,
            leadSource: form.status === 'sold' ? (form.lead_source || form.leadSource) : form.leadSource,
            autotrader_days_advertised: (form.status === 'sold' && (form.lead_source || form.leadSource) === 'Auto Trader') ? parseInt(form.autotrader_days_advertised ?? form.autotraderDaysAdvertised) : null,
            autotraderDaysAdvertised: (form.status === 'sold' && (form.lead_source || form.leadSource) === 'Auto Trader') ? parseInt(form.autotrader_days_advertised ?? form.autotraderDaysAdvertised) : null
        };

        // Simulate API delay
        setTimeout(() => {
            if (isEdit) {
                updateCar(id, payload);
            } else {
                createCar(payload);
            }
            navigate('/admin/cars');
        }, 500);
    };

    return (
        <div className="car-editor">
            <div className="car-editor__header">
                <h1>{isEdit ? 'Edit Car' : 'Add New Car'}</h1>
            </div>

            <form className="car-editor__form" onSubmit={handleSubmit}>
                <div className="car-editor__section">
                    <h2>Basic Information</h2>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Make</label>
                            <input name="make" className="form-input" value={form.make} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Model</label>
                            <input name="model" className="form-input" value={form.model} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Trim</label>
                            <input name="trim" className="form-input" value={form.trim} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Year</label>
                            <input name="year" type="number" className="form-input" value={form.year} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Price (£)</label>
                            <input name="price" type="number" className="form-input" value={form.price} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Mileage</label>
                            <input name="mileage" type="number" className="form-input" value={form.mileage} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                                <option value="available">Available</option>
                                <option value="reserved">Reserved</option>
                                <option value="sold">Sold</option>
                            </select>
                        </div>
                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} />
                                <span>Featured on Homepage</span>
                            </label>
                        </div>
                    </div>

                    {form.status === 'sold' && (
                        <div className="car-editor__sold-box" style={{ marginTop: '20px', padding: '15px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-accent)' }}>
                                📍 Sales & Lead Information
                            </h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 'bold' }}>
                                        Customer Source / Lead Source <span style={{ color: '#e53935' }}>*</span>
                                    </label>
                                    <select 
                                        name="lead_source" 
                                        className="form-select" 
                                        value={form.lead_source || form.leadSource || ''} 
                                        onChange={(e) => setForm(prev => ({ ...prev, lead_source: e.target.value, leadSource: e.target.value }))}
                                        required={form.status === 'sold'}
                                    >
                                        <option value="">-- Select Lead Source --</option>
                                        {LEAD_SOURCES.map(src => (
                                            <option key={src} value={src}>{src}</option>
                                        ))}
                                    </select>
                                </div>

                                {(form.lead_source === 'Auto Trader' || form.leadSource === 'Auto Trader') && (
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 'bold' }}>
                                            Number of Days Advertised on Auto Trader <span style={{ color: '#e53935' }}>*</span>
                                        </label>
                                        <input 
                                            name="autotrader_days_advertised"
                                            type="number" 
                                            min="0"
                                            step="1"
                                            className="form-input" 
                                            placeholder="e.g. 14"
                                            value={form.autotrader_days_advertised ?? form.autotraderDaysAdvertised ?? ''} 
                                            onChange={(e) => setForm(prev => ({ ...prev, autotrader_days_advertised: e.target.value, autotraderDaysAdvertised: e.target.value }))}
                                            required={form.status === 'sold' && (form.lead_source === 'Auto Trader' || form.leadSource === 'Auto Trader')}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="car-editor__section">
                    <h2>Technical Specs</h2>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Body Type</label>
                            <select name="bodyType" className="form-select" value={form.bodyType} onChange={handleChange}>
                                <option value="SUV">SUV</option>
                                <option value="Saloon">Saloon</option>
                                <option value="Hatchback">Hatchback</option>
                                <option value="Estate">Estate</option>
                                <option value="Sport">Sport</option>
                                <option value="Van">Van</option>
                                <option value="Coupe">Coupe</option>
                                <option value="Convertible">Convertible</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Fuel</label>
                            <select name="fuel" className="form-select" value={form.fuel} onChange={handleChange}>
                                <option value="Petrol">Petrol</option>
                                <option value="Diesel">Diesel</option>
                                <option value="Electric">Electric</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Transmission</label>
                            <select name="transmission" className="form-select" value={form.transmission} onChange={handleChange}>
                                <option value="Automatic">Automatic</option>
                                <option value="Manual">Manual</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Colour</label>
                            <input name="colour" className="form-input" value={form.colour} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Engine</label>
                            <input name="engine" className="form-input" value={form.engine} onChange={handleChange} placeholder="e.g. 2.0L TDI" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Doors</label>
                            <input name="doors" type="number" className="form-input" value={form.doors} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                <div className="car-editor__section">
                    <h2>Details & Images</h2>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea name="description" className="form-input" rows={5} value={form.description} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Features (comma separated)</label>
                        <textarea className="form-input" rows={3} value={form.features.join(', ')} onChange={handleFeatureChange} placeholder="e.g. Sat Nav, Heated Seats, Sunroof" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Images</label>
                        <div className="car-editor__images">
                            {form.images.map((img, i) => (
                                <div key={i} className="car-editor__image-preview">
                                    <img src={img} alt="" />
                                    <button type="button" onClick={() => removeImage(i)} className="car-editor__remove-image">×</button>
                                </div>
                            ))}
                            <label className="car-editor__add-image" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                + Upload Image
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                            </label>
                            <button type="button" onClick={addImageUrl} className="car-editor__add-image" style={{ marginLeft: '10px' }}>
                                + Add URL
                            </button>
                        </div>
                    </div>
                </div>

                <div className="car-editor__actions">
                    <button type="button" className="btn btn--outline" onClick={() => navigate('/admin/cars')}>Cancel</button>
                    <button type="submit" className="btn btn--primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Car'}
                    </button>
                </div>
            </form>
        </div>
    );
}
