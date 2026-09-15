import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, FileText, CheckCircle, Clock, Calendar, Check, X, ShieldAlert } from 'lucide-react';

export default function RoleDashboard() {
    const { user, token } = useAuth();
    
    const [subordinates, setSubordinates] = useState([]);
    const [pendingLeaves, setPendingLeaves] = useState([]);
    const [myLeaves, setMyLeaves] = useState([]);
    const [unassignedProjects, setUnassignedProjects] = useState([]);
    const [teamsList, setTeamsList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [leaveForm, setLeaveForm] = useState({
        leave_type: 'Sick Leave',
        start_date: '',
        end_date: '',
        reason: ''
    });


    
    const [selectedTeams, setSelectedTeams] = useState({}); // map of project_id -> team_id

    const isManager = user?.role?.includes('Manager') || user?.role === 'Admin';
    const employeeId = user?.employee_id;

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                if (isManager) {
                    if (employeeId) {
                        const subRes = await fetch(`/api/dashboard/manager/subordinates?employee_id=${employeeId}`);
                        const levRes = await fetch(`/api/dashboard/manager/leaves?employee_id=${employeeId}`);
                        setSubordinates(await subRes.json());
                        setPendingLeaves(await levRes.json());
                    }
                    const projRes = await fetch('/api/dashboard/manager/unassigned-projects');
                    const teamsRes = await fetch('/api/dashboard/manager/teams');
                    setUnassignedProjects(await projRes.json());
                    setTeamsList(await teamsRes.json());
                } else {
                    if (employeeId) {
                        const levRes = await fetch(`/api/dashboard/employee/leaves?employee_id=${employeeId}`);
                        setMyLeaves(await levRes.json());
                    }
                }
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user, employeeId, isManager]);

    const submitLeaveRequest = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/dashboard/employee/request-leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee_id: employeeId,
                    ...leaveForm
                })
            });
            if (res.ok) {
                alert("Leave request submitted successfully (Atomic Transaction).");
                setLeaveForm({ leave_type: 'Sick Leave', start_date: '', end_date: '', reason: '' });
                // Refresh leaves
                const levRes = await fetch(`/api/dashboard/employee/leaves?employee_id=${employeeId}`);
                setMyLeaves(await levRes.json());
            }
        } catch (err) {
            console.error(err);
        }
    };

    const approveLeave = async (leaveId) => {
        try {
            const res = await fetch('/api/dashboard/manager/approve-leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leave_id: leaveId, manager_id: employeeId })
            });
            if (res.ok) {
                alert("Leave approved successfully (Atomic Transaction).");
                setPendingLeaves(pendingLeaves.filter(l => l.leave_id !== leaveId));
            }
        } catch (err) {
            console.error(err);
        }
    };



    const assignTeam = async (projectId) => {
        const teamId = selectedTeams[projectId];
        if (!teamId) {
            alert("Please select a team first.");
            return;
        }
        try {
            const res = await fetch('/api/dashboard/manager/assign-team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_id: projectId, team_id: teamId, manager_id: employeeId })
            });
            if (res.ok) {
                alert("Team assigned successfully.");
                setUnassignedProjects(unassignedProjects.filter(p => p.project_id !== projectId));
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (!user) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
                <ShieldAlert className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Sign in required</h2>
                <p style={{ color: 'var(--text-muted)' }}>Please log in to view your role dashboard.</p>
            </div>
        );
    }

    if (!employeeId && user.role !== 'Admin') {
        return (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
                <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>System Account</h2>
                <p style={{ color: 'var(--text-muted)' }}>This user ({user.username}) is not linked to a proper profile in the database.</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    {isManager ? 'Manager Dashboard' : 'Employee Portal'}
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    Welcome back, {user.name}. You are logged in as <strong style={{ color: 'var(--primary)' }}>{user.role}</strong>.
                </p>
            </div>

            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading simulation...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* MANAGER VIEW */}
                    {isManager && (
                        <>
                            {/* Subordinates Panel */}
                            <div className="card" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    <Users className="w-5 h-5 text-indigo-500" />
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>My Direct Reports</h3>
                                </div>
                                <div className="table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Department</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {subordinates.length > 0 ? subordinates.map(sub => (
                                                <tr key={sub.employee_id}>
                                                    <td>{sub.first_name} {sub.last_name}</td>
                                                    <td>{sub.department || 'N/A'}</td>
                                                    <td>
                                                        <span className={`badge ${sub.status === 'Active' ? 'badge-emerald' : 'badge-slate'}`}>
                                                            {sub.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No subordinates found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Pending Approvals Panel */}
                            <div className="card" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    <Clock className="w-5 h-5 text-amber-500" />
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Action Required: Leave Requests</h3>
                                </div>
                                <div className="table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Employee</th>
                                                <th>Dates</th>
                                                <th>Type</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingLeaves.length > 0 ? pendingLeaves.map(leave => (
                                                <tr key={leave.leave_id}>
                                                    <td>{leave.first_name} {leave.last_name}</td>
                                                    <td style={{ fontSize: '0.85rem' }}>{leave.start_date} to {leave.end_date}</td>
                                                    <td>{leave.leave_type}</td>
                                                    <td>
                                                        <button 
                                                            onClick={() => approveLeave(leave.leave_id)}
                                                            className="btn btn-primary btn-sm"
                                                            style={{ padding: '0.2rem 0.5rem' }}
                                                        >
                                                            <Check className="w-4 h-4" /> Approve
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No pending requests.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* EMPLOYEE VIEW */}
                    {!isManager && (
                        <>
                            {/* Request Leave Form */}
                            <div className="card" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    <Calendar className="w-5 h-5 text-indigo-500" />
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Request Time Off</h3>
                                </div>
                                <form onSubmit={submitLeaveRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Leave Type</label>
                                        <select 
                                            className="form-input" 
                                            value={leaveForm.leave_type} 
                                            onChange={e => setLeaveForm({...leaveForm, leave_type: e.target.value})}
                                        >
                                            <option>Sick Leave</option>
                                            <option>Annual Leave</option>
                                            <option>Unpaid Leave</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">Start Date</label>
                                            <input type="date" className="form-input" required 
                                                value={leaveForm.start_date} 
                                                onChange={e => setLeaveForm({...leaveForm, start_date: e.target.value})} />
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">End Date</label>
                                            <input type="date" className="form-input" required 
                                                value={leaveForm.end_date} 
                                                onChange={e => setLeaveForm({...leaveForm, end_date: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Reason</label>
                                        <input type="text" className="form-input" placeholder="Brief reason..." required
                                            value={leaveForm.reason} 
                                            onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} />
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                                        Submit Request
                                    </button>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                        This operation demonstrates ACID Atomicity via backend transactions.
                                    </p>
                                </form>
                            </div>

                            {/* My Leaves */}
                            <div className="card" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    <FileText className="w-5 h-5 text-emerald-500" />
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>My Leave History</h3>
                                </div>
                                <div className="table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Type</th>
                                                <th>Duration</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myLeaves.length > 0 ? myLeaves.map(leave => (
                                                <tr key={leave.leave_id}>
                                                    <td>{leave.leave_type}</td>
                                                    <td style={{ fontSize: '0.85rem' }}>{leave.start_date} to {leave.end_date}</td>
                                                    <td>
                                                        <span className={`badge ${
                                                            leave.status === 'Approved' ? 'badge-emerald' : 
                                                            leave.status === 'Pending' ? 'badge-amber' : 'badge-slate'
                                                        }`}>
                                                            {leave.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No leave history.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
