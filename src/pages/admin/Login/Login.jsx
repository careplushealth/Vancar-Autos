import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../../services/authService';
import './Login.css';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(username, password);
        if (result.success) {
            navigate('/admin');
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="admin-login">
            <div className="admin-login__card">
                <div className="admin-login__header">
                    <span className="admin-login__logo">VCA</span>
                    <h1>Admin Login</h1>
                    <p>Enter your credentials to access the admin panel</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="admin-login__error">{error}</div>}
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="********" required />
                    </div>
                    <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%' }}>Sign In</button>
                </form>
            </div>
        </div>
    );
}
