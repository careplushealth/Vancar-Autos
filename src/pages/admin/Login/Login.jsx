import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../../services/authService';
import Logo from '../../../components/Logo/Logo';
import './Login.css';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await login(username, password);
            if (result.success) {
                navigate('/admin');
            } else {
                setError(result.error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login">
            <div className="admin-login__card">
                <div className="admin-login__header">
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                        <Logo style={{ height: '46px' }} />
                    </div>
                    <h1>Admin Portal</h1>
                    <p>Enter your credentials to access the admin portal</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="admin-login__error">{error}</div>}
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" required disabled={loading} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="********" required disabled={loading} />
                    </div>
                    <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Connecting to Server...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
