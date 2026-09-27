import React, { useState } from 'react';
import {
    Users, UserPlus, FolderGit2, Calendar, Clock, Laptop, Network, Trash2, Pencil, Plus,
    ChevronDown, ChevronRight, Phone, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProjectTracker from './ProjectTracker';
import LeaveRequests from './LeaveRequests';
import PerformanceReviews from './PerformanceReviews';
import TeamAttendance from './TeamAttendance';
import EmployeeFormModal from './EmployeeForm';
import {
    PageHeader, Tabs, Panel, StatusBadge, EmptyState, Loading, ErrorNote, Avatar, StatCard,
    FormModal, Field, Modal, useFetch, useForm, useAction, useLookups, api, fmtMoney, fmtDate, fullName, code
} from './ui';

export default function ManagerDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('team');
    const team = useFetch(user?.employee_id ? `/api/employees/my-team?manager_id=${user.employee_id}` : null, []);
    const leaves = useFetch(user?.employee_id ? `/api/hr/leaves?manager_id=${user.employee_id}` : null, []);

    if (!user?.employee_id) {
        return <EmptyState icon={Users} title="No employee profile linked" hint="This account isn't linked to an employee record, so it has no direct reports." />;
    }

    const pendingLeaves = leaves.data.filter(l => l.status === 'Pending').length;
    const tabs = [
        { id: 'team', label: 'Direct reports', icon: Users, count: team.data.length },
        { id: 'projects', label: 'Projects & tasks', icon: FolderGit2 },
        { id: 'leaves', label: 'Leave approvals', icon: Calendar, count: pendingLeaves, attention: true },
        { id: 'attendance', label: 'Attendance', icon: Clock },
        { id: 'assets', label: 'Assets', icon: Laptop },
        { id: 'teams', label: 'Teams', icon: Network }
    ];

    return (
        <div className="page">
            <PageHeader
                eyebrow="Manager workspace"
                title={`Good to see you, ${user.name.split(' ')[0]}`}
                subtitle="Your reports, their work, and everything waiting on your approval."
            />

            <div className="stats-grid">
                <StatCard label="Direct reports" value={team.data.length} meta={`${team.data.filter(e => e.status === 'Active').length} active`} icon={Users} />
                <StatCard label="Pending leave requests" value={pendingLeaves} meta="Awaiting your decision" icon={Calendar} tone={pendingLeaves ? 'warning' : 'success'} />
                <StatCard label="Team payroll (annual)" value={fmtMoney(team.data.reduce((s, e) => s + (e.salary || 0), 0))} meta="Sum of base salaries" icon={Star} tone="info" />
            </div>

            <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

            <div className="animate-fade-in" key={activeTab}>
                {activeTab === 'team' && <TeamRoster team={team} managerId={user.employee_id} />}
                {activeTab === 'projects' && <ProjectTracker />}
                {activeTab === 'leaves' && <LeaveRequests leaves={leaves} />}
                {activeTab === 'attendance' && <TeamAttendance team={team.data} />}
                {activeTab === 'assets' && <ManagerAssets />}
                {activeTab === 'teams' && <ManagerTeams />}
            </div>
        </div>
    );
}

function TeamRoster({ team, managerId }) {
    const [expandedId, setExpandedId] = useState(null);
    const [editing, setEditing] = useState(null); // null | 'new' | employee
    const { data, loading, error, reload } = team;

    return (
        <Panel
            title="Direct reports"
            subtitle="Click a row to view and add performance reviews"
            icon={Users}
            flush
            actions={<button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><UserPlus size={15} /> Add team member</button>}
        >
            <ErrorNote message={error} onRetry={reload} />
            {loading ? <Loading /> : data.length === 0 ? (
                <EmptyState icon={Users} title="No one reports to you yet" hint="Add a team member to start assigning work." action={<button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>Add first member</button>} />
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Role</th>
                                <th>Contact</th>
                                <th className="num">Salary</th>
                                <th>Joined</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(emp => {
                                const open = expandedId === emp.employee_id;
                                return (
                                    <React.Fragment key={emp.employee_id}>
                                        <tr className={`clickable ${open ? 'selected' : ''}`} onClick={() => setExpandedId(open ? null : emp.employee_id)}>
                                            <td>
                                                <div className="row">
                                                    {open ? <ChevronDown size={15} className="muted" /> : <ChevronRight size={15} className="muted" />}
                                                    <Avatar name={fullName(emp)} size="sm" />
                                                    <div>
                                                        <div className="cell-main">{fullName(emp)}</div>
                                                        <div className="cell-sub mono">{code('EMP', emp.employee_id)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div>{emp.designation_title || '—'}</div>
                                                <div className="cell-sub">{emp.department_name}</div>
                                            </td>
                                            <td>
                                                <div className="text-sm">{emp.email || <span className="null">no login</span>}</div>
                                                {emp.phone && <div className="cell-sub row" style={{ gap: 4 }}><Phone size={11} />{emp.phone}</div>}
                                            </td>
                                            <td className="num">{fmtMoney(emp.salary)}</td>
                                            <td className="text-sm muted nowrap">{fmtDate(emp.joining_date)}</td>
                                            <td><StatusBadge status={emp.status} /></td>
                                            <td onClick={e => e.stopPropagation()}>
                                                <div className="row-actions">
                                                    <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => setEditing(emp)}><Pencil size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                        {open && (
                                            <tr>
                                                <td colSpan={7} style={{ background: 'var(--bg-inset)', padding: '1rem 1.25rem' }}>
                                                    <PerformanceReviews employeeId={emp.employee_id} employeeName={fullName(emp)} />
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {editing && (
                <EmployeeFormModal
                    employee={editing === 'new' ? null : editing}
                    defaults={{ manager_id: managerId }}
                    lockManager={editing === 'new'}
                    onClose={() => setEditing(null)}
                    onSaved={reload}
                />
            )}
        </Panel>
    );
}

// ============================================================
// Assets
// ============================================================
const ASSET_STATUSES = ['Available', 'In Use', 'Maintenance', 'Retired'];

function ManagerAssets() {
    const assets = useFetch('/api/dashboard/manager/assets', []);
    const { data: lk } = useLookups();
    const run = useAction();
    const [editing, setEditing] = useState(null);
    const [filter, setFilter] = useState('All');

    const handleAssign = async (asset, employeeId) => {
        const ok = await run(
            () => api.put(`/api/dashboard/manager/assets/${asset.asset_id}/assign`, {
                assigned_to: employeeId || null,
                status: employeeId ? 'In Use' : 'Available'
            }),
            employeeId ? `${asset.name} assigned` : `${asset.name} returned to inventory`
        );
        if (ok) assets.reload();
    };

    const handleDelete = async (asset) => {
        if (!window.confirm(`Delete ${asset.name}? This removes it from the asset register.`)) return;
        if (await run(() => api.del(`/api/dashboard/manager/assets/${asset.asset_id}`), 'Asset deleted')) assets.reload();
    };

    const counts = ASSET_STATUSES.reduce((acc, s) => ({ ...acc, [s]: assets.data.filter(a => a.status === s).length }), {});
    const visible = filter === 'All' ? assets.data : assets.data.filter(a => a.status === filter);

    return (
        <Panel
            title="Asset register"
            subtitle={`${assets.data.length} assets · ${counts['In Use'] || 0} in use · ${counts.Maintenance || 0} in maintenance`}
            icon={Laptop}
            flush
            actions={<>
                <div className="segmented">
                    {['All', ...ASSET_STATUSES].map(s => (
                        <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>{s}</button>
                    ))}
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><Plus size={15} /> Register asset</button>
            </>}
        >
            {assets.loading ? <Loading /> : visible.length === 0 ? (
                <EmptyState icon={Laptop} title="No assets here" hint="Register laptops, monitors, licences and other equipment." />
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr><th>Asset</th><th>Category</th><th>Purchased</th><th>Status</th><th>Assigned to</th><th /></tr>
                        </thead>
                        <tbody>
                            {visible.map(a => (
                                <tr key={a.asset_id}>
                                    <td>
                                        <div className="cell-main">{a.name}</div>
                                        <div className="cell-sub mono">{code('AST', a.asset_id)}</div>
                                    </td>
                                    <td>{a.category}</td>
                                    <td className="text-sm muted">{fmtDate(a.purchase_date)}</td>
                                    <td><StatusBadge status={a.status} /></td>
                                    <td>
                                        <select
                                            className="form-select sm"
                                            style={{ width: 190 }}
                                            value={a.assigned_to || ''}
                                            disabled={a.status === 'Retired' || a.status === 'Maintenance'}
                                            onChange={(e) => handleAssign(a, e.target.value)}
                                        >
                                            <option value="">Unassigned</option>
                                            {lk.employees.filter(e => e.status !== 'Inactive').map(e => (
                                                <option key={e.employee_id} value={e.employee_id}>{fullName(e)}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <div className="row-actions">
                                            <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => setEditing(a)}><Pencil size={15} /></button>
                                            <button className="btn btn-ghost btn-icon btn-sm danger" title="Delete" onClick={() => handleDelete(a)}><Trash2 size={15} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {editing && <AssetModal asset={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={assets.reload} />}
        </Panel>
    );
}

function AssetModal({ asset, onClose, onSaved }) {
    const run = useAction();
    const [form, bind] = useForm({
        name: asset?.name || '',
        category: asset?.category || 'Laptop',
        purchase_date: asset?.purchase_date || '',
        status: asset?.status || 'Available'
    });

    const submit = async () => {
        const ok = await run(
            () => asset ? api.put(`/api/dashboard/manager/assets/${asset.asset_id}`, form) : api.post('/api/dashboard/manager/assets', form),
            asset ? 'Asset updated' : 'Asset registered'
        );
        if (ok) { onSaved(); onClose(); }
    };

    return (
        <FormModal title={asset ? `Edit ${asset.name}` : 'Register asset'} onClose={onClose} onSubmit={submit}>
            <div className="form-grid">
                <Field label="Name" required span><input className="form-input" value={form.name} onChange={bind('name')} required placeholder='e.g. MacBook Pro 14"' /></Field>
                <Field label="Category" required>
                    <input className="form-input" list="asset-categories" value={form.category} onChange={bind('category')} required />
                    <datalist id="asset-categories">
                        {['Laptop', 'Monitor', 'Mobile', 'Server', 'Networking', 'Software License', 'Furniture'].map(c => <option key={c} value={c} />)}
                    </datalist>
                </Field>
                <Field label="Purchase date"><input className="form-input" type="date" value={form.purchase_date} onChange={bind('purchase_date')} /></Field>
                {asset && (
                    <Field label="Lifecycle status" span hint="Setting Available or Retired automatically unassigns the asset.">
                        <select className="form-select" value={form.status} onChange={bind('status')}>
                            {ASSET_STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </Field>
                )}
            </div>
        </FormModal>
    );
}

// ============================================================
// Teams
// ============================================================
function ManagerTeams() {
    const { user } = useAuth();
    const teams = useFetch('/api/dashboard/manager/teams', []);
    const run = useAction();
    const [editing, setEditing] = useState(null);
    const [managing, setManaging] = useState(null);

    const handleDelete = async (team) => {
        if (!window.confirm(`Delete "${team.name}"? Its ${team.member_count} membership(s) are removed and its projects become unassigned.`)) return;
        if (await run(() => api.del(`/api/dashboard/manager/teams/${team.team_id}`), 'Team deleted')) teams.reload();
    };

    return (
        <div className="stack">
            <div className="row-between">
                <div className="muted text-sm">{teams.data.length} teams across the organisation</div>
                <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><Plus size={15} /> Create team</button>
            </div>

            {teams.loading ? <Loading /> : teams.data.length === 0 ? (
                <div className="card"><EmptyState icon={Network} title="No teams yet" hint="Group employees into teams, then assign teams to projects." /></div>
            ) : (
                <div className="grid-cards">
                    {teams.data.map(t => (
                        <div key={t.team_id} className="card interactive stack-sm">
                            <div className="row-between">
                                <div className="strong">{t.name}</div>
                                <div className="row" style={{ gap: 0 }}>
                                    <button className="btn btn-ghost btn-icon btn-sm" title="Edit team" onClick={() => setEditing(t)}><Pencil size={14} /></button>
                                    <button className="btn btn-ghost btn-icon btn-sm danger" title="Delete team" onClick={() => handleDelete(t)}><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <div className="text-sm muted">{t.department_name} · Lead: {t.manager_first ? `${t.manager_first} ${t.manager_last}` : 'none'}</div>
                            <div className="row text-sm" style={{ gap: '1rem', marginTop: '0.25rem' }}>
                                <span><strong>{t.member_count}</strong> <span className="muted">members</span></span>
                                <span><strong>{t.project_count}</strong> <span className="muted">projects</span></span>
                            </div>
                            <button className="btn btn-outline btn-sm" style={{ marginTop: '0.35rem' }} onClick={() => setManaging(t)}>
                                <Users size={14} /> Manage members
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {editing && <TeamModal team={editing === 'new' ? null : editing} defaultLead={user?.employee_id} onClose={() => setEditing(null)} onSaved={teams.reload} />}
            {managing && <TeamMembersModal team={managing} onClose={() => { setManaging(null); teams.reload(); }} />}
        </div>
    );
}

function TeamModal({ team, defaultLead, onClose, onSaved }) {
    const { data: lk } = useLookups();
    const run = useAction();
    const [form, bind] = useForm({
        name: team?.name || '',
        department_id: team?.department_id || '',
        manager_id: team?.manager_id || defaultLead || ''
    });

    const submit = async () => {
        const ok = await run(
            () => team ? api.put(`/api/dashboard/manager/teams/${team.team_id}`, form) : api.post('/api/dashboard/manager/teams', form),
            team ? 'Team updated' : 'Team created'
        );
        if (ok) { onSaved(); onClose(); }
    };

    return (
        <FormModal title={team ? `Edit ${team.name}` : 'Create team'} onClose={onClose} onSubmit={submit} size="sm">
            <div className="stack">
                <Field label="Team name" required><input className="form-input" value={form.name} onChange={bind('name')} required /></Field>
                <Field label="Department" required>
                    <select className="form-select" value={form.department_id} onChange={bind('department_id')} required>
                        <option value="">Select department…</option>
                        {lk.departments.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
                    </select>
                </Field>
                <Field label="Team lead">
                    <select className="form-select" value={form.manager_id} onChange={bind('manager_id')}>
                        <option value="">No lead</option>
                        {lk.employees.map(e => <option key={e.employee_id} value={e.employee_id}>{fullName(e)}</option>)}
                    </select>
                </Field>
            </div>
        </FormModal>
    );
}

function TeamMembersModal({ team, onClose }) {
    const members = useFetch(`/api/dashboard/manager/teams/${team.team_id}/members`, []);
    const { data: lk } = useLookups();
    const run = useAction();
    const [toAdd, setToAdd] = useState('');

    const available = lk.employees.filter(e => e.status !== 'Inactive' && !members.data.some(m => m.employee_id === e.employee_id));

    const add = async () => {
        if (!toAdd) return;
        if (await run(() => api.post(`/api/dashboard/manager/teams/${team.team_id}/members`, { employee_id: toAdd }), 'Member added')) {
            setToAdd('');
            members.reload();
        }
    };

    const remove = async (m) => {
        if (await run(() => api.del(`/api/dashboard/manager/teams/${team.team_id}/members/${m.employee_id}`), `${m.first_name} removed`)) members.reload();
    };

    return (
        <Modal title={team.name} subtitle="Rows in the team_members junction table" onClose={onClose}>
            <div className="modal-body stack">
                <div className="row">
                    <select className="form-select grow" value={toAdd} onChange={e => setToAdd(e.target.value)}>
                        <option value="">Add an employee…</option>
                        {available.map(e => <option key={e.employee_id} value={e.employee_id}>{fullName(e)} — {e.designation}</option>)}
                    </select>
                    <button className="btn btn-primary" onClick={add} disabled={!toAdd}>Add</button>
                </div>

                <div>
                    <div className="section-title">Members ({members.data.length})</div>
                    {members.loading ? <Loading /> : members.data.length === 0 ? (
                        <div className="text-sm muted">No members yet.</div>
                    ) : (
                        <div className="card" style={{ padding: 0 }}>
                            <div className="list">
                                {members.data.map(m => (
                                    <div key={m.employee_id} className="list-item">
                                        <Avatar name={fullName(m)} size="sm" />
                                        <div className="grow">
                                            <div className="strong text-sm">{fullName(m)}</div>
                                            <div className="text-xs muted">{m.role}</div>
                                        </div>
                                        <button className="btn btn-ghost btn-icon btn-sm danger" onClick={() => remove(m)} title="Remove from team"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
