import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getCarStats, getBlogs } from '../../../services/dataService';
import './Dashboard.css';

export default function Dashboard() {
    const stats = useMemo(() => getCarStats(), []);
    const blogs = useMemo(() => getBlogs(), []);

    return (
        <div className="admin-dashboard">
            <h1 className="admin-dashboard__title">Dashboard</h1>

            <div className="admin-dashboard__stats">
                <div className="admin-dashboard__stat-card">
                    <span className="admin-dashboard__stat-number">{stats.total}</span>
                    <span className="admin-dashboard__stat-label">Total Cars</span>
                </div>
                <div className="admin-dashboard__stat-card">
                    <span className="admin-dashboard__stat-number">{stats.available}</span>
                    <span className="admin-dashboard__stat-label">Available</span>
                </div>
                <div className="admin-dashboard__stat-card">
                    <span className="admin-dashboard__stat-number">{stats.sold}</span>
                    <span className="admin-dashboard__stat-label">Sold</span>
                </div>
                <div className="admin-dashboard__stat-card">
                    <span className="admin-dashboard__stat-number">{blogs.length}</span>
                    <span className="admin-dashboard__stat-label">Blog Posts</span>
                </div>
            </div>

            <div className="admin-dashboard__quick">
                <h2>Quick Actions</h2>
                <div className="admin-dashboard__actions">
                    <Link to="/admin/cars/new" className="btn btn--primary">+ Add New Car</Link>
                    <Link to="/admin/blogs/new" className="btn btn--outline">+ New Blog Post</Link>
                    <Link to="/admin/cars" className="btn btn--secondary">Manage Inventory</Link>
                </div>
            </div>

            <div className="admin-dashboard__body-types">
                <h2>Inventory by Type</h2>
                <div className="admin-dashboard__type-grid">
                    {stats.bodyTypes.map(bt => (
                        <div key={bt.type} className="admin-dashboard__type-card">
                            <span className="admin-dashboard__type-name">{bt.type}</span>
                            <span className="admin-dashboard__type-count">{bt.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
