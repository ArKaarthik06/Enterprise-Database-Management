import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Circle, Clock, Check, Plus, AlertCircle, FileText, CalendarCheck, Star, Wallet, Laptop, User } from 'lucide-react';

export default function EmployeeDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('tasks');
    const tabs = [
        { id: 'tasks', label: 'My Tasks', icon: CheckCircle2 },
        { id: 'leaves', label: 'Leave Requests', icon: Clock },
        { id: 'attendance_reviews', label: 'Attendance & Reviews', icon: Star },
        { id: 'payroll', label: 'My Payroll', icon: Wallet },
        { id: 'assets', label: 'My Assets', icon: Laptop },
        { id: 'profile', label: 'My Profile', icon: User }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2rem', background: 'var(--bg-page)', color: 'var(--text-main)', overflowY: 'auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '2rem', textTransform: 'uppercase', color: 'var(--primary)', margin: 0, textShadow: 'var(--shadow-glow)' }}>
                    Employee Portal
                </h2>
                <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Welcome back, {user?.name}. Manage your daily tasks, leaves, and performance.</p>
            </div>

            <div style={{ display: 'flex', borderBottom: '2px solid var(--border-color)', marginBottom: '2rem' }}>
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                background: isActive ? 'var(--primary)' : 'transparent',
                                color: isActive ? 'var(--primary-text)' : 'var(--text-muted)',
                                border: 'none',
                                borderTop: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                                borderRight: '1px solid var(--border-color)',
                                padding: '1rem 1.5rem',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            className="hover:bg-white/10"
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div style={{ flex: 1 }}>
                {activeTab === 'tasks' && <EmployeeTasks employeeId={user?.employee_id} />}
                {activeTab === 'leaves' && <EmployeeLeaves employeeId={user?.employee_id} />}
                {activeTab === 'attendance_reviews' && <EmployeeAttendanceReviews employeeId={user?.employee_id} />}
                {activeTab === 'payroll' && <EmployeePayroll employeeId={user?.employee_id} />}
                {activeTab === 'assets' && <EmployeeAssets employeeId={user?.employee_id} />}
                {activeTab === 'profile' && <EmployeeProfile employeeId={user?.employee_id} />}
            </div>
        </div>
    );
}

function EmployeeTasks({ employeeId }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (employeeId) {
            fetch(`/api/projects/employee-tasks?employee_id=${employeeId}`)
                .then(res => res.json())
                .then(data => { setTasks(data); setLoading(false); })
                .catch(err => { console.error(err); setLoading(false); });
        }
    }, [employeeId]);

    const handleToggleStatus = async (taskId, currentStatus) => {
        const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
        try {
            const res = await fetch(`/api/projects/tasks/${taskId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setTasks(tasks.map(t => t.task_id === taskId ? { ...t, status: newStatus } : t));
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Loading tasks...</div>;

    if (tasks.length === 0) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                <CheckCircle2 className="w-8 h-8 opacity-50 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>No tasks assigned to you.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tasks.map(task => (
                <div key={task.task_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => handleToggleStatus(task.task_id, task.status)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.status === 'Completed' ? 'var(--success)' : 'var(--text-muted)' }}>
                            {task.status === 'Completed' ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                        </button>
                        <div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 800, color: task.status === 'Completed' ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: task.status === 'Completed' ? 'line-through' : 'none' }}>
                                {task.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                                Project: {task.project_name} • Priority: {task.priority}
                            </div>
                        </div>
                    </div>
                    {task.due_date && (
                        <div style={{ fontSize: '0.75rem', color: new Date(task.due_date) < new Date() && task.status !== 'Completed' ? 'var(--danger)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            Due: {task.due_date}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function EmployeeLeaves({ employeeId }) {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ leave_type: 'Sick Leave', start_date: '', end_date: '', reason: '' });

    const fetchLeaves = () => {
        if (employeeId) {
            fetch(`/api/dashboard/employee/leaves?employee_id=${employeeId}`)
                .then(res => res.json())
                .then(data => { setLeaves(data); setLoading(false); })
                .catch(err => { console.error(err); setLoading(false); });
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, [employeeId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/dashboard/employee/request-leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, employee_id: employeeId })
            });
            if (res.ok) {
                setShowForm(false);
                setFormData({ leave_type: 'Sick Leave', start_date: '', end_date: '', reason: '' });
                fetchLeaves();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading leaves...</div>;

    return (
        <div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                    {showForm ? 'Cancel' : <><Plus className="w-4 h-4 mr-1" /> Request Leave</>}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} style={{ background: 'var(--bg-card)', padding: '1.5rem', border: '1px solid var(--primary)', marginBottom: '2rem', boxShadow: 'var(--shadow-glow)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label className="form-label">Leave Type</label>
                            <select className="form-input" value={formData.leave_type} onChange={e => setFormData({...formData, leave_type: e.target.value})}>
                                <option>Sick Leave</option>
                                <option>Casual Leave</option>
                                <option>Maternity Leave</option>
                                <option>Paternity Leave</option>
                                <option>Annual Leave</option>
                            </select>
                        </div>
                        <div></div>
                        <div>
                            <label className="form-label">Start Date</label>
                            <input type="date" required className="form-input" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                        </div>
                        <div>
                            <label className="form-label">End Date</label>
                            <input type="date" required className="form-input" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">Reason</label>
                            <input type="text" required className="form-input" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary">Submit Request</button>
                </form>
            )}

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--bg-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        <tr>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Type</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Dates</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Reason</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaves.length === 0 ? (
                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>No leave requests found.</td></tr>
                        ) : leaves.map(leave => (
                            <tr key={leave.leave_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '1rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{leave.leave_type}</td>
                                <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{leave.start_date} to {leave.end_date}</td>
                                <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{leave.reason}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ 
                                        padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                                        color: leave.status === 'Approved' ? 'var(--success)' : leave.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)',
                                        border: `1px solid ${leave.status === 'Approved' ? 'var(--success)' : leave.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)'}`
                                    }}>
                                        {leave.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function EmployeeAttendanceReviews({ employeeId }) {
    const [attendance, setAttendance] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (employeeId) {
            Promise.all([
                fetch(`/api/hr/attendance?employee_id=${employeeId}`).then(r => r.json()),
                fetch(`/api/hr/reviews?employee_id=${employeeId}`).then(r => r.json())
            ])
            .then(([attData, revData]) => {
                setAttendance(attData);
                setReviews(revData);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
        }
    }, [employeeId]);

    if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading records...</div>;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Attendance Log */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-subtle)' }}>
                    <h3 style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CalendarCheck className="w-5 h-5 text-primary" /> Recent Attendance
                    </h3>
                </div>
                <div style={{ padding: '1rem' }}>
                    {attendance.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No records.</p> : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {attendance.slice(0, 5).map(att => (
                                <li key={att.attendance_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                                    <span>{att.date}</span>
                                    <span style={{ color: att.status === 'Present' ? 'var(--success)' : 'var(--warning)' }}>{att.status}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>{att.check_in || '--:--'} - {att.check_out || '--:--'}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Performance Reviews */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-subtle)' }}>
                    <h3 style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Star className="w-5 h-5 text-primary" /> Performance Reviews
                    </h3>
                </div>
                <div style={{ padding: '1rem' }}>
                    {reviews.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No reviews.</p> : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {reviews.map(rev => (
                                <li key={rev.review_id} style={{ padding: '1rem', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                                        <span style={{ color: 'var(--primary)', fontWeight: 800 }}>Rating: {rev.rating}/5.0</span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{rev.review_date}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                                        "{rev.comments}"
                                    </p>
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                        Reviewer: {rev.reviewer_first_name} {rev.reviewer_last_name}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

function EmployeePayroll({ employeeId }) {
    const [payroll, setPayroll] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (employeeId) {
            fetch(`/api/dashboard/employee/payroll?employee_id=${employeeId}`)
                .then(res => res.json())
                .then(data => { setPayroll(data); setLoading(false); })
                .catch(err => { console.error(err); setLoading(false); });
        }
    }, [employeeId]);

    if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading payroll...</div>;

    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'var(--bg-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    <tr>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Month/Year</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Basic Salary</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Net Salary</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Payment Date</th>
                        <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {payroll.length === 0 ? (
                        <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>No payroll records found.</td></tr>
                    ) : payroll.map(p => (
                        <tr key={p.payroll_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '1rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                                {p.month}/{p.year}
                            </td>
                            <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)' }}>${p.basic_salary}</td>
                            <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>${p.net_salary}</td>
                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{p.payment_date || '-'}</td>
                            <td style={{ padding: '1rem' }}>
                                <span style={{ 
                                    padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                                    color: p.status === 'Paid' ? 'var(--success)' : 'var(--warning)',
                                    border: `1px solid ${p.status === 'Paid' ? 'var(--success)' : 'var(--warning)'}`
                                }}>
                                    {p.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function EmployeeAssets({ employeeId }) {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (employeeId) {
            fetch(`/api/dashboard/employee/assets?employee_id=${employeeId}`)
                .then(res => res.json())
                .then(data => { setAssets(data); setLoading(false); })
                .catch(err => { console.error(err); setLoading(false); });
        }
    }, [employeeId]);

    if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading assets...</div>;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {assets.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                    <Laptop className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                    <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>No assets assigned to you.</p>
                </div>
            ) : assets.map(asset => (
                <div key={asset.asset_id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: '4px' }}>
                            <Laptop className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 style={{ fontFamily: 'var(--font-mono)', margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 800 }}>{asset.name}</h3>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>{asset.category}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Acquired: {asset.purchase_date || 'N/A'}</span>
                        <span style={{ 
                            fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', padding: '0.2rem 0.5rem',
                            background: asset.status === 'In Use' ? 'rgba(46, 125, 50, 0.1)' : 'transparent',
                            color: asset.status === 'In Use' ? 'var(--success)' : 'var(--text-muted)',
                            border: `1px solid ${asset.status === 'In Use' ? 'var(--success)' : 'var(--border-color)'}`
                        }}>
                            {asset.status}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmployeeProfile({ employeeId }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});

    const fetchProfile = () => {
        if (employeeId) {
            setLoading(true);
            fetch(`/api/dashboard/employee/profile?employee_id=${employeeId}`)
                .then(res => res.json())
                .then(data => { 
                    setProfile(data); 
                    setFormData(data);
                    setLoading(false); 
                })
                .catch(err => { console.error(err); setLoading(false); });
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [employeeId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/dashboard/employee/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, employee_id: employeeId })
            });
            if (res.ok) {
                setEditMode(false);
                fetchProfile();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading profile...</div>;
    if (!profile) return <div style={{ color: 'var(--text-muted)' }}>Profile not found.</div>;

    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '2rem', maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h3 style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, margin: 0, fontSize: '1.5rem', color: 'var(--primary)' }}>Personal Information</h3>
                {!editMode && (
                    <button onClick={() => setEditMode(true)} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Edit Profile</button>
                )}
            </div>

            {editMode ? (
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label className="form-label">First Name</label>
                        <input type="text" className="form-input" value={profile.first_name} disabled style={{ opacity: 0.7 }} />
                    </div>
                    <div>
                        <label className="form-label">Last Name</label>
                        <input type="text" className="form-input" value={profile.last_name} disabled style={{ opacity: 0.7 }} />
                    </div>
                    <div>
                        <label className="form-label">Phone</label>
                        <input type="text" className="form-input" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div>
                        <label className="form-label">Date of Birth</label>
                        <input type="date" className="form-input" value={formData.dob || ''} onChange={e => setFormData({...formData, dob: e.target.value})} />
                    </div>
                    <div>
                        <label className="form-label">Gender</label>
                        <select className="form-input" value={formData.gender || ''} onChange={e => setFormData({...formData, gender: e.target.value})}>
                            <option value="">Select...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Address</label>
                        <textarea className="form-input" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} rows="3"></textarea>
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button type="button" onClick={() => { setEditMode(false); setFormData(profile); }} className="btn" style={{ background: 'var(--bg-subtle)', color: 'var(--text-main)' }}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontFamily: 'var(--font-mono)' }}>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Full Name</div>
                        <div style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{profile.first_name} {profile.last_name}</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Employee ID</div>
                        <div style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>EMP-{profile.employee_id}</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Phone</div>
                        <div style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{profile.phone || 'N/A'}</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Date of Birth</div>
                        <div style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{profile.dob || 'N/A'}</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Gender</div>
                        <div style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{profile.gender || 'N/A'}</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Joining Date</div>
                        <div style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{profile.joining_date || 'N/A'}</div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Address</div>
                        <div style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{profile.address || 'N/A'}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
