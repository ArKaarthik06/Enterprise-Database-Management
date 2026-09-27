import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Alert } from './ui';

export default function AdminLogin() {
    const { adminLogin } = useAuth();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await adminLogin(password);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-main" style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
            <div className="card auth-card" style={{ padding: '2rem', boxShadow: 'var(--shadow-md)' }}>
                <div className="stat-icon tone-primary" style={{ width: 44, height: 44, marginBottom: '1rem' }}>
                    <ShieldCheck size={22} />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Admin terminal</h2>
                <p className="muted" style={{ marginBottom: '1.5rem' }}>Enter the master password to open the database workbench.</p>

                <form onSubmit={handleSubmit} className="stack">
                    {error && <Alert tone="danger">{error}</Alert>}
                    <label className="field">
                        <span className="form-label">Master password</span>
                        <div className="input-icon">
                            <Lock size={16} />
                            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required autoFocus />
                        </div>
                    </label>
                    <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block">
                        {loading ? 'Verifying…' : <>Unlock <ArrowRight size={16} /></>}
                    </button>
                </form>

                <div className="text-sm muted" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <a href="/">Back to employee sign in</a>
                </div>
            </div>
        </div>
    );
}
