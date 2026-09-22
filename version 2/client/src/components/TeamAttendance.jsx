import React, { useState, useEffect } from 'react';
import { Clock, Check, X, AlertTriangle, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TeamAttendance() {
    const { user } = useAuth();
    const [attendance, setAttendance] = useState([]);
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        check_in: '09:00',
        check_out: '17:00',
        status: 'Present'
    });

    const fetchData = async () => {
        if (!user || !user.employee_id) return;
        try {
            const [attRes, teamRes] = await Promise.all([
                fetch(`/api/hr/attendance?manager_id=${user.employee_id}`),
                fetch(`/api/employees/my-team?manager_id=${user.employee_id}`)
            ]);
            if (attRes.ok) setAttendance(await attRes.json());
            if (teamRes.ok) setTeam(await teamRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleLogAttendance = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/hr/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowForm(false);
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>LOADING...</div>;

    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Clock className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                    <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: '800', textTransform: 'uppercase' }}>Team Attendance (Last 7 Days)</h2>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : <><Plus className="w-4 h-4 mr-1 inline-block" /> Log Attendance</>}
                </button>
            </div>
            
            {showForm && (
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-page)' }}>
                    <form onSubmit={handleLogAttendance} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                        <div>
                            <label className="block text-xs font-mono text-muted mb-1 uppercase">Employee</label>
                            <select className="form-select" value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})} required>
                                <option value="">Select Employee</option>
                                {team.map(t => <option key={t.employee_id} value={t.employee_id}>{t.first_name} {t.last_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-muted mb-1 uppercase">Date</label>
                            <input type="date" className="form-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-muted mb-1 uppercase">Check In</label>
                            <input type="time" className="form-input" value={formData.check_in} onChange={e => setFormData({...formData, check_in: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-muted mb-1 uppercase">Check Out</label>
                            <input type="time" className="form-input" value={formData.check_out} onChange={e => setFormData({...formData, check_out: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-muted mb-1 uppercase">Status</label>
                            <select className="form-select" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} required>
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                                <option value="Late">Late</option>
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1rem' }}>Save</button>
                    </form>
                </div>
            )}

            {attendance.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontSize: '0.85rem' }}>NO RECENT ATTENDANCE RECORDS FOUND.</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>DATE</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>EMPLOYEE</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>CHECK IN</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>CHECK OUT</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.map((record) => (
                                <tr key={record.attendance_id} style={{ borderBottom: '1px solid var(--border-color)' }} className="hover:bg-white/5">
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'var(--text-main)' }}>
                                        {new Date(record.date).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ fontWeight: '600' }}>{record.first_name} {record.last_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: EMP-{record.employee_id.toString().padStart(4, '0')}</div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                        {record.check_in || '--:--'}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                        {record.check_out || '--:--'}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{ 
                                            display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', width: 'fit-content',
                                            border: record.status === 'Present' ? '1px solid var(--success)' : (record.status === 'Absent' ? '1px solid var(--danger)' : '1px solid var(--warning)'),
                                            color: record.status === 'Present' ? 'var(--success)' : (record.status === 'Absent' ? 'var(--danger)' : 'var(--warning)')
                                        }}>
                                            {record.status === 'Present' && <Check className="w-3 h-3" />}
                                            {record.status === 'Absent' && <X className="w-3 h-3" />}
                                            {record.status === 'Late' && <AlertTriangle className="w-3 h-3" />}
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
