import React, { useEffect, useState } from 'react';
import { FolderGit2, Plus, Pencil, Trash2, CheckCircle2, Circle, Inbox, CalendarDays, Users, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    Panel, StatusBadge, EmptyState, Loading, Progress, FormModal, Field,
    useFetch, useForm, useAction, useLookups, api, fmtDate, fullName, isPastDue
} from './ui';

const PROJECT_STATUSES = ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];
const TASK_STATUSES = ['Pending', 'In Progress', 'Completed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function ProjectTracker() {
    const { user } = useAuth();
    const projects = useFetch(`/api/projects/my-projects?manager_id=${user.employee_id}`, []);
    const requests = useFetch('/api/projects/requests', []);
    const [selectedId, setSelectedId] = useState(null);
    const [editing, setEditing] = useState(null);
    const [accepting, setAccepting] = useState(null);
    const [filter, setFilter] = useState('Open');

    const visible = projects.data.filter(p => filter === 'All' || (filter === 'Open' ? !['Completed', 'Cancelled'].includes(p.status) : ['Completed', 'Cancelled'].includes(p.status)));
    const selected = projects.data.find(p => p.project_id === selectedId) || null;

    useEffect(() => {
        if (!selectedId && visible.length) setSelectedId(visible[0].project_id);
    }, [visible.length]);

    const reloadAll = () => { projects.reload(); requests.reload(); };

    return (
        <div className="grid-sidebar">
            <div className="stack">
                {requests.data.length > 0 && (
                    <Panel title="Client requests" subtitle="Submitted from the client portal" icon={Inbox} flush>
                        <div className="list">
                            {requests.data.map(r => (
                                <div key={r.project_id} className="list-item" style={{ alignItems: 'flex-start' }}>
                                    <div className="grow">
                                        <div className="strong text-sm">{r.name}</div>
                                        <div className="text-xs muted">{r.client_company || 'Internal'} · {fmtDate(r.start_date)}</div>
                                    </div>
                                    <button className="btn btn-primary btn-sm" onClick={() => setAccepting(r)}>Accept</button>
                                </div>
                            ))}
                        </div>
                    </Panel>
                )}

                <Panel
                    title="My projects"
                    icon={FolderGit2}
                    flush
                    actions={<button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><Plus size={15} /> New</button>}
                >
                    <div style={{ padding: '0.6rem 0.8rem', borderBottom: '1px solid var(--border-color)' }}>
                        <div className="segmented">
                            {['Open', 'Closed', 'All'].map(f => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>)}
                        </div>
                    </div>
                    {projects.loading ? <Loading /> : visible.length === 0 ? (
                        <EmptyState icon={FolderGit2} title="No projects" hint="Create one, or accept a client request." />
                    ) : (
                        <div className="list">
                            {visible.map(p => (
                                <button key={p.project_id} className={`list-item clickable ${selectedId === p.project_id ? 'active' : ''}`} onClick={() => setSelectedId(p.project_id)} style={{ display: 'block' }}>
                                    <div className="row-between" style={{ marginBottom: '0.3rem' }}>
                                        <span className="strong text-sm truncate">{p.name}</span>
                                        <StatusBadge status={p.status} />
                                    </div>
                                    <div className="text-xs muted" style={{ marginBottom: '0.45rem' }}>{p.client_company || 'Internal project'}{p.team_name ? ` · ${p.team_name}` : ''}</div>
                                    <Progress value={p.task_done} total={p.task_total} />
                                </button>
                            ))}
                        </div>
                    )}
                </Panel>
            </div>

            {selected ? (
                <ProjectDetail key={selected.project_id} project={selected} onEdit={() => setEditing(selected)} onChanged={reloadAll} onDeleted={() => { setSelectedId(null); reloadAll(); }} />
            ) : (
                <div className="card"><EmptyState icon={FolderGit2} title="Select a project" hint="Pick a project on the left to see and manage its tasks." /></div>
            )}

            {editing && <ProjectModal project={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={(id) => { reloadAll(); if (id) setSelectedId(id); }} />}
            {accepting && <AcceptRequestModal request={accepting} onClose={() => setAccepting(null)} onSaved={() => { reloadAll(); setSelectedId(accepting.project_id); }} />}
        </div>
    );
}

function ProjectDetail({ project, onEdit, onChanged, onDeleted }) {
    const tasks = useFetch(`/api/projects/${project.project_id}/tasks`, []);
    const members = useFetch(`/api/projects/${project.project_id}/team-members`, []);
    const run = useAction();
    const [editingTask, setEditingTask] = useState(null);
    const [newTask, bindNew, resetNew] = useForm({ title: '', assigned_to: '', priority: 'Medium', due_date: '' });

    const changeStatus = async (status) => {
        if (await run(() => api.put(`/api/projects/${project.project_id}`, { status }), `Project marked ${status}`)) onChanged();
    };

    const deleteProject = async () => {
        if (!window.confirm(`Delete "${project.name}"? All of its tasks and invoices are deleted too (ON DELETE CASCADE).`)) return;
        if (await run(() => api.del(`/api/projects/${project.project_id}`), 'Project deleted')) onDeleted();
    };

    const addTask = async (e) => {
        e.preventDefault();
        if (!newTask.title.trim()) return;
        if (await run(() => api.post(`/api/projects/${project.project_id}/tasks`, newTask), 'Task added')) {
            resetNew();
            tasks.reload();
            onChanged();
        }
    };

    const setTaskStatus = async (task, status) => {
        tasks.setData(ts => ts.map(t => t.task_id === task.task_id ? { ...t, status } : t));
        if (await run(() => api.patch(`/api/projects/tasks/${task.task_id}/status`, { status }))) onChanged();
        else tasks.reload();
    };

    const deleteTask = async (task) => {
        if (!window.confirm(`Delete task "${task.title}"?`)) return;
        if (await run(() => api.del(`/api/projects/tasks/${task.task_id}`), 'Task deleted')) { tasks.reload(); onChanged(); }
    };

    const byStatus = (s) => tasks.data.filter(t => t.status === s).length;

    return (
        <div className="stack">
            <div className="card stack-sm">
                <div className="row-between wrap">
                    <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{project.name}</h2>
                        {project.description && <p className="muted text-sm" style={{ marginTop: 2 }}>{project.description}</p>}
                    </div>
                    <div className="toolbar">
                        <select className="form-select sm" style={{ width: 150 }} value={project.status} onChange={e => changeStatus(e.target.value)} aria-label="Project status">
                            {[...new Set([project.status, ...PROJECT_STATUSES])].map(s => <option key={s}>{s}</option>)}
                        </select>
                        <button className="btn btn-outline btn-sm" onClick={onEdit}><Pencil size={14} /> Edit</button>
                        <button className="btn btn-ghost btn-icon btn-sm danger" onClick={deleteProject} title="Delete project"><Trash2 size={15} /></button>
                    </div>
                </div>
                <div className="row wrap text-sm muted" style={{ gap: '1.25rem', marginTop: '0.35rem' }}>
                    <span className="row" style={{ gap: 5 }}><Building2 size={14} />{project.client_company || 'Internal'}</span>
                    <span className="row" style={{ gap: 5 }}><Users size={14} />{project.team_name || 'No team'}</span>
                    <span className={`row ${isPastDue(project.end_date, project.status) ? 'text-danger' : ''}`} style={{ gap: 5 }}><CalendarDays size={14} />{fmtDate(project.start_date)} → {fmtDate(project.end_date)}</span>
                </div>
                <div style={{ marginTop: '0.4rem' }}><Progress value={project.task_done} total={project.task_total} /></div>
            </div>

            <Panel
                title="Tasks"
                subtitle={`${byStatus('Pending')} pending · ${byStatus('In Progress')} in progress · ${byStatus('Completed')} done`}
                flush
                footer={
                    <form onSubmit={addTask} className="row wrap">
                        <input className="form-input sm grow" style={{ minWidth: 180 }} placeholder="Add a task…" value={newTask.title} onChange={bindNew('title')} />
                        <select className="form-select sm" style={{ width: 160 }} value={newTask.assigned_to} onChange={bindNew('assigned_to')} aria-label="Assignee">
                            <option value="">Unassigned</option>
                            {members.data.map(m => <option key={m.employee_id} value={m.employee_id}>{fullName(m)}</option>)}
                        </select>
                        <select className="form-select sm" style={{ width: 110 }} value={newTask.priority} onChange={bindNew('priority')} aria-label="Priority">
                            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                        </select>
                        <input type="date" className="form-input sm" style={{ width: 150 }} value={newTask.due_date} onChange={bindNew('due_date')} aria-label="Due date" />
                        <button type="submit" className="btn btn-primary btn-sm" disabled={!newTask.title.trim()}><Plus size={14} /> Add</button>
                    </form>
                }
            >
                {tasks.loading ? <Loading /> : tasks.data.length === 0 ? (
                    <EmptyState title="No tasks yet" hint="Break the project down using the form below." />
                ) : (
                    <div className="table-container">
                        <table className="data-table compact">
                            <thead>
                                <tr><th style={{ width: 36 }} /><th>Task</th><th>Assignee</th><th>Priority</th><th>Due</th><th>Status</th><th /></tr>
                            </thead>
                            <tbody>
                                {tasks.data.map(t => {
                                    const done = t.status === 'Completed';
                                    return (
                                        <tr key={t.task_id}>
                                            <td>
                                                <button className={`check-btn ${done ? 'done' : ''}`} onClick={() => setTaskStatus(t, done ? 'Pending' : 'Completed')} aria-label={done ? 'Mark as pending' : 'Mark as completed'}>
                                                    {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                                </button>
                                            </td>
                                            <td>
                                                <div className={`strong text-sm ${done ? 'strike' : ''}`}>{t.title}</div>
                                                {t.description && <div className="cell-sub truncate" style={{ maxWidth: 280 }}>{t.description}</div>}
                                            </td>
                                            <td className="text-sm">{t.first_name ? fullName(t) : <span className="null">Unassigned</span>}</td>
                                            <td><StatusBadge status={t.priority} plain /></td>
                                            <td className={`text-sm nowrap ${isPastDue(t.due_date, t.status) ? 'text-danger strong' : 'muted'}`}>{fmtDate(t.due_date)}</td>
                                            <td>
                                                <select className="form-select sm" style={{ width: 130 }} value={t.status} onChange={e => setTaskStatus(t, e.target.value)} aria-label="Task status">
                                                    {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
                                                </select>
                                            </td>
                                            <td>
                                                <div className="row-actions">
                                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditingTask(t)} title="Edit task"><Pencil size={14} /></button>
                                                    <button className="btn btn-ghost btn-icon btn-sm danger" onClick={() => deleteTask(t)} title="Delete task"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>

            {editingTask && <TaskModal task={editingTask} members={members.data} onClose={() => setEditingTask(null)} onSaved={() => { tasks.reload(); onChanged(); }} />}
        </div>
    );
}

function TaskModal({ task, members, onClose, onSaved }) {
    const run = useAction();
    const [form, bind] = useForm({
        title: task.title, description: task.description || '', assigned_to: task.assigned_to || '',
        priority: task.priority || 'Medium', status: task.status, due_date: task.due_date || ''
    });
    const submit = async () => {
        if (await run(() => api.put(`/api/projects/tasks/${task.task_id}`, form), 'Task updated')) { onSaved(); onClose(); }
    };
    return (
        <FormModal title="Edit task" onClose={onClose} onSubmit={submit}>
            <div className="form-grid">
                <Field label="Title" required span><input className="form-input" value={form.title} onChange={bind('title')} required /></Field>
                <Field label="Description" span><textarea className="form-textarea" value={form.description} onChange={bind('description')} /></Field>
                <Field label="Assignee">
                    <select className="form-select" value={form.assigned_to} onChange={bind('assigned_to')}>
                        <option value="">Unassigned</option>
                        {members.map(m => <option key={m.employee_id} value={m.employee_id}>{fullName(m)}</option>)}
                    </select>
                </Field>
                <Field label="Due date"><input type="date" className="form-input" value={form.due_date} onChange={bind('due_date')} /></Field>
                <Field label="Priority">
                    <select className="form-select" value={form.priority} onChange={bind('priority')}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select>
                </Field>
                <Field label="Status">
                    <select className="form-select" value={form.status} onChange={bind('status')}>{TASK_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
                </Field>
            </div>
        </FormModal>
    );
}

function ProjectModal({ project, onClose, onSaved }) {
    const { user } = useAuth();
    const { data: lk } = useLookups();
    const run = useAction();
    const [form, bind] = useForm({
        name: project?.name || '', description: project?.description || '',
        start_date: project?.start_date || '', end_date: project?.end_date || '',
        client_id: project?.client_id || '', team_id: project?.team_id || '',
        status: project?.status || 'Planning'
    });

    const submit = async () => {
        const result = await run(
            () => project ? api.put(`/api/projects/${project.project_id}`, form) : api.post('/api/projects', { ...form, manager_id: user.employee_id }),
            project ? 'Project updated' : 'Project created'
        );
        if (result) { onSaved(result.project_id); onClose(); }
    };

    return (
        <FormModal title={project ? `Edit ${project.name}` : 'New project'} onClose={onClose} onSubmit={submit} submitLabel={project ? 'Save changes' : 'Create project'}>
            <div className="form-grid">
                <Field label="Project name" required span><input className="form-input" value={form.name} onChange={bind('name')} required /></Field>
                <Field label="Description" span><textarea className="form-textarea" value={form.description} onChange={bind('description')} /></Field>
                <Field label="Client">
                    <select className="form-select" value={form.client_id} onChange={bind('client_id')}>
                        <option value="">Internal (no client)</option>
                        {lk.clients.map(c => <option key={c.client_id} value={c.client_id}>{c.company}</option>)}
                    </select>
                </Field>
                <Field label="Team">
                    <select className="form-select" value={form.team_id} onChange={bind('team_id')}>
                        <option value="">No team</option>
                        {lk.teams.map(t => <option key={t.team_id} value={t.team_id}>{t.name}</option>)}
                    </select>
                </Field>
                <Field label="Start date"><input type="date" className="form-input" value={form.start_date} onChange={bind('start_date')} /></Field>
                <Field label="End date"><input type="date" className="form-input" min={form.start_date || undefined} value={form.end_date} onChange={bind('end_date')} /></Field>
                <Field label="Status" span>
                    <select className="form-select" value={form.status} onChange={bind('status')}>
                        {[...new Set([form.status, ...PROJECT_STATUSES])].map(s => <option key={s}>{s}</option>)}
                    </select>
                </Field>
            </div>
        </FormModal>
    );
}

function AcceptRequestModal({ request, onClose, onSaved }) {
    const { user } = useAuth();
    const { data: lk } = useLookups();
    const run = useAction();
    const [teamId, setTeamId] = useState('');

    const submit = async () => {
        const ok = await run(
            () => api.post('/api/dashboard/manager/assign-team', { project_id: request.project_id, team_id: teamId, manager_id: user.employee_id }),
            `You now manage "${request.name}"`
        );
        if (ok) { onSaved(); onClose(); }
    };

    return (
        <FormModal title="Accept client request" subtitle="You become the project manager; the client is notified." onClose={onClose} onSubmit={submit} submitLabel="Accept & start" size="sm">
            <div className="stack">
                <div className="card" style={{ background: 'var(--bg-inset)', boxShadow: 'none' }}>
                    <div className="strong">{request.name}</div>
                    <div className="text-sm muted">{request.client_company} · {fmtDate(request.start_date)} → {fmtDate(request.end_date)}</div>
                    {request.description && <p className="text-sm" style={{ marginTop: '0.4rem' }}>{request.description}</p>}
                </div>
                <Field label="Assign team" required>
                    <select className="form-select" value={teamId} onChange={e => setTeamId(e.target.value)} required>
                        <option value="">Select team…</option>
                        {lk.teams.map(t => <option key={t.team_id} value={t.team_id}>{t.name}</option>)}
                    </select>
                </Field>
            </div>
        </FormModal>
    );
}
