import React, { useState, useEffect } from 'react';
import { FileText, Plus, CheckCircle2, Circle } from 'lucide-react';

export default function InvoicesView() {
    const [invoices, setInvoices] = useState([]);
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    
    const [formData, setFormData] = useState({
        client_id: '', project_id: '', amount: '', issue_date: '', due_date: ''
    });

    const fetchData = async () => {
        try {
            const [invRes, cliRes, projRes] = await Promise.all([
                fetch('/api/crm/invoices'),
                fetch('/api/crm/clients'),
                fetch('/api/projects/my-projects?manager_id=1') // Simplification for demo
            ]);
            
            if (invRes.ok) setInvoices(await invRes.json());
            if (cliRes.ok) setClients(await cliRes.json());
            if (projRes.ok) setProjects(await projRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Today's date for defaults
        const today = new Date().toISOString().split('T')[0];
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        setFormData(prev => ({ ...prev, issue_date: today, due_date: nextMonth.toISOString().split('T')[0] }));
    }, []);

    const handleGenerateInvoice = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/crm/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowAddForm(false);
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>LOADING INVOICES...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)' }}>Invoices</h3>
                <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                        background: showAddForm ? 'transparent' : 'var(--primary)',
                        color: showAddForm ? 'var(--text-muted)' : '#000',
                        border: '1px solid var(--primary)',
                        padding: '0.5rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer'
                    }}
                >
                    {showAddForm ? 'Cancel' : <><Plus className="w-4 h-4 inline-block mr-1" /> Generate Invoice</>}
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={handleGenerateInvoice} style={{ background: 'var(--bg-card)', padding: '1.5rem', border: '1px solid var(--primary)', marginBottom: '2rem', boxShadow: 'var(--shadow-glow)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Client</label>
                            <select required className="form-input" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
                                <option value="">-- Select Client --</option>
                                {clients.map(c => <option key={c.client_id} value={c.client_id}>{c.company} ({c.name})</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Project (Optional)</label>
                            <select className="form-input" value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})}>
                                <option value="">-- Select Project --</option>
                                {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Amount ($)</label>
                            <input required type="number" step="0.01" className="form-input" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Issue Date</label>
                                <input required type="date" className="form-input" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Due Date</label>
                                <input required type="date" className="form-input" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
                            </div>
                        </div>
                    </div>
                    <button type="submit" style={{ background: 'var(--primary)', color: 'var(--primary-text)', border: 'none', padding: '0.5rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer' }}>
                        Generate Invoice
                    </button>
                </form>
            )}

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--bg-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        <tr>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>ID</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Client</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Amount</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Dates</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No invoices found.</td></tr>
                        ) : invoices.map(inv => (
                            <tr key={inv.invoice_id} className="hover:bg-white/5" style={{ transition: 'background 0.2s', borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)' }}>INV-{inv.invoice_id.toString().padStart(4, '0')}</td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{inv.client_company}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{inv.project_name || 'General Services'}</div>
                                </td>
                                <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '1.1rem' }}>
                                    ${parseFloat(inv.amount).toLocaleString()}
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <div>Issued: {inv.issue_date}</div>
                                    <div style={{ color: new Date(inv.due_date) < new Date() && inv.status !== 'Paid' ? 'var(--danger)' : 'inherit' }}>
                                        Due: {inv.due_date}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ 
                                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.5rem',
                                        fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                                        border: `1px solid ${inv.status === 'Paid' ? 'var(--success)' : 'var(--warning)'}`,
                                        color: inv.status === 'Paid' ? 'var(--success)' : 'var(--warning)',
                                        background: inv.status === 'Paid' ? 'rgba(0, 255, 128, 0.1)' : 'rgba(255, 170, 0, 0.1)'
                                    }}>
                                        {inv.status === 'Paid' ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                                        {inv.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
