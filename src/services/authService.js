const AUTH_KEY = 'vancar_auth';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

export function login(username, password) {
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        const session = {
            user: username,
            loggedIn: true,
            timestamp: Date.now()
        };
        sessionStorage.setItem(AUTH_KEY, JSON.stringify(session));
        return { success: true, user: username };
    }
    return { success: false, error: 'Invalid username or password' };
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
