import React, { useState } from 'react';
import { Database, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin({ onLoginSuccess }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { setIsAuthModalOpen } = useAuth(); // we won't strictly need this but it's part of context

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Authentication failed');
            }
            
            // Store token or inform parent to switch view
            localStorage.setItem('dbms_auth_token', data.token);
            localStorage.setItem('dbms_auth_user', JSON.stringify(data.user));
            
            // Call success handler to render main app
            if (onLoginSuccess) {
                onLoginSuccess(data.user);
            }
            
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-main)',
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
                maxWidth: '420px',
                textAlign: 'center'
            }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ 
                        background: 'var(--primary)',
                        padding: '1rem', display: 'inline-block' 
                    }}>
                        <Database className="w-10 h-10" style={{ color: 'var(--primary-text)' }} />
                    </div>
                </div>
                
                <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                    Admin Terminal
                </h2>
                <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    Enter the Master Password to access the Data Explorer.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Lock className="w-5 h-5" style={{ 
                            position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' 
                        }} />
                        <input
                            type="password"
                            placeholder="Master Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoFocus
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

                    {error && (
                        <div style={{
                            background: 'rgba(255,0,60,0.1)', border: '1px solid var(--danger)',
                            color: 'var(--danger)', padding: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', textTransform: 'uppercase'
                        }}>
                            {error}
                        </div>
                    )}

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
                        {loading ? 'Authenticating...' : 'Access System'}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                </form>

                {/* Quick Select Demo Accounts */}
                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '1rem' }}>
                        <Database className="w-4 h-4" />
                        <span>Quick Demo Logins</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                        <button
                            type="button"
                            onClick={() => setPassword('admin')}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.75rem',
                                background: 'transparent', border: '1px solid var(--border-color)',
                                fontFamily: 'var(--font-mono)', cursor: 'pointer', transition: 'all 0.1s',
                                textAlign: 'left'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-hover)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.backgroundColor = 'transparent' }}
                        >
                            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-main)', textTransform: 'uppercase' }}>Super Admin</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Master Database Access</span>
                        </button>
                    </div>
                </div>
                
                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                       onMouseEnter={(e) => e.target.style.color = 'var(--primary)'}
                       onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>
                        Return to CRM Logins
                    </a>
                </div>
            </div>
        </div>
    );
}
