import React, { useState } from 'react';
import { Users, Mail, Phone, MapPin, Plus, Pencil, Trash2, Search, MessageSquare, KeyRound } from 'lucide-react';
import InteractionLog from './InteractionLog';
import { Modal, FormModal, Field, EmptyState, Loading, ErrorNote, SearchInput, Avatar, useFetch, useForm, useAction, api, fmtMoney } from './ui';

export default function ClientDirectory() {
    const clients = useFetch('/api/crm/clients', []);
    const run = useAction();
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState(null);
    const [activityFor, setActivityFor] = useState(null);

    const remove = async (c) => {
        const msg = c.project_count
            ? `Delete ${c.company}? Its ${c.project_count} project(s), their tasks and invoices will be deleted too (ON DELETE CASCADE).`
            : `Delete ${c.company}?`;
        if (!window.confirm(msg)) return;
        if (await run(() => api.del(`/api/crm/clients/${c.client_id}`), 'Client deleted')) clients.reload();
    };

    const q = search.toLowerCase();
    const visible = clients.data.filter(c => !q || `${c.company} ${c.name} ${c.email || ''}`.toLowerCase().includes(q));

    return (
        <div className="stack">
            <div className="row-between wrap">
                <SearchInput value={search} onChange={setSearch} placeholder="Search clients…" icon={Search} width={280} />
                <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><Plus size={15} /> Add client</button>
            </div>

            <ErrorNote message={clients.error} onRetry={clients.reload} />
            {clients.loading ? <Loading /> : visible.length === 0 ? (
                <div className="card"><EmptyState icon={Users} title="No clients found" hint="Add a client directly, or convert a won lead from the pipeline." /></div>
            ) : (
                <div className="grid-cards">
                    {visible.map(c => (
                        <div key={c.client_id} className="card interactive stack-sm">
                            <div className="row-between" style={{ alignItems: 'flex-start' }}>
                                <div className="row">
                                    <Avatar name={c.company} />
                                    <div>
                                        <div className="strong">{c.company}</div>
                                        <div className="text-sm muted">{c.name}</div>
                                    </div>
                                </div>
                                <div className="row" style={{ gap: 0 }}>
                                    <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => setEditing(c)}><Pencil size={14} /></button>
                                    <button className="btn btn-ghost btn-icon btn-sm danger" title="Delete" onClick={() => remove(c)}><Trash2 size={14} /></button>
                                </div>
                            </div>

                            <div className="stack-sm text-sm" style={{ gap: '0.3rem' }}>
                                {c.email && <a className="row" style={{ gap: 6 }} href={`mailto:${c.email}`}><Mail size={13} />{c.email}</a>}
                                {c.phone && <div className="row muted" style={{ gap: 6 }}><Phone size={13} />{c.phone}</div>}
                                {c.address && <div className="row muted" style={{ gap: 6 }}><MapPin size={13} /><span className="truncate">{c.address}</span></div>}
                                <div className="row muted" style={{ gap: 6 }}><KeyRound size={13} />{c.username ? <>Portal login: <span className="mono">{c.username}</span></> : 'No portal login'}</div>
                            </div>

                            <div className="row wrap text-sm" style={{ gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem', marginTop: 'auto' }}>
                                <span><strong>{c.project_count}</strong> <span className="muted">projects</span></span>
                                <span><strong>{fmtMoney(c.total_billed)}</strong> <span className="muted">billed</span></span>
                                {c.outstanding > 0 && <span className="text-warning"><strong>{fmtMoney(c.outstanding)}</strong> due</span>}
                            </div>
                            <button className="btn btn-outline btn-sm" onClick={() => setActivityFor(c)}><MessageSquare size={14} /> Activity log</button>
                        </div>
                    ))}
                </div>
            )}

            {editing && <ClientFormModal client={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={clients.reload} />}
            {activityFor && (
                <Modal title={activityFor.company} subtitle="Calls, emails and meetings with this client" onClose={() => setActivityFor(null)}>
                    <div className="modal-body"><InteractionLog entityType="Client" entityId={activityFor.client_id} /></div>
                </Modal>
            )}
        </div>
    );
}

function ClientFormModal({ client, onClose, onSaved }) {
    const run = useAction();
    const [form, bind] = useForm({
        name: client?.name || '', company: client?.company || '', email: client?.email || '',
        phone: client?.phone || '', address: client?.address || ''
    });
    const submit = async () => {
        const ok = await run(() => client ? api.put(`/api/crm/clients/${client.client_id}`, form) : api.post('/api/crm/clients', form), client ? 'Client updated' : 'Client added');
        if (ok) { onSaved(); onClose(); }
    };
    return (
        <FormModal title={client ? `Edit ${client.company}` : 'Add client'} onClose={onClose} onSubmit={submit}>
            <div className="form-grid">
                <Field label="Company" required><input className="form-input" value={form.company} onChange={bind('company')} required /></Field>
                <Field label="Contact name" required><input className="form-input" value={form.name} onChange={bind('name')} required /></Field>
                <Field label="Email"><input type="email" className="form-input" value={form.email} onChange={bind('email')} /></Field>
                <Field label="Phone"><input className="form-input" value={form.phone} onChange={bind('phone')} /></Field>
                <Field label="Address" span><input className="form-input" value={form.address} onChange={bind('address')} /></Field>
            </div>
        </FormModal>
    );
}
