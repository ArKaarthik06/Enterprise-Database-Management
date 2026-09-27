import React, { useState } from 'react';
import { Receipt, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Panel, FormModal, Field, EmptyState, Loading, ErrorNote, StatusBadge, useForm, useAction, useLookups, api, fmtMoney, fmtDate, code, todayISO } from './ui';

const FILTERS = ['All', 'Pending', 'Overdue', 'Paid', 'Cancelled'];

// `invoices` is a useFetch() result owned by CRMDashboard so header stats stay in sync.
export default function InvoicesView({ invoices }) {
    const run = useAction();
    const [creating, setCreating] = useState(false);
    const [filter, setFilter] = useState('All');

    const effectiveStatus = (i) => (i.is_overdue && i.status === 'Pending' ? 'Overdue' : i.status);

    const setStatus = async (inv, status) => {
        if (await run(() => api.patch(`/api/crm/invoices/${inv.invoice_id}/status`, { status }), `${code('INV', inv.invoice_id)} marked ${status}`)) invoices.reload();
    };

    const remove = async (inv) => {
        if (!window.confirm(`Delete ${code('INV', inv.invoice_id)}?`)) return;
        if (await run(() => api.del(`/api/crm/invoices/${inv.invoice_id}`), 'Invoice deleted')) invoices.reload();
    };

    const visible = invoices.data.filter(i => filter === 'All' || effectiveStatus(i) === filter);
    const count = (s) => invoices.data.filter(i => effectiveStatus(i) === s).length;

    return (
        <Panel
            title="Invoices"
            icon={Receipt}
            flush
            actions={<>
                <div className="segmented">
                    {FILTERS.map(f => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}{f !== 'All' ? ` (${count(f)})` : ''}</button>)}
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}><Plus size={15} /> New invoice</button>
            </>}
        >
            <ErrorNote message={invoices.error} onRetry={invoices.reload} />
            {invoices.loading ? <Loading /> : visible.length === 0 ? (
                <EmptyState icon={Receipt} title="No invoices" hint="Bill a client for one of their projects." />
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead><tr><th>Invoice</th><th>Client / project</th><th className="num">Amount</th><th>Issued</th><th>Due</th><th>Status</th><th /></tr></thead>
                        <tbody>
                            {visible.map(inv => {
                                const status = effectiveStatus(inv);
                                const open = !['Paid', 'Cancelled'].includes(inv.status);
                                return (
                                    <tr key={inv.invoice_id}>
                                        <td className="mono strong">{code('INV', inv.invoice_id)}</td>
                                        <td><div className="cell-main">{inv.client_company}</div><div className="cell-sub">{inv.project_name || '—'}</div></td>
                                        <td className="num strong">{fmtMoney(inv.amount, 2)}</td>
                                        <td className="text-sm muted nowrap">{fmtDate(inv.issue_date)}</td>
                                        <td className={`text-sm nowrap ${status === 'Overdue' ? 'text-danger strong' : 'muted'}`}>{fmtDate(inv.due_date)}</td>
                                        <td><StatusBadge status={status} /></td>
                                        <td>
                                            <div className="row-actions" style={{ gap: '0.35rem' }}>
                                                {open && <button className="btn btn-success btn-sm" onClick={() => setStatus(inv, 'Paid')}><CheckCircle2 size={14} /> Mark paid</button>}
                                                <select className="form-select sm" style={{ width: 44, paddingRight: 0, backgroundImage: 'none', textAlign: 'center' }} value="" onChange={e => e.target.value && setStatus(inv, e.target.value)} aria-label="Change status" title="Change status">
                                                    <option value="">⋯</option>
                                                    {['Pending', 'Overdue', 'Paid', 'Cancelled'].filter(s => s !== inv.status).map(s => <option key={s} value={s}>Mark {s}</option>)}
                                                </select>
                                                <button className="btn btn-ghost btn-icon btn-sm danger" onClick={() => remove(inv)} title="Delete invoice"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {creating && <InvoiceModal onClose={() => setCreating(false)} onSaved={invoices.reload} />}
        </Panel>
    );
}

function InvoiceModal({ onClose, onSaved }) {
    const { data: lk } = useLookups();
    const run = useAction();
    const due = new Date();
    due.setDate(due.getDate() + 30);
    const [form, bind, , setForm] = useForm({ client_id: '', project_id: '', amount: '', issue_date: todayISO(), due_date: due.toLocaleDateString('en-CA') });

    const clientProjects = lk.projects.filter(p => String(p.client_id) === String(form.client_id));

    const submit = async () => {
        if (await run(() => api.post('/api/crm/invoices', form), 'Invoice issued — client notified')) { onSaved(); onClose(); }
    };

    return (
        <FormModal title="New invoice" subtitle="Only projects belonging to the chosen client can be billed" onClose={onClose} onSubmit={submit} submitLabel="Issue invoice">
            <div className="form-grid">
                <Field label="Client" required>
                    <select className="form-select" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value, project_id: '' }))} required>
                        <option value="">Select client…</option>
                        {lk.clients.map(c => <option key={c.client_id} value={c.client_id}>{c.company}</option>)}
                    </select>
                </Field>
                <Field label="Project" required hint={form.client_id && clientProjects.length === 0 ? 'This client has no projects yet.' : undefined}>
                    <select className="form-select" value={form.project_id} onChange={bind('project_id')} required disabled={!form.client_id}>
                        <option value="">{form.client_id ? 'Select project…' : 'Pick a client first'}</option>
                        {clientProjects.map(p => <option key={p.project_id} value={p.project_id}>{p.name}</option>)}
                    </select>
                </Field>
                <Field label="Amount ($)" required span><input type="number" min="0.01" step="0.01" className="form-input" value={form.amount} onChange={bind('amount')} required /></Field>
                <Field label="Issue date" required><input type="date" className="form-input" value={form.issue_date} onChange={bind('issue_date')} required /></Field>
                <Field label="Due date" required><input type="date" className="form-input" min={form.issue_date} value={form.due_date} onChange={bind('due_date')} required /></Field>
            </div>
        </FormModal>
    );
}
