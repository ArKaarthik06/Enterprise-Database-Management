import React, { useMemo, useState } from 'react';
import {
    Users, Building2, BadgeCheck, Wallet, KeyRound, Plus, Pencil, Trash2, Search, Play, CheckCheck, UserPlus, Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EmployeeFormModal from './EmployeeForm';
import {
    PageHeader, Tabs, Panel, StatCard, StatusBadge, EmptyState, Loading, ErrorNote, Avatar, FormModal, Field, SearchInput, Alert,
    useFetch, useForm, useAction, useLookups, api, fmtMoney, fmtDate, fmtDateTime, fullName, code, MONTHS
} from './ui';

export default function HRDashboard() {
    const { user } = useAuth();
    const isAdmin = ['Admin', 'SuperAdmin'].includes(user?.role);
    const [activeTab, setActiveTab] = useState('employees');

    const tabs = [
        { id: 'employees', label: 'Employees', icon: Users },
        { id: 'departments', label: 'Departments', icon: Building2 },
        { id: 'designations', label: 'Designations', icon: BadgeCheck },
        { id: 'payroll', label: 'Payroll', icon: Wallet },
        ...(isAdmin ? [{ id: 'accounts', label: 'User accounts', icon: KeyRound }] : [])
    ];

    return (
        <div className="page">
            <PageHeader eyebrow="People & organisation" title="Workforce administration" subtitle="Employee records, org structure, payroll runs and login accounts." />
            <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
            <div className="animate-fade-in" key={activeTab}>
                {activeTab === 'employees' && <EmployeeDirectory />}
                {activeTab === 'departments' && <Departments />}
                {activeTab === 'designations' && <Designations />}
                {activeTab === 'payroll' && <Payroll />}
                {activeTab === 'accounts' && isAdmin && <Accounts />}
            </div>
        </div>
    );
}

// ============================================================
// Employee directory
// ============================================================
function EmployeeDirectory() {
    const employees = useFetch('/api/employees', []);
    const { data: lk } = useLookups();
    const [search, setSearch] = useState('');
    const [dept, setDept] = useState('');
    const [status, setStatus] = useState('');
    const [editing, setEditing] = useState(null);
    const [accountFor, setAccountFor] = useState(null);

    const visible = useMemo(() => employees.data.filter(e => {
        const q = search.toLowerCase();
        const matches = !q || `${e.first_name} ${e.last_name} ${e.email || ''} ${e.designation_title || ''}`.toLowerCase().includes(q);
        return matches && (!dept || String(e.department_id) === dept) && (!status || e.status === status);
    }), [employees.data, search, dept, status]);

    const active = employees.data.filter(e => e.status === 'Active');
    const payroll = active.reduce((s, e) => s + (e.salary || 0), 0);

    return (
        <div className="stack">
            <div className="stats-grid">
                <StatCard label="Headcount" value={employees.data.length} meta={`${active.length} active`} icon={Users} />
                <StatCard label="Annual payroll" value={fmtMoney(payroll)} meta="Active employees' base salary" icon={Wallet} tone="success" />
                <StatCard label="Average salary" value={fmtMoney(active.length ? payroll / active.length : 0)} icon={BadgeCheck} tone="info" />
                <StatCard label="Without login" value={employees.data.filter(e => !e.user_id).length} meta="Employee records with no user account" icon={KeyRound} tone="warning" />
            </div>

            <Panel
                title="Employee directory"
                icon={Users}
                flush
                actions={<>
                    <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, title…" icon={Search} />
                    <select className="form-select sm" style={{ width: 170 }} value={dept} onChange={e => setDept(e.target.value)} aria-label="Department filter">
                        <option value="">All departments</option>
                        {lk.departments.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
                    </select>
                    <select className="form-select sm" style={{ width: 120 }} value={status} onChange={e => setStatus(e.target.value)} aria-label="Status filter">
                        <option value="">Any status</option><option>Active</option><option>On Leave</option><option>Inactive</option>
                    </select>
                    <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><UserPlus size={15} /> Add employee</button>
                </>}
            >
                <ErrorNote message={employees.error} onRetry={employees.reload} />
                {employees.loading ? <Loading /> : visible.length === 0 ? (
                    <EmptyState icon={Users} title="No matching employees" hint="Try a different search or filter." />
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead><tr><th>Employee</th><th>Department / role</th><th>Manager</th><th>Login</th><th className="num">Salary</th><th>Status</th><th /></tr></thead>
                            <tbody>
                                {visible.map(e => (
                                    <tr key={e.employee_id}>
                                        <td>
                                            <div className="row">
                                                <Avatar name={fullName(e)} size="sm" />
                                                <div>
                                                    <div className="cell-main">{fullName(e)}</div>
                                                    <div className="cell-sub mono">{code('EMP', e.employee_id)} · joined {fmtDate(e.joining_date)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><div>{e.designation_title}</div><div className="cell-sub">{e.department_name}</div></td>
                                        <td className="text-sm">{e.manager_first ? `${e.manager_first} ${e.manager_last}` : <span className="null">—</span>}</td>
                                        <td className="text-sm">
                                            {e.username ? (
                                                <><div className="mono">{e.username}</div><div className="cell-sub">{e.role_name}{e.is_active ? '' : ' · disabled'}</div></>
                                            ) : (
                                                <button className="btn btn-ghost btn-sm" onClick={() => setAccountFor(e)}><KeyRound size={13} /> Create login</button>
                                            )}
                                        </td>
                                        <td className="num">{fmtMoney(e.salary)}</td>
                                        <td><StatusBadge status={e.status} /></td>
                                        <td><div className="row-actions"><button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => setEditing(e)}><Pencil size={15} /></button></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>

            {editing && <EmployeeFormModal employee={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={employees.reload} />}
            {accountFor && <AccountModal employee={accountFor} onClose={() => setAccountFor(null)} onSaved={employees.reload} />}
        </div>
    );
}

// ============================================================
// Departments
// ============================================================
function Departments() {
    const departments = useFetch('/api/org/departments', []);
    const run = useAction();
    const [editing, setEditing] = useState(null);

    const remove = async (d) => {
        if (!window.confirm(`Delete the ${d.name} department? Its designations are removed too (ON DELETE CASCADE).`)) return;
        if (await run(() => api.del(`/api/org/departments/${d.department_id}`), 'Department deleted')) departments.reload();
    };

    return (
        <div className="stack">
            <div className="row-between">
                <div className="text-sm muted">{departments.data.length} departments · deleting is blocked while employees belong to one (ON DELETE RESTRICT)</div>
                <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><Plus size={15} /> New department</button>
            </div>
            {departments.loading ? <Loading /> : (
                <div className="grid-cards">
                    {departments.data.map(d => (
                        <div key={d.department_id} className="card interactive stack-sm">
                            <div className="row-between">
                                <div className="strong">{d.name}</div>
                                <div className="row" style={{ gap: 0 }}>
                                    <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => setEditing(d)}><Pencil size={14} /></button>
                                    <button className="btn btn-ghost btn-icon btn-sm danger" title="Delete" onClick={() => remove(d)}><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <div className="text-sm muted" style={{ minHeight: '2.6em' }}>{d.description || 'No description'}</div>
                            <div className="row text-sm" style={{ gap: 6 }}>
                                <Crown size={14} className="text-warning" />
                                {d.head_first ? <span>{d.head_first} {d.head_last}</span> : <span className="muted">No head assigned</span>}
                            </div>
                            <div className="row wrap text-sm" style={{ gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem' }}>
                                <span><strong>{d.headcount}</strong> <span className="muted">people</span></span>
                                <span><strong>{d.designation_count}</strong> <span className="muted">roles</span></span>
                                <span><strong>{d.team_count}</strong> <span className="muted">teams</span></span>
                                <span className="muted">avg {fmtMoney(d.avg_salary)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {editing && <DepartmentModal dept={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={departments.reload} />}
        </div>
    );
}

function DepartmentModal({ dept, onClose, onSaved }) {
    const { data: lk } = useLookups();
    const run = useAction();
    const [form, bind] = useForm({ name: dept?.name || '', description: dept?.description || '', head_id: dept?.head_id || '' });
    const submit = async () => {
        const ok = await run(() => dept ? api.put(`/api/org/departments/${dept.department_id}`, form) : api.post('/api/org/departments', form), dept ? 'Department updated' : 'Department created');
        if (ok) { onSaved(); onClose(); }
    };
    return (
        <FormModal title={dept ? `Edit ${dept.name}` : 'New department'} onClose={onClose} onSubmit={submit} size="sm">
            <div className="stack">
                <Field label="Name" required><input className="form-input" value={form.name} onChange={bind('name')} required /></Field>
                <Field label="Description"><textarea className="form-textarea" value={form.description} onChange={bind('description')} /></Field>
                <Field label="Department head" hint="Sets departments.head_id (FK → employees)">
                    <select className="form-select" value={form.head_id} onChange={bind('head_id')}>
                        <option value="">No head</option>
                        {lk.employees.filter(e => e.status !== 'Inactive').map(e => <option key={e.employee_id} value={e.employee_id}>{fullName(e)} — {e.designation}</option>)}
                    </select>
                </Field>
            </div>
        </FormModal>
    );
}

// ============================================================
// Designations
// ============================================================
function Designations() {
    const designations = useFetch('/api/org/designations', []);
    const run = useAction();
    const [editing, setEditing] = useState(null);

    const remove = async (d) => {
        if (!window.confirm(`Delete the "${d.title}" designation?`)) return;
        if (await run(() => api.del(`/api/org/designations/${d.designation_id}`), 'Designation deleted')) designations.reload();
    };

    return (
        <Panel title="Designations" subtitle="Job titles and seniority levels per department" icon={BadgeCheck} flush
            actions={<button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><Plus size={15} /> New designation</button>}>
            {designations.loading ? <Loading /> : (
                <div className="table-container">
                    <table className="data-table">
                        <thead><tr><th>Title</th><th>Department</th><th className="num">Level</th><th className="num">Employees</th><th /></tr></thead>
                        <tbody>
                            {designations.data.map(d => (
                                <tr key={d.designation_id}>
                                    <td className="cell-main">{d.title}</td>
                                    <td>{d.department_name}</td>
                                    <td className="num">L{d.level}</td>
                                    <td className="num">{d.headcount}</td>
                                    <td>
                                        <div className="row-actions">
                                            <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => setEditing(d)}><Pencil size={14} /></button>
                                            <button className="btn btn-ghost btn-icon btn-sm danger" title="Delete" onClick={() => remove(d)} disabled={d.headcount > 0}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {editing && <DesignationModal designation={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={designations.reload} />}
        </Panel>
    );
}

function DesignationModal({ designation, onClose, onSaved }) {
    const { data: lk } = useLookups();
    const run = useAction();
    const [form, bind] = useForm({ title: designation?.title || '', department_id: designation?.department_id || '', level: designation?.level || 1 });
    const submit = async () => {
        const ok = await run(() => designation ? api.put(`/api/org/designations/${designation.designation_id}`, form) : api.post('/api/org/designations', form), 'Designation saved');
        if (ok) { onSaved(); onClose(); }
    };
    return (
        <FormModal title={designation ? 'Edit designation' : 'New designation'} onClose={onClose} onSubmit={submit} size="sm">
            <div className="stack">
                <Field label="Title" required><input className="form-input" value={form.title} onChange={bind('title')} required /></Field>
                <Field label="Department" required>
                    <select className="form-select" value={form.department_id} onChange={bind('department_id')} required>
                        <option value="">Select…</option>
                        {lk.departments.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
                    </select>
                </Field>
                <Field label="Level" hint="1 = entry, 5 = executive"><input type="number" min="1" max="10" className="form-input" value={form.level} onChange={bind('level')} /></Field>
            </div>
        </FormModal>
    );
}

// ============================================================
// Payroll
// ============================================================
function Payroll() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const payroll = useFetch(`/api/hr/payroll?month=${month}&year=${year}`, []);
    const run = useAction();
    const [drafts, setDrafts] = useState({});

    const runPayroll = async () => {
        if (await run(() => api.post('/api/hr/payroll/run', { month, year }), r => r.message)) payroll.reload();
    };
    const payAll = async () => {
        if (!window.confirm(`Mark every pending payslip for ${MONTHS[month - 1]} ${year} as paid? Employees are notified.`)) return;
        if (await run(() => api.post('/api/hr/payroll/pay-all', { month, year }), r => r.message)) payroll.reload();
    };
    const save = async (row, extra = {}) => {
        const draft = drafts[row.payroll_id] || {};
        const ok = await run(() => api.patch(`/api/hr/payroll/${row.payroll_id}`, { ...draft, ...extra }), extra.status === 'Paid' ? `${row.first_name} paid` : 'Payslip updated');
        if (ok) {
            setDrafts(d => { const n = { ...d }; delete n[row.payroll_id]; return n; });
            payroll.reload();
        }
    };
    const setDraft = (id, key, value) => setDrafts(d => ({ ...d, [id]: { ...d[id], [key]: value } }));

    const total = (k) => payroll.data.reduce((s, r) => s + (r[k] || 0), 0);
    const pending = payroll.data.filter(r => r.status !== 'Paid').length;

    return (
        <div className="stack">
            <div className="card row-between wrap">
                <div className="row wrap">
                    <select className="form-select sm" style={{ width: 110 }} value={month} onChange={e => setMonth(Number(e.target.value))} aria-label="Month">
                        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                    <input type="number" className="form-input sm" style={{ width: 90 }} value={year} onChange={e => setYear(Number(e.target.value))} aria-label="Year" />
                    <span className="text-sm muted">Payroll period</span>
                </div>
                <div className="toolbar">
                    <button className="btn btn-outline btn-sm" onClick={runPayroll}><Play size={14} /> Run payroll</button>
                    <button className="btn btn-success btn-sm" onClick={payAll} disabled={!pending}><CheckCheck size={14} /> Pay all pending ({pending})</button>
                </div>
            </div>

            <Alert tone="info">
                <strong>Run payroll</strong> inserts one <code>Pending</code> row per active employee (basic = annual salary ÷ 12) inside a single transaction and skips anyone already processed. Adjust bonus and deductions, then pay — net salary is recalculated by the server.
            </Alert>

            <div className="stats-grid">
                <StatCard label="Gross (basic + bonus)" value={fmtMoney(total('basic_salary') + total('bonus'), 2)} icon={Wallet} />
                <StatCard label="Deductions" value={fmtMoney(total('deductions'), 2)} icon={Wallet} tone="danger" />
                <StatCard label="Net payout" value={fmtMoney(total('net_salary'), 2)} meta={`${payroll.data.length} payslips`} icon={Wallet} tone="success" />
            </div>

            <Panel title={`Payslips · ${MONTHS[month - 1]} ${year}`} icon={Wallet} flush>
                {payroll.loading ? <Loading /> : payroll.data.length === 0 ? (
                    <EmptyState icon={Wallet} title="Payroll not run for this period" hint="Click Run payroll to generate payslips for every active employee." action={<button className="btn btn-primary btn-sm" onClick={runPayroll}><Play size={14} /> Run payroll</button>} />
                ) : (
                    <div className="table-container">
                        <table className="data-table compact">
                            <thead><tr><th>Employee</th><th className="num">Basic</th><th className="num">Bonus</th><th className="num">Deductions</th><th className="num">Net</th><th>Status</th><th /></tr></thead>
                            <tbody>
                                {payroll.data.map(r => {
                                    const draft = drafts[r.payroll_id] || {};
                                    const paid = r.status === 'Paid';
                                    const dirty = draft.bonus !== undefined || draft.deductions !== undefined;
                                    return (
                                        <tr key={r.payroll_id}>
                                            <td><div className="cell-main">{fullName(r)}</div><div className="cell-sub">{r.department_name}</div></td>
                                            <td className="num">{fmtMoney(r.basic_salary, 2)}</td>
                                            <td className="num">
                                                {paid ? fmtMoney(r.bonus, 2) : <input type="number" min="0" step="50" className="form-input sm" style={{ width: 100, textAlign: 'right' }} value={draft.bonus ?? r.bonus} onChange={e => setDraft(r.payroll_id, 'bonus', e.target.value)} />}
                                            </td>
                                            <td className="num">
                                                {paid ? fmtMoney(r.deductions, 2) : <input type="number" min="0" step="50" className="form-input sm" style={{ width: 100, textAlign: 'right' }} value={draft.deductions ?? r.deductions} onChange={e => setDraft(r.payroll_id, 'deductions', e.target.value)} />}
                                            </td>
                                            <td className="num strong">{fmtMoney(r.net_salary, 2)}</td>
                                            <td><StatusBadge status={r.status} />{paid && <div className="cell-sub">{fmtDate(r.payment_date)}</div>}</td>
                                            <td>
                                                {!paid && (
                                                    <div className="row-actions" style={{ gap: '0.35rem' }}>
                                                        {dirty && <button className="btn btn-outline btn-sm" onClick={() => save(r)}>Save</button>}
                                                        <button className="btn btn-success btn-sm" onClick={() => save(r, { status: 'Paid' })}>Pay</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>
        </div>
    );
}

// ============================================================
// User accounts (Admin only)
// ============================================================
function Accounts() {
    const users = useFetch('/api/org/users', []);
    const { data: lk } = useLookups();
    const run = useAction();
    const [creating, setCreating] = useState(false);
    const [resetting, setResetting] = useState(null);

    const patch = async (u, body, msg) => {
        if (await run(() => api.patch(`/api/org/users/${u.user_id}`, body), msg)) users.reload();
    };

    return (
        <Panel title="User accounts" subtitle="Rows in the users table and what they are linked to" icon={KeyRound} flush
            actions={<button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}><Plus size={15} /> New account</button>}>
            {users.loading ? <Loading /> : (
                <div className="table-container">
                    <table className="data-table">
                        <thead><tr><th>Account</th><th>Linked to</th><th>Role</th><th>Created</th><th>Status</th><th /></tr></thead>
                        <tbody>
                            {users.data.map(u => (
                                <tr key={u.user_id}>
                                    <td><div className="cell-main mono">{u.username}</div><div className="cell-sub">{u.email}</div></td>
                                    <td className="text-sm">
                                        {u.employee_id ? <>{fullName(u)} <span className="cell-sub mono">{code('EMP', u.employee_id)}</span></>
                                            : u.client_id ? <>{u.client_company} <span className="cell-sub">(client)</span></>
                                                : <span className="null">unlinked</span>}
                                    </td>
                                    <td>
                                        <select className="form-select sm" style={{ width: 160 }} value={u.role_id} onChange={e => patch(u, { role_id: Number(e.target.value) }, `${u.username} is now ${lk.roles.find(r => r.role_id === Number(e.target.value))?.role_name}`)} aria-label="Role">
                                            {lk.roles.map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                                        </select>
                                    </td>
                                    <td className="text-sm muted">{fmtDateTime(u.created_at)}</td>
                                    <td><StatusBadge status={u.is_active ? 'Active' : 'Inactive'} /></td>
                                    <td>
                                        <div className="row-actions" style={{ gap: '0.35rem' }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setResetting(u)}>Reset password</button>
                                            <button className={`btn btn-sm ${u.is_active ? 'btn-outline' : 'btn-success'}`} onClick={() => patch(u, { is_active: !u.is_active }, u.is_active ? `${u.username} disabled` : `${u.username} enabled`)}>
                                                {u.is_active ? 'Disable' : 'Enable'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {creating && <AccountModal onClose={() => setCreating(false)} onSaved={users.reload} />}
            {resetting && <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} onSaved={users.reload} />}
        </Panel>
    );
}

function AccountModal({ employee, onClose, onSaved }) {
    const { data: lk } = useLookups();
    const run = useAction();
    const employeeRole = lk.roles.find(r => r.role_name === 'Employee');
    const [form, bind] = useForm({
        username: employee ? `${employee.first_name}_${employee.last_name}`.toLowerCase().replace(/\s+/g, '') : '',
        email: '', password: '', role_id: '', link: employee ? `e:${employee.employee_id}` : ''
    });

    const submit = async () => {
        const [kind, id] = form.link.split(':');
        const payload = {
            username: form.username, email: form.email, password: form.password,
            role_id: form.role_id || (kind === 'c' ? lk.roles.find(r => r.role_name === 'Client')?.role_id : employeeRole?.role_id),
            employee_id: kind === 'e' ? id : undefined,
            client_id: kind === 'c' ? id : undefined
        };
        if (await run(() => api.post('/api/org/users', payload), 'Account created')) { onSaved(); onClose(); }
    };

    return (
        <FormModal title={employee ? `Create login for ${fullName(employee)}` : 'New user account'} subtitle="User insert and link update run in one transaction" onClose={onClose} onSubmit={submit} submitLabel="Create account">
            <div className="form-grid">
                <Field label="Username" required><input className="form-input" value={form.username} onChange={bind('username')} required /></Field>
                <Field label="Email" required><input type="email" className="form-input" value={form.email} onChange={bind('email')} required /></Field>
                <Field label="Temporary password" required><input className="form-input" value={form.password} onChange={bind('password')} required /></Field>
                <Field label="Role">
                    <select className="form-select" value={form.role_id} onChange={bind('role_id')}>
                        <option value="">Default for link type</option>
                        {lk.roles.map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                    </select>
                </Field>
                {!employee && (
                    <Field label="Link to" span hint="Only records without an existing login are listed">
                        <select className="form-select" value={form.link} onChange={bind('link')}>
                            <option value="">Nothing (standalone account)</option>
                            <LinkOptions />
                        </select>
                    </Field>
                )}
            </div>
        </FormModal>
    );
}

function LinkOptions() {
    const employees = useFetch('/api/employees', []);
    const clients = useFetch('/api/crm/clients', []);
    return (
        <>
            <optgroup label="Employees">
                {employees.data.filter(e => !e.user_id).map(e => <option key={e.employee_id} value={`e:${e.employee_id}`}>{fullName(e)}</option>)}
            </optgroup>
            <optgroup label="Clients">
                {clients.data.filter(c => !c.user_id).map(c => <option key={c.client_id} value={`c:${c.client_id}`}>{c.company}</option>)}
            </optgroup>
        </>
    );
}

function ResetPasswordModal({ user, onClose, onSaved }) {
    const run = useAction();
    const [password, setPassword] = useState('');
    const submit = async () => {
        if (await run(() => api.patch(`/api/org/users/${user.user_id}`, { password }), `Password reset for ${user.username}`)) { onSaved(); onClose(); }
    };
    return (
        <FormModal title={`Reset password · ${user.username}`} onClose={onClose} onSubmit={submit} submitLabel="Reset" size="sm">
            <Field label="New password" required><input className="form-input" value={password} onChange={e => setPassword(e.target.value)} required minLength={4} /></Field>
        </FormModal>
    );
}
