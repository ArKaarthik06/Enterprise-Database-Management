import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FolderGit2, Receipt, LogOut, Database, Plus, Users, CalendarDays, UserRound, Wallet, AlertTriangle } from 'lucide-react';
import { NotificationsDropdown } from './Navbar';
import {
    PageHeader, Tabs, Panel, StatCard, StatusBadge, EmptyState, Loading, ErrorNote, Progress, FormModal, Field, Avatar,
    useFetch, useForm, useAction, api, fmtMoney, fmtDate, code, todayISO
} from './ui';

export default function ClientApp() {
    const { user, logout } = useAuth();
    const clientId = user?.client_id;
    const [activeTab, setActiveTab] = useState('projects');
    const [requesting, setRequesting] = useState(false);

    const projects = useFetch(clientId ? `/api/dashboard/client/projects?client_id=${clientId}` : null, []);
    const invoices = useFetch(clientId ? `/api/crm/invoices?client_id=${clientId}` : null, []);

    const outstanding = invoices.data.filter(i => !['Paid', 'Cancelled'].includes(i.status));
    const overdue = outstanding.filter(i => i.is_overdue || i.status === 'Overdue');

    return (
        <div className="app-container">
            <header className="navbar">
                <div className="navbar-inner">
                    <div className="brand-logo">
                        <div className="brand-icon"><Database size={18} /></div>
                        <div>
                            <div className="brand-title">Client portal</div>
                            <div className="brand-subtitle">{user?.company || 'Enterprise DBMS'}</div>
                        </div>
                    </div>
                    <div className="grow" />
                    <div className="nav-actions">
                        <NotificationsDropdown />
                        <div className="user-chip">
                            <Avatar name={user?.name} size="sm" />
                            <div className="user-chip-text">
                                <div className="user-chip-name">{user?.name}</div>
                                <div className="user-chip-role">Client</div>
                            </div>
                            <button onClick={logout} className="btn btn-ghost btn-icon btn-sm danger" title="Sign out" aria-label="Sign out"><LogOut size={15} /></button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="main-content" style={{ maxWidth: 1100 }}>
                <div className="page">
                    <PageHeader
                        eyebrow={user?.company}
                        title={`Welcome back, ${user?.name?.split(' ')[0] || ''}`}
                        subtitle="Track delivery on your projects, review invoices and request new work."
                        actions={<button className="btn btn-primary" onClick={() => setRequesting(true)}><Plus size={16} /> Request a project</button>}
                    />

                    {!clientId ? (
                        <ErrorNote message="This login isn't linked to a client record. Contact your account manager." />
                    ) : (
                        <>
                            <div className="stats-grid">
                                <StatCard label="Active projects" value={projects.data.filter(p => p.status === 'In Progress').length} meta={`${projects.data.length} total`} icon={FolderGit2} />
                                <StatCard label="Awaiting kickoff" value={projects.data.filter(p => p.status === 'Pending Assignment').length} meta="Requests under review" icon={CalendarDays} tone="info" />
                                <StatCard label="Balance due" value={fmtMoney(outstanding.reduce((s, i) => s + i.amount, 0), 2)} meta={`${outstanding.length} open invoice(s)`} icon={Wallet} tone="warning" />
                                <StatCard label="Overdue" value={overdue.length} meta={overdue.length ? 'Please arrange payment' : 'Nothing overdue'} icon={AlertTriangle} tone={overdue.length ? 'danger' : 'success'} />
                            </div>

                            <Tabs
                                tabs={[
                                    { id: 'projects', label: 'Projects', icon: FolderGit2, count: projects.data.length },
                                    { id: 'invoices', label: 'Invoices', icon: Receipt, count: outstanding.length, attention: true }
                                ]}
                                active={activeTab}
                                onChange={setActiveTab}
                            />

                            {activeTab === 'projects' && (
                                projects.loading ? <Loading /> : projects.data.length === 0 ? (
                                    <div className="card"><EmptyState icon={FolderGit2} title="No projects yet" hint="Submit a request and our team will pick it up." action={<button className="btn btn-primary btn-sm" onClick={() => setRequesting(true)}>Request a project</button>} /></div>
                                ) : (
                                    <div className="grid-cards">
                                        {projects.data.map(p => (
                                            <div key={p.project_id} className="card stack-sm">
                                                <div className="row-between" style={{ alignItems: 'flex-start' }}>
                                                    <div className="strong">{p.name}</div>
                                                    <StatusBadge status={p.status} />
                                                </div>
                                                {p.description && <p className="text-sm muted">{p.description}</p>}
                                                <div className="stack-sm text-sm muted" style={{ gap: '0.25rem', marginTop: 'auto' }}>
                                                    <span className="row" style={{ gap: 6 }}><CalendarDays size={13} />{fmtDate(p.start_date)} → {fmtDate(p.end_date)}</span>
                                                    <span className="row" style={{ gap: 6 }}><UserRound size={13} />{p.manager_first ? `${p.manager_first} ${p.manager_last}` : 'Manager not yet assigned'}</span>
                                                    <span className="row" style={{ gap: 6 }}><Users size={13} />{p.team_name || 'Team not yet assigned'}</span>
                                                </div>
                                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem' }}>
                                                    <div className="text-xs muted" style={{ marginBottom: 4 }}>Task completion</div>
                                                    <Progress value={p.task_done} total={p.task_total} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}

                            {activeTab === 'invoices' && (
                                <Panel title="Invoices" icon={Receipt} flush>
                                    {invoices.loading ? <Loading /> : invoices.data.length === 0 ? (
                                        <EmptyState icon={Receipt} title="No invoices yet" />
                                    ) : (
                                        <div className="table-container">
                                            <table className="data-table">
                                                <thead><tr><th>Invoice</th><th>Project</th><th className="num">Amount</th><th>Issued</th><th>Due</th><th>Status</th></tr></thead>
                                                <tbody>
                                                    {invoices.data.map(i => {
                                                        const status = i.is_overdue && i.status === 'Pending' ? 'Overdue' : i.status;
                                                        return (
                                                            <tr key={i.invoice_id}>
                                                                <td className="mono strong">{code('INV', i.invoice_id)}</td>
                                                                <td>{i.project_name}</td>
                                                                <td className="num strong">{fmtMoney(i.amount, 2)}</td>
                                                                <td className="text-sm muted">{fmtDate(i.issue_date)}</td>
                                                                <td className={`text-sm ${status === 'Overdue' ? 'text-danger strong' : 'muted'}`}>{fmtDate(i.due_date)}</td>
                                                                <td><StatusBadge status={status} /></td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </Panel>
                            )}
                        </>
                    )}
                </div>
            </main>

            {requesting && <RequestProjectModal clientId={clientId} onClose={() => setRequesting(false)} onSaved={projects.reload} />}
        </div>
    );
}

function RequestProjectModal({ clientId, onClose, onSaved }) {
    const run = useAction();
    const [form, bind] = useForm({ name: '', description: '', start_date: todayISO(), end_date: '' });
    const submit = async () => {
        if (await run(() => api.post('/api/dashboard/client/request-project', { ...form, client_id: clientId }), 'Request submitted — a project manager will review it shortly')) { onSaved(); onClose(); }
    };
    return (
        <FormModal title="Request a new project" subtitle="Your request appears in every project manager's queue." onClose={onClose} onSubmit={submit} submitLabel="Submit request">
            <div className="form-grid">
                <Field label="Project name" required span><input className="form-input" value={form.name} onChange={bind('name')} required placeholder="e.g. Mobile ordering app" /></Field>
                <Field label="What do you need?" required span><textarea className="form-textarea" rows={4} value={form.description} onChange={bind('description')} required placeholder="Goals, scope, any constraints…" /></Field>
                <Field label="Desired start" required><input type="date" className="form-input" value={form.start_date} onChange={bind('start_date')} required /></Field>
                <Field label="Desired end" required><input type="date" className="form-input" min={form.start_date} value={form.end_date} onChange={bind('end_date')} required /></Field>
            </div>
        </FormModal>
    );
}
