import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getBlogs, deleteBlog } from '../../../services/dataService';
import './ManageBlogs.css';

export default function ManageBlogs() {
    const [refresh, setRefresh] = useState(0);
    const blogs = useMemo(() => getBlogs(), [refresh]);

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            deleteBlog(id);
            setRefresh(prev => prev + 1);
        }
    };

    return (
        <div className="manage-blogs">
            <div className="manage-blogs__header">
                <h1>Manage Blog Posts</h1>
                <Link to="/admin/blogs/new" className="btn btn--primary">+ New Post</Link>
            </div>

            <div className="manage-blogs__list">
                {blogs.map(blog => (
                    <div key={blog.id} className="manage-blogs__item">
                        <div className="manage-blogs__thumb-wrap">
                            <img src={blog.coverImage} alt="" className="manage-blogs__thumb" />
                        </div>
                        <div className="manage-blogs__content">
                            <h3 className="manage-blogs__title">{blog.title}</h3>
                            <p className="manage-blogs__excerpt">{blog.excerpt}</p>
                            <div className="manage-blogs__meta">
                                <span>{new Date(blog.publishedDate).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{blog.author}</span>
                                <span>•</span>
                                <span className={`manage-blogs__status manage-blogs__status--${blog.status}`}>
                                    {blog.status}
                                </span>
                            </div>
                        </div>
                        <div className="manage-blogs__actions">
                            <Link to={`/admin/blogs/${blog.id}/edit`} className="btn btn--sm btn--secondary">Edit</Link>
                            <button onClick={() => handleDelete(blog.id)} className="btn btn--sm btn--outline manage-blogs__delete">Delete</button>
                        </div>
                    </div>
                ))}
                {blogs.length === 0 && (
                    <div className="manage-blogs__empty">
                        <p>No blog posts found. Create your first one!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
