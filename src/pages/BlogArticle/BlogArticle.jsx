import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBlogBySlug } from '../../services/dataService';
import './BlogArticle.css';

export default function BlogArticle() {
    const { slug } = useParams();
    const blog = useMemo(() => getBlogBySlug(slug), [slug]);

    if (!blog) {
        return (
            <div className="blog-article container" style={{ textAlign: 'center', padding: '6rem 0' }}>
                <h2>Article not found</h2>
                <p style={{ color: 'var(--color-text-secondary)', margin: '1rem 0 2rem' }}>The article you're looking for doesn't exist.</p>
                <Link to="/blog" className="btn btn--primary">Back to Blog</Link>
            </div>
        );
    }

    const formattedContent = blog.content.split('\n').map((line, i) => {
        if (line.startsWith('## ')) return <h2 key={i}>{line.replace('## ', '')}</h2>;
        if (line.startsWith('### ')) return <h3 key={i}>{line.replace('### ', '')}</h3>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i}><strong>{line.replace(/\*\*/g, '')}</strong></p>;
        if (line.startsWith('- ')) return <li key={i}>{line.replace('- ', '')}</li>;
        if (line.trim() === '') return <br key={i} />;
        return <p key={i}>{line}</p>;
    });

    return (
        <div className="blog-article">
            <div className="blog-article__hero">
                <img src={blog.coverImage} alt={blog.title} />
                <div className="blog-article__hero-overlay" />
            </div>

            <div className="container">
                <article className="blog-article__content">
                    <div className="blog-article__meta">
                        <Link to="/blog" className="blog-article__back">← Back to Blog</Link>
                        <div className="blog-article__tags">
                            {blog.tags?.map(t => <span key={t} className="blog-list__tag">{t}</span>)}
                        </div>
                    </div>

                    <h1 className="blog-article__title">{blog.title}</h1>

                    <div className="blog-article__info">
                        <span>By {blog.author}</span>
                        <span>•</span>
                        <span>{new Date(blog.publishedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>

                    <div className="blog-article__body">
                        {formattedContent}
                    </div>
                </article>
            </div>
        </div>
    );
}
