import React from 'react';
import { Phone, Mail, CalendarClock, StickyNote, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Loading, useFetch, useForm, useAction, api, fmtDateTime } from './ui';

const INTERACTION_ICONS = { Call: Phone, Email: Mail, Meeting: CalendarClock, Note: StickyNote };

// Activity log for any row in the polymorphic interactions table (entity_type + entity_id)
export default function InteractionLog({ entityType, entityId }) {
    const { user } = useAuth();
    const log = useFetch(`/api/crm/interactions?entity_type=${entityType}&entity_id=${entityId}`, []);
    const run = useAction();
    const [form, bind, reset] = useForm({ interaction_type: 'Call', notes: '' });

    const submit = async (e) => {
        e.preventDefault();
        const ok = await run(() => api.post('/api/crm/interactions', { ...form, entity_type: entityType, entity_id: entityId, employee_id: user.employee_id }), 'Interaction logged');
        if (ok) { reset(); log.reload(); }
    };

    const remove = async (i) => {
        if (await run(() => api.del(`/api/crm/interactions/${i.interaction_id}`))) log.reload();
    };

    return (
        <div className="stack">
            <form onSubmit={submit} className="stack-sm">
                <div className="segmented" style={{ alignSelf: 'flex-start' }}>
                    {Object.keys(INTERACTION_ICONS).map(t => (
                        <button type="button" key={t} className={form.interaction_type === t ? 'active' : ''} onClick={() => bind('interaction_type')(t)}>{t}</button>
                    ))}
                </div>
                <textarea className="form-textarea" rows={2} required placeholder={`What happened on this ${form.interaction_type.toLowerCase()}?`} value={form.notes} onChange={bind('notes')} />
                <div className="form-actions"><button type="submit" className="btn btn-primary btn-sm">Log {form.interaction_type.toLowerCase()}</button></div>
            </form>

            <div>
                <div className="section-title">History ({log.data.length})</div>
                {log.loading ? <Loading /> : log.data.length === 0 ? (
                    <div className="text-sm muted">No interactions logged yet.</div>
                ) : (
                    <div className="timeline">
                        {log.data.map(i => {
                            const Icon = INTERACTION_ICONS[i.interaction_type] || StickyNote;
                            return (
                                <div key={i.interaction_id} className="timeline-item">
                                    <div className="row-between">
                                        <span className="row strong text-sm"><Icon size={14} />{i.interaction_type}</span>
                                        <span className="row text-xs muted">
                                            {i.first_name ? `${i.first_name} ${i.last_name} · ` : ''}{fmtDateTime(i.date)}
                                            <button className="btn btn-ghost btn-icon btn-sm danger" onClick={() => remove(i)} aria-label="Delete interaction"><Trash2 size={12} /></button>
                                        </span>
                                    </div>
                                    {i.notes && <p className="text-sm" style={{ marginTop: 4 }}>{i.notes}</p>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
