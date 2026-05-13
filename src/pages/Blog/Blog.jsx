import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getPublishedBlogs } from '../../services/dataService';
import './Blog.css';

export default function Blog() {
    const blogs = useMemo(() => getPublishedBlogs(), []);

    return (
        <div className="blog-list">
            <div className="container">
                <div className="blog-list__header">
                    <h1 className="blog-list__title">News & Blog</h1>
                    <p className="blog-list__subtitle">Stay up to date with the latest from VANCAR AUTOS</p>
                </div>

                <div className="blog-list__grid">
                    {blogs.map(blog => (
                        <Link key={blog.id} to={`/blog/${blog.slug}`} className="blog-list__card">
                            <div className="blog-list__card-image-wrap">
                                <img src={blog.coverImage} alt={blog.title} className="blog-list__card-image" />
                            </div>
                            <div className="blog-list__card-body">
                                <div className="blog-list__card-tags">
                                    {blog.tags?.slice(0, 2).map(t => <span key={t} className="blog-list__tag">{t}</span>)}
                                </div>
                                <h2 className="blog-list__card-title">{blog.title}</h2>
                                <p className="blog-list__card-excerpt">{blog.excerpt}</p>
                                <div className="blog-list__card-meta">
                                    <span>{blog.author}</span>
                                    <span>{new Date(blog.publishedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
