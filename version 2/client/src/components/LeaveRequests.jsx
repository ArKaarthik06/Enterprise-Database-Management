import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LeaveRequests() {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaves = async () => {
        if (!user || !user.employee_id) return;
        try {
            const res = await fetch(`/api/hr/leaves?manager_id=${user.employee_id}`);
            if (res.ok) {
                const data = await res.json();
                setLeaves(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, [user]);

    const handleAction = async (leaveId, status) => {
        try {
            const res = await fetch(`/api/hr/leaves/${leaveId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, manager_id: user.employee_id })
            });
            if (res.ok) {
                fetchLeaves();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>LOADING...</div>;

    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-subtle)' }}>
                <Calendar className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: '800', textTransform: 'uppercase' }}>Leave Requests</h2>
            </div>
            {leaves.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontSize: '0.85rem' }}>NO PENDING LEAVE REQUESTS.</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>EMPLOYEE</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>DATES & TYPE</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>REASON</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>STATUS</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaves.map((l) => (
                                <tr key={l.leave_id} style={{ borderBottom: '1px solid var(--border-color)' }} className="hover:bg-white/5">
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>
                                        {l.first_name} {l.last_name}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ fontWeight: '600', color: 'var(--primary)' }}>{l.leave_type}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                                            <Clock className="w-3 h-3" /> {new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={l.reason}>
                                        {l.reason || 'N/A'}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{ 
                                            display: 'inline-block', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase',
                                            border: l.status === 'Approved' ? '1px solid var(--success)' : (l.status === 'Rejected' ? '1px solid var(--danger)' : '1px solid var(--warning)'),
                                            color: l.status === 'Approved' ? 'var(--success)' : (l.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)')
                                        }}>
                                            {l.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        {l.status === 'Pending' && (
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button onClick={() => handleAction(l.leave_id, 'Approved')} style={{ 
                                                    background: 'transparent', border: '1px solid var(--success)', color: 'var(--success)', 
                                                    padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }} title="Approve">
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleAction(l.leave_id, 'Rejected')} style={{ 
                                                    background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', 
                                                    padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }} title="Reject">
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
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
