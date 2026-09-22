import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, MapPin, Plus } from 'lucide-react';

export default function ClientDirectory() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '', company: '', email: '', phone: '', address: ''
    });

    const fetchClients = async () => {
        try {
            const res = await fetch('/api/crm/clients');
            if (res.ok) {
                const data = await res.json();
                setClients(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleAddClient = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/crm/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowAddForm(false);
                setFormData({ name: '', company: '', email: '', phone: '', address: '' });
                fetchClients();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>LOADING CLIENTS...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)' }}>Client Directory</h3>
                <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                        background: showAddForm ? 'transparent' : 'var(--primary)',
                        color: showAddForm ? 'var(--text-muted)' : '#000',
                        border: '1px solid var(--primary)',
                        padding: '0.5rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer'
                    }}
                >
                    {showAddForm ? 'Cancel' : <><Plus className="w-4 h-4 inline-block mr-1" /> Add Client</>}
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={handleAddClient} style={{ background: 'var(--bg-card)', padding: '1.5rem', border: '1px solid var(--primary)', marginBottom: '2rem', boxShadow: 'var(--shadow-glow)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Contact Name</label>
                            <input required className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Company</label>
                            <input required className="form-input" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Email</label>
                            <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Phone</label>
                            <input className="form-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Address</label>
                            <input className="form-input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                        </div>
                    </div>
                    <button type="submit" style={{ background: 'var(--primary)', color: 'var(--primary-text)', border: 'none', padding: '0.5rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer' }}>
                        Save Client
                    </button>
                </form>
            )}

            {clients.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>No Clients Found.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {clients.map(client => (
                        <div key={client.client_id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1.5rem', transition: 'all 0.2s' }} className="hover:border-primary hover:shadow-glow">
                            <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Users className="w-5 h-5 text-primary" /> {client.company}
                            </h4>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                Contact: {client.name}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                                {client.email && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                                        <Mail className="w-4 h-4 text-muted" /> {client.email}
                                    </div>
                                )}
                                {client.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                                        <Phone className="w-4 h-4 text-muted" /> {client.phone}
                                    </div>
                                )}
                                {client.address && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-main)' }}>
                                        <MapPin className="w-4 h-4 text-muted flex-shrink-0 mt-1" /> {client.address}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
