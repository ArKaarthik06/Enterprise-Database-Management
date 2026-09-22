import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Key, ArrowRight, Sparkles, Database } from 'lucide-react';

export default function EmployeeLogin() {
    const { login, quickUsers } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(username, password);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickSelect = (userObj) => {
        setUsername(userObj.username);
        setPassword(userObj.password);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-page)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background design elements */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: 'linear-gradient(rgba(204, 255, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(204, 255, 0, 0.05) 1px, transparent 1px)',
                backgroundSize: '40px 40px', zIndex: 0
            }} />

            <div style={{
                position: 'relative', zIndex: 1,
                background: 'var(--bg-card)',
                padding: '3rem 2.5rem',
                border: '1px solid var(--primary)',
                boxShadow: 'var(--shadow-glow)',
                width: '100%',
                maxWidth: '440px',
            }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ 
                        background: 'var(--primary)',
                        padding: '1rem', display: 'inline-block' 
                    }}>
                        <Database className="w-8 h-8" style={{ color: 'var(--primary-text)' }} />
                    </div>
                </div>
                
                <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--primary)', textAlign: 'center' }}>
                    Employee Login
                </h2>
                <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>
                    Enterprise CRM Access System
                </p>

                {error && (
                    <div style={{
                        background: 'rgba(255,0,60,0.1)', border: '1px solid var(--danger)',
                        color: 'var(--danger)', padding: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '1.25rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ position: 'relative' }}>
                        <User className="w-5 h-5" style={{ 
                            position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' 
                        }} />
                        <input
                            type="text"
                            placeholder="Username or Email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.85rem 1rem 0.85rem 2.75rem',
                                background: 'var(--bg-page)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--primary)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'border 0.1s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Key className="w-5 h-5" style={{ 
                            position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' 
                        }} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.85rem 1rem 0.85rem 2.75rem',
                                background: 'var(--bg-page)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--primary)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'border 0.1s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            background: 'var(--primary)', color: 'var(--primary-text)', padding: '0.875rem',
                            fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '1rem', textTransform: 'uppercase',
                            border: '1px solid var(--primary)', cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1, transition: 'all 0.1s', marginTop: '0.5rem'
                        }}
                        onMouseEnter={(e) => { if(!loading) e.target.style.boxShadow = 'var(--shadow-glow)' }}
                        onMouseLeave={(e) => { if(!loading) e.target.style.boxShadow = 'none' }}
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                </form>

                {/* Quick Select Demo Accounts */}
                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '1rem' }}>
                        <Sparkles className="w-4 h-4" />
                        <span>Quick Demo Logins</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {quickUsers.filter(u => u.role_name !== 'Admin').slice(0, 4).map((u, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleQuickSelect(u)}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.75rem',
                                    background: 'transparent', border: '1px solid var(--border-color)',
                                    fontFamily: 'var(--font-mono)', cursor: 'pointer', transition: 'all 0.1s',
                                    textAlign: 'left'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-hover)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.backgroundColor = 'transparent' }}
                            >
                                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-main)', textTransform: 'uppercase' }}>{u.name}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.role_name}</span>
                            </button>
                        ))}
                    </div>
                </div>
                
                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center' }}>
                    <a href="/admin" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                       onMouseEnter={(e) => e.target.style.color = 'var(--primary)'}
                       onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>
                        Switch to Admin Terminal
                    </a>
                </div>
            </div>
        </div>
    );
}
