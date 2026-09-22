import React, { useState, useEffect } from 'react';
import { Plus, GripVertical, Check, Building2, User, Phone, Mail, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LeadsKanban() {
    const { user } = useAuth();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        expected_value: ''
    });

    // Interaction state
    const [selectedLead, setSelectedLead] = useState(null);
    const [interactions, setInteractions] = useState([]);
    const [interactForm, setInteractForm] = useState({ interaction_type: 'Call', notes: '' });

    const STAGES = ['New', 'Contacted', 'Proposal', 'Won', 'Lost'];

    const fetchLeads = async () => {
        try {
            // Fetching all leads for demo, passing employee_id just in case
            const res = await fetch(`/api/crm/leads?employee_id=${user.employee_id}`);
            if (res.ok) {
                const data = await res.json();
                setLeads(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, [user]);

    const handleCreateLead = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/crm/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, assigned_to: user.employee_id })
            });
            if (res.ok) {
                setShowAddForm(false);
                setFormData({ company_name: '', contact_name: '', email: '', phone: '', expected_value: '' });
                fetchLeads();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const updateLeadStatus = async (leadId, newStatus) => {
        try {
            const res = await fetch(`/api/crm/leads/${leadId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                // Optimistic UI update
                setLeads(leads.map(l => l.lead_id === leadId ? { ...l, status: newStatus } : l));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openInteractions = async (lead) => {
        setSelectedLead(lead);
        try {
            const res = await fetch(`/api/crm/interactions?entity_type=Lead&entity_id=${lead.lead_id}`);
            if (res.ok) setInteractions(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogInteraction = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/crm/interactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entity_type: 'Lead',
                    entity_id: selectedLead.lead_id,
                    interaction_type: interactForm.interaction_type,
                    notes: interactForm.notes,
                    employee_id: user.employee_id
                })
            });
            if (res.ok) {
                setInteractForm({ interaction_type: 'Call', notes: '' });
                openInteractions(selectedLead); // refresh list
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>LOADING PIPELINE...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)' }}>Sales Pipeline</h3>
                <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                        background: showAddForm ? 'transparent' : 'var(--primary)',
                        color: showAddForm ? 'var(--text-muted)' : 'var(--primary-text)',
                        border: '1px solid var(--primary)',
                        padding: '0.5rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer'
                    }}
                >
                    {showAddForm ? 'Cancel' : <><Plus className="w-4 h-4 inline-block mr-1" /> New Lead</>}
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={handleCreateLead} style={{ background: 'var(--bg-card)', padding: '1.5rem', border: '1px solid var(--primary)', marginBottom: '2rem', boxShadow: 'var(--shadow-glow)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Company Name</label>
                            <input required className="form-input" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Contact Name</label>
                            <input required className="form-input" value={formData.contact_name} onChange={e => setFormData({...formData, contact_name: e.target.value})} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Email</label>
                            <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Phone</label>
                            <input className="form-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Expected Value ($)</label>
                            <input type="number" className="form-input" value={formData.expected_value} onChange={e => setFormData({...formData, expected_value: e.target.value})} />
                        </div>
                    </div>
                    <button type="submit" style={{ background: 'var(--primary)', color: 'var(--primary-text)', border: 'none', padding: '0.5rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer' }}>
                        Save Lead
                    </button>
                </form>
            )}

            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                {STAGES.map(stage => {
                    const stageLeads = leads.filter(l => l.status === stage);
                    return (
                        <div key={stage} style={{ flex: 1, minWidth: '200px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.9rem', color: stage === 'Won' ? 'var(--success)' : (stage === 'Lost' ? 'var(--danger)' : 'var(--text-main)') }}>
                                    {stage}
                                </span>
                                <span style={{ background: 'var(--bg-card)', padding: '0.1rem 0.4rem', fontSize: '0.75rem', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)' }}>
                                    {stageLeads.length}
                                </span>
                            </div>
                            <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '300px' }}>
                                {stageLeads.map(lead => (
                                    <div key={lead.lead_id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.75rem', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <Building2 className="w-3 h-3" /> {lead.company_name}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                                                ${parseFloat(lead.expected_value).toLocaleString()}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <User className="w-3 h-3" /> {lead.contact_name}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem' }}>
                                            <select 
                                                value={lead.status}
                                                onChange={(e) => updateLeadStatus(lead.lead_id, e.target.value)}
                                                style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.75rem', padding: '0.2rem', fontFamily: 'var(--font-mono)' }}
                                            >
                                                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <button 
                                                onClick={() => openInteractions(lead)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}
                                            >
                                                <MessageSquare className="w-3 h-3" /> Log
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedLead && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'var(--bg-page)', border: '1px solid var(--primary)', padding: '2rem', width: '500px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontFamily: 'var(--font-mono)', color: 'var(--primary)', textTransform: 'uppercase' }}>Interactions: {selectedLead.company_name}</h3>
                            <button onClick={() => setSelectedLead(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Close</button>
                        </div>
                        
                        <form onSubmit={handleLogInteraction} style={{ marginBottom: '2rem', background: 'var(--bg-card)', padding: '1rem', border: '1px solid var(--border-color)' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Type</label>
                                <select className="form-input" value={interactForm.interaction_type} onChange={e => setInteractForm({...interactForm, interaction_type: e.target.value})}>
                                    <option>Call</option>
                                    <option>Email</option>
                                    <option>Meeting</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Notes</label>
                                <textarea required className="form-input" rows="3" value={interactForm.notes} onChange={e => setInteractForm({...interactForm, notes: e.target.value})}></textarea>
                            </div>
                            <button type="submit" className="btn btn-primary">Log Interaction</button>
                        </form>

                        <div>
                            <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Past Interactions</h4>
                            {interactions.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>No interactions logged yet.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {interactions.map(i => (
                                        <div key={i.interaction_id} style={{ padding: '1rem', background: 'var(--bg-subtle)', borderLeft: '3px solid var(--primary)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                                                <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{i.interaction_type}</span>
                                                <span style={{ color: 'var(--text-muted)' }}>{new Date(i.date).toLocaleString()}</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>{i.notes}</p>
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>By: {i.first_name} {i.last_name}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
