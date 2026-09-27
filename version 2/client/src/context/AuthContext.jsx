import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [quickUsers, setQuickUsers] = useState([]);

    useEffect(() => {
        const savedToken = localStorage.getItem('dbms_auth_token');
        const savedUser = localStorage.getItem('dbms_auth_user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }

        // Fetch quick login presets
        fetch('/api/auth/quick-users')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setQuickUsers(data);
            })
            .catch(err => console.error('Error loading quick users:', err));
    }, []);

    const authenticate = async (url, body) => {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Login failed');
        }
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('dbms_auth_token', data.token);
        localStorage.setItem('dbms_auth_user', JSON.stringify(data.user));
        return data;
    };

    const login = (username, password) => authenticate('/api/auth/login', { username, password });

    // Master-password login for the /admin terminal
    const adminLogin = (password) => authenticate('/api/auth/admin-login', { password });

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('dbms_auth_token');
        localStorage.removeItem('dbms_auth_user');
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!user,
            quickUsers,
            login,
            adminLogin,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
