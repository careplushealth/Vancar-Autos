import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getBlogById, createBlog, updateBlog } from '../../../services/dataService';
import './BlogEditor.css';

const INITIAL_FORM = {
    title: '', slug: '', excerpt: '', content: '',
    coverImage: '', author: 'Admin', tags: [],
    status: 'draft', publishedDate: new Date().toISOString()
};

export default function BlogEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;
    const [form, setForm] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit) {
            const blog = getBlogById(id);
            if (blog) setForm(blog);
        }
    }, [id, isEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    // Auto-generate slug from title if not manually edited
    const handleTitleChange = (e) => {
        const title = e.target.value;
        setForm(prev => ({
            ...prev,
            title,
            slug: prev.slug && isEdit ? prev.slug : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        }));
    };

    const handleTagsChange = (e) => {
        const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
        setForm(prev => ({ ...prev, tags }));
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
                setForm(prev => ({ ...prev, coverImage: data.secure_url }));
            }
        } catch (err) {
            console.error('Image upload failed:', err);
            alert('Upload failed. Please try again.');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            if (isEdit) {
                updateBlog(id, form);
            } else {
                createBlog(form);
            }
            navigate('/admin/blogs');
        }, 500);
    };

    return (
        <div className="blog-editor">
            <div className="blog-editor__header">
                <h1>{isEdit ? 'Edit Post' : 'New Blog Post'}</h1>
            </div>

            <form className="blog-editor__form" onSubmit={handleSubmit}>
                <div className="blog-editor__main">
                    <div className="form-group">
                        <label className="form-label">Title</label>
                        <input name="title" className="form-input" value={form.title} onChange={handleTitleChange} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Slug</label>
                        <input name="slug" className="form-input" value={form.slug} onChange={handleChange} required />
                        <small className="form-hint">URL friendly name (e.g. my-post-title)</small>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Content (Markdown supported)</label>
                        <textarea name="content" className="form-input" rows={15} value={form.content} onChange={handleChange} required />
                        <small className="form-hint">Use ## for headers, **bold** for emphasis, - for lists.</small>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Excerpt</label>
                        <textarea name="excerpt" className="form-input" rows={3} value={form.excerpt} onChange={handleChange} required />
                    </div>
                </div>

                <div className="blog-editor__sidebar">
                    <div className="blog-editor__panel">
                        <h3>Publishing</h3>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Author</label>
                            <input name="author" className="form-input" value={form.author} onChange={handleChange} />
                        </div>
                        <button type="submit" className="btn btn--primary" style={{ width: '100%', marginTop: 'var(--spacing-md)' }} disabled={loading}>
                            {loading ? 'Saving...' : 'Save Post'}
                        </button>
                        <Link to="/admin/blogs" className="btn btn--outline" style={{ width: '100%', marginTop: 'var(--spacing-sm)', textAlign: 'center' }}>
                            Cancel
                        </Link>
                    </div>

                    <div className="blog-editor__panel">
                        <h3>Meta</h3>
                        <div className="form-group">
                            <label className="form-label">Cover Image URL</label>
                            <input name="coverImage" className="form-input" value={form.coverImage} onChange={handleChange} placeholder="/images/..." />
                            <label className="btn btn--outline" style={{ cursor: 'pointer', display: 'block', marginTop: 'var(--spacing-sm)', textAlign: 'center' }}>
                                Upload Cover Image
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                            </label>
                        </div>
                        {form.coverImage && (
                            <div className="blog-editor__cover-preview">
                                <img src={form.coverImage} alt="Cover" />
                            </div>
                        )}
                        <div className="form-group">
                            <label className="form-label">Tags (comma separated)</label>
                            <input name="tags" className="form-input" value={(form.tags || []).join(', ')} onChange={handleTagsChange} />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
