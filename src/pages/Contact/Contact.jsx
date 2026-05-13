import { useState } from 'react';
import './Contact.css';

export default function Contact() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => { e.preventDefault(); setSubmitted(true); };

    return (
        <div className="contact">
            <div className="container">
                <div className="contact__header">
                    <h1 className="contact__title">Contact Us</h1>
                    <p className="contact__subtitle">We'd love to hear from you. Get in touch with our friendly team.</p>
                </div>

                <div className="contact__grid">
                    <div className="contact__form-wrap">
                        {submitted ? (
                            <div className="contact__success">
                                <div className="contact__success-icon">✓</div>
                                <h3>Message Sent!</h3>
                                <p>We'll get back to you within 24 hours.</p>
                            </div>
                        ) : (
                            <form className="contact__form" onSubmit={handleSubmit}>
                                <div className="contact__form-row">
                                    <div className="form-group">
                                        <label className="form-label">Name</label>
                                        <input className="form-input" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input className="form-input" type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="contact__form-row">
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input className="form-input" type="tel" placeholder="07xxx xxxxxx" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Subject</label>
                                        <select className="form-select" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
                                            <option value="">Select a subject</option>
                                            <option>General Enquiry</option>
                                            <option>Book a Test Drive</option>
                                            <option>Finance Enquiry</option>
                                            <option>Sell My Car</option>
                                            <option>Complaint</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Message</label>
                                    <textarea className="form-input" rows={5} placeholder="Your message..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
                                </div>
                                <button type="submit" className="btn btn--primary btn--lg">Send Message</button>
                            </form>
                        )}
                    </div>

                    <div className="contact__info">
                        <div className="contact__info-card">
                            <h4>📍 Visit Us</h4>
                            <p>VANCAR AUTOS LIMITED<br />Reg. No: 16593644<br />14 MIDLAND STREET<br />MANCHESTER, M12 6LB</p>
                        </div>
                        <div className="contact__info-card">
                            <h4>📞 Call Us</h4>
                            <p>XXXXXXXXXXXX</p>
                        </div>
                        <div className="contact__info-card">
                            <h4>📧 Email Us</h4>
                            <p>hellovancarautos@gmail.com</p>
                        </div>
                        <div className="contact__info-card">
                            <h4>🕐 Opening Hours</h4>
                            <p>Mon - Fri: 9:00 AM - 6:00 PM<br />Saturday: 9:00 AM - 5:00 PM<br />Sunday: 10:00 AM - 4:00 PM</p>
                        </div>
                    </div>
                </div>

                {/* Map Placeholder */}
                <div className="contact__map">
                    <div className="contact__map-placeholder">
                        <span>📍 Map – Manchester, M12 6LB</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
