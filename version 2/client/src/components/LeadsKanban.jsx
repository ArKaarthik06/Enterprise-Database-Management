import React, { useState } from 'react';
import { Plus, Building2, User, MessageSquare, Trash2, UserCheck, Mail, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import InteractionLog from './InteractionLog';
import { Modal, FormModal, Field, Loading, Avatar, useForm, useAction, useLookups, api, fmtMoney, fmtDate, fullName } from './ui';

const STAGES = ['New', 'Contacted', 'Proposal', 'Won', 'Lost'];
const STAGE_DOT = { New: 'var(--info)', Contacted: 'var(--primary)', Proposal: 'var(--warning)', Won: 'var(--success)', Lost: 'var(--danger)' };

export default function LeadsKanban({ leads }) {
    const run = useAction();
    const [creating, setCreating] = useState(false);
    const [openLead, setOpenLead] = useState(null);
    const [dragId, setDragId] = useState(null);
    const [overStage, setOverStage] = useState(null);

    const moveLead = async (lead, status) => {
        if (lead.status === status) return;
        leads.setData(ls => ls.map(l => l.lead_id === lead.lead_id ? { ...l, status } : l));
        const ok = await run(() => api.put(`/api/crm/leads/${lead.lead_id}/status`, { status }), `${lead.company_name} → ${status}`);
        if (!ok) leads.reload();
    };

    const onDrop = (stage) => {
        const lead = leads.data.find(l => l.lead_id === dragId);
        setDragId(null);
        setOverStage(null);
        if (lead) moveLead(lead, stage);
    };

    if (leads.loading) return <Loading label="Loading pipeline…" />;

    return (
        <div className="stack">
            <div className="row-between">
                <div className="text-sm muted">Drag cards between stages, or open a lead to log calls and convert it into a client.</div>
                <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}><Plus size={15} /> New lead</button>
            </div>

            <div className="kanban">
                {STAGES.map(stage => {
                    const stageLeads = leads.data.filter(l => l.status === stage);
                    const total = stageLeads.reduce((s, l) => s + (l.expected_value || 0), 0);
                    return (
                        <div
                            key={stage}
                            className={`kanban-col ${overStage === stage ? 'drag-over' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setOverStage(stage); }}
                            onDragLeave={() => setOverStage(null)}
                            onDrop={() => onDrop(stage)}
                        >
                            <div className="kanban-col-header">
                                <span className="kanban-col-title">
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: STAGE_DOT[stage] }} />
                                    {stage}
                                    <span className="tab-count">{stageLeads.length}</span>
                                </span>
                                <span className="kanban-col-total">{fmtMoney(total)}</span>
                            </div>
                            <div className="kanban-cards">
                                {stageLeads.map(lead => (
                                    <div
                                        key={lead.lead_id}
                                        className={`kanban-card ${dragId === lead.lead_id ? 'dragging' : ''}`}
                                        draggable
                                        onDragStart={() => setDragId(lead.lead_id)}
                                        onDragEnd={() => { setDragId(null); setOverStage(null); }}
                                        onClick={() => setOpenLead(lead)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={e => e.key === 'Enter' && setOpenLead(lead)}
                                    >
                                        <div className="row-between" style={{ alignItems: 'flex-start' }}>
                                            <div className="strong text-sm">{lead.company_name}</div>
                                            <span className="mono text-xs strong">{fmtMoney(lead.expected_value)}</span>
                                        </div>
                                        <div className="text-xs muted row" style={{ gap: 4, marginTop: 2 }}><User size={11} />{lead.contact_name}</div>
                                        <div className="row-between" style={{ marginTop: '0.55rem' }}>
                                            <span className="text-xs muted">{lead.first_name ? `${lead.first_name} ${lead.last_name}` : 'Unassigned'}</span>
                                            {lead.interaction_count > 0 && <span className="text-xs muted row" style={{ gap: 3 }}><MessageSquare size={11} />{lead.interaction_count}</span>}
                                        </div>
                                    </div>
                                ))}
                                {stageLeads.length === 0 && <div className="text-xs light" style={{ textAlign: 'center', padding: '1rem 0' }}>Drop leads here</div>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {creating && <LeadFormModal onClose={() => setCreating(false)} onSaved={leads.reload} />}
            {openLead && (
                <LeadDetailModal
                    lead={leads.data.find(l => l.lead_id === openLead.lead_id) || openLead}
                    onMove={moveLead}
                    onClose={() => { setOpenLead(null); leads.reload(); }}
                    onChanged={leads.reload}
                />
            )}
        </div>
    );
}

function LeadDetailModal({ lead, onMove, onClose, onChanged }) {
    const { user } = useAuth();
    const run = useAction();
    const [editing, setEditing] = useState(false);

    const convert = async () => {
        if (!window.confirm(`Convert ${lead.company_name} into a client? This creates a clients row and marks the lead Won in one transaction.`)) return;
        if (await run(() => api.post(`/api/crm/leads/${lead.lead_id}/convert`, { employee_id: user.employee_id }), r => r.message)) onChanged();
    };

    const remove = async () => {
        if (!window.confirm(`Delete the ${lead.company_name} lead and its interaction history?`)) return;
        if (await run(() => api.del(`/api/crm/leads/${lead.lead_id}`), 'Lead deleted')) onClose();
    };

    return (
        <Modal title={lead.company_name} subtitle={`Lead #${lead.lead_id} · created ${fmtDate(lead.created_at)}`} onClose={onClose} size="lg"
            footer={<>
                <button className="btn btn-ghost danger" onClick={remove}><Trash2 size={15} /> Delete</button>
                <div className="grow" />
                <button className="btn btn-outline" onClick={() => setEditing(true)}>Edit details</button>
                <button className="btn btn-success" onClick={convert}><UserCheck size={15} /> Convert to client</button>
            </>}>
            <div className="modal-body">
                <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)' }}>
                    <div className="stack">
                        <div className="kv-grid" style={{ gridTemplateColumns: '1fr' }}>
                            <div><div className="kv-label">Contact</div><div className="kv-value row"><User size={14} />{lead.contact_name}</div></div>
                            {lead.email && <div><div className="kv-label">Email</div><a className="kv-value row" href={`mailto:${lead.email}`}><Mail size={14} />{lead.email}</a></div>}
                            {lead.phone && <div><div className="kv-label">Phone</div><div className="kv-value row"><Phone size={14} />{lead.phone}</div></div>}
                            <div><div className="kv-label">Expected value</div><div className="kv-value mono">{fmtMoney(lead.expected_value)}</div></div>
                            <div><div className="kv-label">Owner</div><div className="kv-value row">{lead.first_name ? <><Avatar name={fullName(lead)} size="sm" />{fullName(lead)}</> : 'Unassigned'}</div></div>
                        </div>
                        <div>
                            <div className="kv-label" style={{ marginBottom: 6 }}>Stage</div>
                            <div className="segmented" style={{ flexWrap: 'wrap' }}>
                                {STAGES.map(s => <button key={s} className={lead.status === s ? 'active' : ''} onClick={() => onMove(lead, s)}>{s}</button>)}
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="section-title">Activity</div>
                        <InteractionLog entityType="Lead" entityId={lead.lead_id} />
                    </div>
                </div>
            </div>
            {editing && <LeadFormModal lead={lead} onClose={() => setEditing(false)} onSaved={onChanged} />}
        </Modal>
    );
}

function LeadFormModal({ lead, onClose, onSaved }) {
    const { user } = useAuth();
    const { data: lk } = useLookups();
    const run = useAction();
    const [form, bind] = useForm({
        company_name: lead?.company_name || '', contact_name: lead?.contact_name || '',
        email: lead?.email || '', phone: lead?.phone || '',
        expected_value: lead?.expected_value ?? '', assigned_to: lead?.assigned_to || user.employee_id || ''
    });
    const submit = async () => {
        const ok = await run(() => lead ? api.put(`/api/crm/leads/${lead.lead_id}`, form) : api.post('/api/crm/leads', form), lead ? 'Lead updated' : 'Lead created');
        if (ok) { onSaved(); onClose(); }
    };
    return (
        <FormModal title={lead ? 'Edit lead' : 'New lead'} onClose={onClose} onSubmit={submit}>
            <div className="form-grid">
                <Field label="Company" required><div className="input-icon"><Building2 size={15} /><input className="form-input" value={form.company_name} onChange={bind('company_name')} required /></div></Field>
                <Field label="Contact name" required><input className="form-input" value={form.contact_name} onChange={bind('contact_name')} required /></Field>
                <Field label="Email"><input type="email" className="form-input" value={form.email} onChange={bind('email')} /></Field>
                <Field label="Phone"><input className="form-input" value={form.phone} onChange={bind('phone')} /></Field>
                <Field label="Expected value ($)"><input type="number" min="0" step="500" className="form-input" value={form.expected_value} onChange={bind('expected_value')} /></Field>
                <Field label="Owner">
                    <select className="form-select" value={form.assigned_to} onChange={bind('assigned_to')}>
                        <option value="">Unassigned</option>
                        {lk.employees.filter(e => e.status !== 'Inactive').map(e => <option key={e.employee_id} value={e.employee_id}>{fullName(e)}</option>)}
                    </select>
                </Field>
            </div>
        </FormModal>
    );
}

