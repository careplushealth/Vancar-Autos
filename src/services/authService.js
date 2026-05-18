const AUTH_KEY = 'vancar_auth';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export async function login(username, password) {
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (data.success) {
            const session = {
                user: data.user,
                loggedIn: true,
                timestamp: Date.now()
            };
            sessionStorage.setItem(AUTH_KEY, JSON.stringify(session));
            return { success: true, user: data.user };
        }
        return { success: false, error: data.error || 'Invalid credentials' };
    } catch (err) {
        return { success: false, error: 'Server connection failed' };
    }
}

export function logout() {
    sessionStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated() {
    const session = sessionStorage.getItem(AUTH_KEY);
    if (!session) return false;
    try {
        const parsed = JSON.parse(session);
        return parsed.loggedIn === true;
    } catch {
        return false;
    }
}

export function getCurrentUser() {
    const session = sessionStorage.getItem(AUTH_KEY);
    if (!session) return null;
    try {
        const parsed = JSON.parse(session);
        return parsed.loggedIn ? parsed.user : null;
    } catch {
        return null;
    }
}
