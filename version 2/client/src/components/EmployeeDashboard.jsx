import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, CheckCircle2, Circle, Clock, CalendarDays, Star, Wallet, Laptop, User, Plus,
    LogIn, LogOut, AlertTriangle, Printer, Pencil
} from 'lucide-react';
import {
    PageHeader, Tabs, Panel, StatCard, StatusBadge, EmptyState, Loading, ErrorNote, FormModal, Modal, Field, Avatar,
    useFetch, useForm, useAction, api, fmtMoney, fmtDate, code, isPastDue, todayISO, MONTHS
} from './ui';
import PerformanceReviews from './PerformanceReviews';
import { hoursBetween } from './TeamAttendance';

export default function EmployeeDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const employeeId = user?.employee_id;

    const tasks = useFetch(employeeId ? `/api/projects/employee-tasks?employee_id=${employeeId}` : null, []);
    const openTasks = tasks.data.filter(t => t.status !== 'Completed');

    if (!employeeId) {
        return <EmptyState icon={User} title="No employee profile linked" hint="Ask HR to link your login to an employee record." />;
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'tasks', label: 'My tasks', icon: CheckCircle2, count: openTasks.length },
        { id: 'leaves', label: 'Leave', icon: CalendarDays },
        { id: 'attendance', label: 'Attendance', icon: Clock },
        { id: 'reviews', label: 'Reviews', icon: Star },
        { id: 'payroll', label: 'Payslips', icon: Wallet },
        { id: 'assets', label: 'Assets', icon: Laptop },
        { id: 'profile', label: 'Profile', icon: User }
    ];

    return (
        <div className="page">
            <PageHeader eyebrow="My workspace" title={`Welcome back, ${user.name.split(' ')[0]}`} subtitle="Your tasks, time off, attendance and pay in one place." />
            <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
            <div className="animate-fade-in" key={activeTab}>
                {activeTab === 'overview' && <Overview employeeId={employeeId} tasks={tasks} goTo={setActiveTab} />}
                {activeTab === 'tasks' && <EmployeeTasks tasks={tasks} />}
                {activeTab === 'leaves' && <EmployeeLeaves employeeId={employeeId} />}
                {activeTab === 'attendance' && <EmployeeAttendance employeeId={employeeId} />}
                {activeTab === 'reviews' && <div className="card"><PerformanceReviews employeeId={employeeId} readOnly /></div>}
                {activeTab === 'payroll' && <EmployeePayroll employeeId={employeeId} />}
                {activeTab === 'assets' && <EmployeeAssets employeeId={employeeId} />}
                {activeTab === 'profile' && <EmployeeProfile employeeId={employeeId} />}
            </div>
        </div>
    );
}

// ============================================================
// Overview
// ============================================================
function Overview({ employeeId, tasks, goTo }) {
    const leaveSummary = useFetch(`/api/hr/leaves/summary?employee_id=${employeeId}`, []);
    const payroll = useFetch(`/api/dashboard/employee/payroll?employee_id=${employeeId}`, []);

    const open = tasks.data.filter(t => t.status !== 'Completed');
    const overdue = open.filter(t => isPastDue(t.due_date, t.status));
    const leaveDays = leaveSummary.data.reduce((s, r) => s + (r.days || 0), 0);
    const lastPay = payroll.data.find(p => p.status === 'Paid');

    return (
        <div className="stack">
            <div className="grid-2">
                <CheckInCard employeeId={employeeId} />
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                    <StatCard label="Open tasks" value={open.length} meta={overdue.length ? `${overdue.length} overdue` : 'Nothing overdue'} icon={CheckCircle2} tone={overdue.length ? 'danger' : 'primary'} />
                    <StatCard label="Leave taken this year" value={`${leaveDays}d`} meta={`${leaveSummary.data.length} leave type(s)`} icon={CalendarDays} tone="info" />
                    <StatCard label="Last net pay" value={lastPay ? fmtMoney(lastPay.net_salary) : '—'} meta={lastPay ? `${MONTHS[lastPay.month - 1]} ${lastPay.year}` : 'No payslips yet'} icon={Wallet} tone="success" />
                    <StatCard label="Completed tasks" value={tasks.data.length - open.length} meta={`of ${tasks.data.length} assigned`} icon={Star} tone="warning" />
                </div>
            </div>

            <Panel title="Up next" subtitle="Your open tasks, soonest due first" icon={CheckCircle2} flush actions={<button className="btn btn-ghost btn-sm" onClick={() => goTo('tasks')}>View all</button>}>
                {tasks.loading ? <Loading /> : open.length === 0 ? (
                    <EmptyState icon={CheckCircle2} title="All clear" hint="You have no open tasks." />
                ) : (
                    <div className="list">
                        {open.slice(0, 5).map(t => (
                            <div key={t.task_id} className="list-item">
                                <div className="grow">
                                    <div className="strong text-sm">{t.title}</div>
                                    <div className="text-xs muted">{t.project_name}</div>
                                </div>
                                <StatusBadge status={t.priority} plain />
                                <span className={`text-sm nowrap ${isPastDue(t.due_date, t.status) ? 'text-danger strong' : 'muted'}`} style={{ width: 110, textAlign: 'right' }}>{fmtDate(t.due_date)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Panel>
        </div>
    );
}

function CheckInCard({ employeeId }) {
    const today = useFetch(`/api/hr/attendance/today?employee_id=${employeeId}`, null);
    const run = useAction();
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(t);
    }, []);

    const act = async (kind) => {
        if (await run(() => api.post(`/api/hr/attendance/check-${kind}`, { employee_id: employeeId }), r => r.message)) today.reload();
    };

    const rec = today.data;
    return (
        <div className="card stack-sm" style={{ justifyContent: 'space-between' }}>
            <div className="row-between">
                <div>
                    <div className="stat-lbl">Today · {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                    <div className="stat-val mono" style={{ fontSize: '2rem' }}>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                {rec && <StatusBadge status={rec.status} />}
            </div>
            <div className="row text-sm muted" style={{ gap: '1.5rem' }}>
                <span>In: <span className="mono strong" style={{ color: 'var(--text-main)' }}>{rec?.check_in || '—'}</span></span>
                <span>Out: <span className="mono strong" style={{ color: 'var(--text-main)' }}>{rec?.check_out || '—'}</span></span>
                <span>Hours: <span className="mono strong" style={{ color: 'var(--text-main)' }}>{hoursBetween(rec?.check_in, rec?.check_out)}</span></span>
            </div>
            <div className="row" style={{ marginTop: '0.4rem' }}>
                {!rec?.check_in ? (
                    <button className="btn btn-primary" onClick={() => act('in')}><LogIn size={16} /> Check in</button>
                ) : !rec.check_out ? (
                    <button className="btn btn-secondary" onClick={() => act('out')}><LogOut size={16} /> Check out</button>
                ) : (
                    <span className="text-sm text-success strong">Day complete — see you tomorrow.</span>
                )}
                <span className="text-xs muted">Check-ins after 09:30 are marked Late.</span>
            </div>
        </div>
    );
}

// ============================================================
// Tasks
// ============================================================
function EmployeeTasks({ tasks }) {
    const run = useAction();
    const [filter, setFilter] = useState('Open');

    const setStatus = async (task, status) => {
        tasks.setData(ts => ts.map(t => t.task_id === task.task_id ? { ...t, status } : t));
        const ok = await run(() => api.patch(`/api/projects/tasks/${task.task_id}/status`, { status }), status === 'Completed' ? 'Nice work — task completed' : undefined);
        if (!ok) tasks.reload();
    };

    const visible = tasks.data.filter(t => filter === 'All' || (filter === 'Open' ? t.status !== 'Completed' : t.status === 'Completed'));

    return (
        <Panel
            title="My tasks"
            icon={CheckCircle2}
            flush
            actions={<div className="segmented">{['Open', 'Completed', 'All'].map(f => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>)}</div>}
        >
            <ErrorNote message={tasks.error} onRetry={tasks.reload} />
            {tasks.loading ? <Loading /> : visible.length === 0 ? (
                <EmptyState icon={CheckCircle2} title={filter === 'Open' ? 'No open tasks' : 'Nothing here'} hint="Tasks your manager assigns to you appear here." />
            ) : (
                <div className="table-container">
                    <table className="data-table compact">
                        <thead><tr><th style={{ width: 36 }} /><th>Task</th><th>Project</th><th>Priority</th><th>Due</th><th>Status</th></tr></thead>
                        <tbody>
                            {visible.map(t => {
                                const done = t.status === 'Completed';
                                const late = isPastDue(t.due_date, t.status);
                                return (
                                    <tr key={t.task_id}>
                                        <td>
                                            <button className={`check-btn ${done ? 'done' : ''}`} onClick={() => setStatus(t, done ? 'Pending' : 'Completed')} aria-label={done ? 'Reopen task' : 'Complete task'}>
                                                {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                            </button>
                                        </td>
                                        <td>
                                            <div className={`strong text-sm ${done ? 'strike' : ''}`}>{t.title}</div>
                                            {t.description && <div className="cell-sub">{t.description}</div>}
                                        </td>
                                        <td className="text-sm">{t.project_name}</td>
                                        <td><StatusBadge status={t.priority} plain /></td>
                                        <td className={`text-sm nowrap ${late ? 'text-danger strong' : 'muted'}`}>
                                            {late && <AlertTriangle size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />}{fmtDate(t.due_date)}
                                        </td>
                                        <td>
                                            <select className="form-select sm" style={{ width: 130 }} value={t.status} onChange={e => setStatus(t, e.target.value)} aria-label="Task status">
                                                <option>Pending</option>
                                                <option>In Progress</option>
                                                <option>Completed</option>
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </Panel>
    );
}

// ============================================================
// Leave
// ============================================================
const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Maternity Leave', 'Paternity Leave', 'Unpaid Leave'];

function EmployeeLeaves({ employeeId }) {
    const leaves = useFetch(`/api/hr/leaves?employee_id=${employeeId}`, []);
    const summary = useFetch(`/api/hr/leaves/summary?employee_id=${employeeId}`, []);
    const run = useAction();
    const [showForm, setShowForm] = useState(false);

    const cancel = async (leave) => {
        if (!window.confirm('Withdraw this leave request?')) return;
        if (await run(() => api.patch(`/api/hr/leaves/${leave.leave_id}/cancel`, { employee_id: employeeId }), 'Request withdrawn')) leaves.reload();
    };

    return (
        <div className="stack">
            <div className="stats-grid">
                {summary.data.length === 0 ? (
                    <StatCard label="Approved leave this year" value="0 days" meta="No approved leave yet" icon={CalendarDays} tone="info" />
                ) : summary.data.map(s => (
                    <StatCard key={s.leave_type} label={s.leave_type} value={`${s.days} day${s.days === 1 ? '' : 's'}`} meta={`${s.requests} approved request(s) this year`} icon={CalendarDays} tone="info" />
                ))}
            </div>

            <Panel
                title="Leave requests"
                icon={CalendarDays}
                flush
                actions={<button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={15} /> Request leave</button>}
            >
                {leaves.loading ? <Loading /> : leaves.data.length === 0 ? (
                    <EmptyState icon={CalendarDays} title="No leave requests yet" hint="Requests go to your manager for approval." />
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead><tr><th>Type</th><th>Dates</th><th className="num">Days</th><th>Reason</th><th>Status</th><th /></tr></thead>
                            <tbody>
                                {leaves.data.map(l => (
                                    <tr key={l.leave_id}>
                                        <td className="strong">{l.leave_type}</td>
                                        <td className="text-sm nowrap">{fmtDate(l.start_date)} → {fmtDate(l.end_date)}</td>
                                        <td className="num">{l.days}</td>
                                        <td className="text-sm muted">{l.reason || '—'}</td>
                                        <td>
                                            <StatusBadge status={l.status} />
                                            {l.approver_first && <div className="cell-sub">by {l.approver_first} {l.approver_last}</div>}
                                        </td>
                                        <td className="right">
                                            {l.status === 'Pending' && <button className="btn btn-ghost btn-sm danger" onClick={() => cancel(l)}>Withdraw</button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>

            {showForm && <LeaveRequestModal employeeId={employeeId} onClose={() => setShowForm(false)} onSaved={leaves.reload} />}
        </div>
    );
}

function LeaveRequestModal({ employeeId, onClose, onSaved }) {
    const run = useAction();
    const [form, bind] = useForm({ leave_type: 'Annual Leave', start_date: todayISO(), end_date: todayISO(), reason: '' });
    const days = form.start_date && form.end_date && form.end_date >= form.start_date
        ? Math.round((new Date(form.end_date) - new Date(form.start_date)) / 86400000) + 1 : 0;

    const submit = async () => {
        if (await run(() => api.post('/api/hr/leaves', { ...form, employee_id: employeeId }), 'Leave request sent to your manager')) { onSaved(); onClose(); }
    };

    return (
        <FormModal title="Request time off" subtitle={days ? `${days} calendar day${days > 1 ? 's' : ''}` : 'End date must be on or after the start date'} onClose={onClose} onSubmit={submit} submitLabel="Submit request">
            <div className="form-grid">
                <Field label="Leave type" required span>
                    <select className="form-select" value={form.leave_type} onChange={bind('leave_type')}>{LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                </Field>
                <Field label="From" required><input type="date" className="form-input" value={form.start_date} onChange={bind('start_date')} required /></Field>
                <Field label="To" required><input type="date" className="form-input" min={form.start_date} value={form.end_date} onChange={bind('end_date')} required /></Field>
                <Field label="Reason" span><textarea className="form-textarea" value={form.reason} onChange={bind('reason')} placeholder="Optional note for your manager" /></Field>
            </div>
        </FormModal>
    );
}

// ============================================================
// Attendance
// ============================================================
function EmployeeAttendance({ employeeId }) {
    const attendance = useFetch(`/api/hr/attendance?employee_id=${employeeId}`, []);
    const count = (s) => attendance.data.filter(a => a.status === s).length;

    return (
        <div className="stack">
            <div className="grid-2">
                <CheckInCard employeeId={employeeId} />
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                    <StatCard label="Present" value={count('Present')} tone="success" />
                    <StatCard label="Late" value={count('Late')} tone="warning" />
                    <StatCard label="Absent" value={count('Absent')} tone="danger" />
                </div>
            </div>
            <Panel title="Attendance history" subtitle="Last 60 records" icon={Clock} flush>
                <ErrorNote message={attendance.error} onRetry={attendance.reload} />
                {attendance.loading ? <Loading /> : attendance.data.length === 0 ? (
                    <EmptyState icon={Clock} title="No attendance yet" hint="Use Check in to record your first day." />
                ) : (
                    <div className="table-container">
                        <table className="data-table compact">
                            <thead><tr><th>Date</th><th>Check in</th><th>Check out</th><th className="num">Hours</th><th>Status</th></tr></thead>
                            <tbody>
                                {attendance.data.map(a => (
                                    <tr key={a.attendance_id}>
                                        <td>{fmtDate(a.date)}</td>
                                        <td className="mono">{a.check_in || '—'}</td>
                                        <td className="mono">{a.check_out || '—'}</td>
                                        <td className="num">{hoursBetween(a.check_in, a.check_out)}</td>
                                        <td><StatusBadge status={a.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>
        </div>
    );
}

// ============================================================
// Payroll
// ============================================================
function EmployeePayroll({ employeeId }) {
    const { user } = useAuth();
    const payroll = useFetch(`/api/dashboard/employee/payroll?employee_id=${employeeId}`, []);
    const [slip, setSlip] = useState(null);
    const ytd = payroll.data.filter(p => p.status === 'Paid' && p.year === new Date().getFullYear()).reduce((s, p) => s + p.net_salary, 0);

    return (
        <div className="stack">
            <div className="stats-grid">
                <StatCard label="Net pay this year" value={fmtMoney(ytd)} meta="Paid payslips only" icon={Wallet} tone="success" />
                <StatCard label="Payslips" value={payroll.data.length} meta={`${payroll.data.filter(p => p.status !== 'Paid').length} pending`} icon={Wallet} />
            </div>
            <Panel title="Payslips" icon={Wallet} flush>
                {payroll.loading ? <Loading /> : payroll.data.length === 0 ? (
                    <EmptyState icon={Wallet} title="No payslips yet" hint="Payslips appear once HR runs payroll." />
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead><tr><th>Period</th><th className="num">Basic</th><th className="num">Bonus</th><th className="num">Deductions</th><th className="num">Net pay</th><th>Paid on</th><th>Status</th><th /></tr></thead>
                            <tbody>
                                {payroll.data.map(p => (
                                    <tr key={p.payroll_id}>
                                        <td className="strong">{MONTHS[p.month - 1]} {p.year}</td>
                                        <td className="num">{fmtMoney(p.basic_salary, 2)}</td>
                                        <td className="num text-success">{p.bonus ? `+${fmtMoney(p.bonus, 2)}` : '—'}</td>
                                        <td className="num text-danger">{p.deductions ? `−${fmtMoney(p.deductions, 2)}` : '—'}</td>
                                        <td className="num strong">{fmtMoney(p.net_salary, 2)}</td>
                                        <td className="text-sm muted">{fmtDate(p.payment_date)}</td>
                                        <td><StatusBadge status={p.status} /></td>
                                        <td className="right"><button className="btn btn-ghost btn-sm" onClick={() => setSlip(p)}>View</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>

            {slip && (
                <Modal title={`Payslip · ${MONTHS[slip.month - 1]} ${slip.year}`} subtitle={`${user.name} · ${code('EMP', employeeId)}`} onClose={() => setSlip(null)} size="sm"
                    footer={<button className="btn btn-outline" onClick={() => window.print()}><Printer size={15} /> Print</button>}>
                    <div className="modal-body">
                        <table className="data-table compact">
                            <tbody>
                                <tr><td>Basic salary</td><td className="num">{fmtMoney(slip.basic_salary, 2)}</td></tr>
                                <tr><td>Bonus</td><td className="num text-success">+{fmtMoney(slip.bonus || 0, 2)}</td></tr>
                                <tr><td>Deductions</td><td className="num text-danger">−{fmtMoney(slip.deductions || 0, 2)}</td></tr>
                                <tr><td className="strong">Net pay</td><td className="num strong" style={{ fontSize: '1rem' }}>{fmtMoney(slip.net_salary, 2)}</td></tr>
                            </tbody>
                        </table>
                        <div className="row-between text-sm muted" style={{ marginTop: '1rem' }}>
                            <StatusBadge status={slip.status} />
                            <span>{slip.payment_date ? `Paid ${fmtDate(slip.payment_date)}` : 'Not yet paid'}</span>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

// ============================================================
// Assets
// ============================================================
function EmployeeAssets({ employeeId }) {
    const assets = useFetch(`/api/dashboard/employee/assets?employee_id=${employeeId}`, []);
    if (assets.loading) return <Loading />;
    if (assets.data.length === 0) return <div className="card"><EmptyState icon={Laptop} title="No assets assigned" hint="Equipment issued to you by IT will be listed here." /></div>;

    return (
        <div className="grid-cards">
            {assets.data.map(a => (
                <div key={a.asset_id} className="card stack-sm">
                    <div className="row">
                        <div className="stat-icon tone-primary"><Laptop size={18} /></div>
                        <div className="grow">
                            <div className="strong">{a.name}</div>
                            <div className="text-sm muted">{a.category}</div>
                        </div>
                    </div>
                    <div className="row-between text-sm" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem', marginTop: '0.3rem' }}>
                        <span className="muted mono">{code('AST', a.asset_id)} · {fmtDate(a.purchase_date)}</span>
                        <StatusBadge status={a.status} />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================
// Profile
// ============================================================
function EmployeeProfile({ employeeId }) {
    const { user } = useAuth();
    const profile = useFetch(`/api/dashboard/employee/profile?employee_id=${employeeId}`, null);
    const [editing, setEditing] = useState(false);

    if (profile.loading) return <Loading />;
    const p = profile.data;
    if (!p) return <ErrorNote message="Profile not found" />;

    const item = (label, value) => <div><div className="kv-label">{label}</div><div className="kv-value">{value || '—'}</div></div>;

    return (
        <Panel title="Personal information" icon={User} actions={<button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}><Pencil size={14} /> Edit</button>}>
            <div className="row" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                <Avatar name={`${p.first_name} ${p.last_name}`} size="lg" />
                <div>
                    <div className="strong" style={{ fontSize: '1.15rem' }}>{p.first_name} {p.last_name}</div>
                    <div className="muted text-sm">{user.email} · <span className="mono">{code('EMP', p.employee_id)}</span></div>
                </div>
            </div>
            <div className="kv-grid">
                {item('Phone', p.phone)}
                {item('Date of birth', fmtDate(p.dob))}
                {item('Gender', p.gender)}
                {item('Joined', fmtDate(p.joining_date))}
                {item('Annual salary', fmtMoney(p.salary))}
                {item('Address', p.address)}
            </div>

            {editing && <ProfileModal profile={p} onClose={() => setEditing(false)} onSaved={profile.reload} />}
        </Panel>
    );
}

function ProfileModal({ profile, onClose, onSaved }) {
    const run = useAction();
    const [form, bind] = useForm({ phone: profile.phone || '', dob: profile.dob || '', gender: profile.gender || '', address: profile.address || '' });
    const submit = async () => {
        if (await run(() => api.put('/api/dashboard/employee/profile', { ...form, employee_id: profile.employee_id }), 'Profile updated')) { onSaved(); onClose(); }
    };
    return (
        <FormModal title="Edit personal details" subtitle="Name, salary and role are managed by HR." onClose={onClose} onSubmit={submit}>
            <div className="form-grid">
                <Field label="Phone"><input className="form-input" value={form.phone} onChange={bind('phone')} /></Field>
                <Field label="Date of birth"><input type="date" className="form-input" value={form.dob} onChange={bind('dob')} /></Field>
                <Field label="Gender">
                    <select className="form-select" value={form.gender} onChange={bind('gender')}>
                        <option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Other</option>
                    </select>
                </Field>
                <Field label="Address" span><textarea className="form-textarea" value={form.address} onChange={bind('address')} /></Field>
            </div>
        </FormModal>
    );
}
