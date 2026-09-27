import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, KeyRound, ArrowRight, Database, ShieldCheck, Layers, GitBranch } from 'lucide-react';
import { Alert, Avatar } from './ui';

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

    // One demo account per role, so every workspace can be tried quickly
    const demoAccounts = [];
    const seenRoles = new Set();
    quickUsers.forEach(u => {
        if (!seenRoles.has(u.role_name)) {
            seenRoles.add(u.role_name);
            demoAccounts.push(u);
        }
    });

    return (
        <div className="auth-shell">
            <aside className="auth-aside">
                <div className="row" style={{ gap: '0.7rem' }}>
                    <div className="brand-icon" style={{ background: 'rgba(255,255,255,0.14)' }}><Database size={18} /></div>
                    <div className="strong" style={{ fontSize: '1.05rem' }}>Enterprise DBMS</div>
                </div>

                <div style={{ maxWidth: 460 }}>
                    <h1 style={{ fontSize: '2.2rem', lineHeight: 1.15, letterSpacing: '-0.03em', fontWeight: 700, marginBottom: '0.9rem' }}>
                        One relational database for people, projects and revenue.
                    </h1>
                    <p style={{ opacity: 0.8, fontSize: '1rem' }}>
                        HR, project delivery, CRM and billing workflows backed by 19 normalized SQLite tables with enforced foreign keys and transactional writes.
                    </p>
                </div>

                <div className="stack-sm" style={{ opacity: 0.85, fontSize: '0.88rem' }}>
                    <div className="row"><Layers size={16} /> 19 tables in third normal form</div>
                    <div className="row"><ShieldCheck size={16} /> ACID transactions with WAL journaling</div>
                    <div className="row"><GitBranch size={16} /> Role-based workspaces for staff and clients</div>
                </div>
            </aside>

            <main className="auth-main">
                <div className="auth-card">
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Sign in</h2>
                    <p className="muted" style={{ marginBottom: '1.5rem' }}>Use your work account or pick a demo profile below.</p>

                    <form onSubmit={handleSubmit} className="stack">
                        {error && <Alert tone="danger">{error}</Alert>}

                        <label className="field">
                            <span className="form-label">Username or email</span>
                            <div className="input-icon">
                                <User size={16} />
                                <input className="form-input" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
                            </div>
                        </label>

                        <label className="field">
                            <span className="form-label">Password</span>
                            <div className="input-icon">
                                <KeyRound size={16} />
                                <input className="form-input" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
                            </div>
                        </label>

                        <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block">
                            {loading ? 'Signing in…' : <>Sign in <ArrowRight size={16} /></>}
                        </button>
                    </form>

                    {demoAccounts.length > 0 && (
                        <div style={{ marginTop: '1.75rem' }}>
                            <div className="section-title">Demo accounts</div>
                            <div className="quick-grid">
                                {demoAccounts.map(u => (
                                    <button
                                        key={u.username}
                                        type="button"
                                        className="quick-btn"
                                        onClick={() => { setUsername(u.username); setPassword(u.password); setError(null); }}
                                    >
                                        <Avatar name={u.name} size="sm" />
                                        <div style={{ minWidth: 0 }}>
                                            <div className="text-sm strong truncate">{u.name}</div>
                                            <div className="text-xs muted truncate">{u.role_name}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="text-sm muted" style={{ marginTop: '1.75rem', textAlign: 'center' }}>
                        System administrator? <a href="/admin">Open the admin terminal</a>
                    </div>
                </div>
            </main>
        </div>
    );
}
