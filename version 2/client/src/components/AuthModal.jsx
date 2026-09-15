import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Key, X, Sparkles, ArrowRight } from 'lucide-react';

export default function AuthModal() {
    const { isAuthModalOpen, setIsAuthModalOpen, login, quickUsers } = useAuth();
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!isAuthModalOpen) return null;

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
        <div className="modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
            <div className="modal-card" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Lock className="w-5 h-5 text-indigo-600" />
                        <h2 className="modal-title">Enterprise Sign In</h2>
                    </div>
                    <button onClick={() => setIsAuthModalOpen(false)} className="btn btn-ghost btn-sm">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    {error && (
                        <div className="badge badge-danger" style={{ display: 'block', padding: '0.6rem', marginBottom: '1rem' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Username or Email or Sasi </label>
                            <div style={{ position: 'relative' }}>
                                <User className="w-4 h-4" style={{ position: 'absolute', left: '0.75rem', top: '0.65rem', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="form-input"
                                    style={{ paddingLeft: '2.25rem' }}
                                    placeholder="Enter username"
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <Key className="w-4 h-4" style={{ position: 'absolute', left: '0.75rem', top: '0.65rem', color: 'var(--text-muted)' }} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="form-input"
                                    style={{ paddingLeft: '2.25rem' }}
                                    placeholder="Enter password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '0.75rem' }}
                        >
                            {loading ? <span>Authenticating...</span> : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Quick Select Demo Accounts */}
                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                            <Sparkles className="w-4 h-4 text-warning-text" />
                            <span>Quick Demo Accounts (1-Click Fill)</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            {quickUsers.slice(0, 10).map((u, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleQuickSelect(u)}
                                    className="btn btn-outline btn-sm"
                                    style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '0.5rem', textTransform: 'none' }}
                                >
                                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)' }}>{u.name}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.role_name} ({u.username})</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer" style={{ justifyContent: 'center' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Enterprise DBMS Auth • Role-based Security
                    </p>
                </div>

            </div>
        </div>
    );
}
