import React, { useState } from 'react';
import { Calendar, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Panel, StatusBadge, EmptyState, Loading, ErrorNote, Avatar, api, useAction, fmtDate, fullName } from './ui';

// Leave approvals for a manager's direct reports. `leaves` is a useFetch() result owned by
// the parent so the pending count in the tab header stays in sync.
export default function LeaveRequests({ leaves }) {
    const { user } = useAuth();
    const run = useAction();
    const [filter, setFilter] = useState('Pending');
    const { data, loading, error, reload } = leaves;

    const handleAction = async (leave, status) => {
        const ok = await run(
            () => api.put(`/api/hr/leaves/${leave.leave_id}`, { status, manager_id: user.employee_id }),
            `${leave.first_name}'s leave ${status.toLowerCase()}`
        );
        if (ok) reload();
    };

    const visible = filter === 'All' ? data : data.filter(l => l.status === filter);
    const count = (s) => data.filter(l => l.status === s).length;

    return (
        <Panel
            title="Leave requests"
            subtitle="Approving or rejecting notifies the employee in the same transaction"
            icon={Calendar}
            flush
            actions={
                <div className="segmented">
                    {['Pending', 'Approved', 'Rejected', 'All'].map(s => (
                        <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>
                            {s}{s !== 'All' ? ` (${count(s)})` : ''}
                        </button>
                    ))}
                </div>
            }
        >
            <ErrorNote message={error} onRetry={reload} />
            {loading ? <Loading /> : visible.length === 0 ? (
                <EmptyState icon={Calendar} title={filter === 'Pending' ? 'Nothing waiting on you' : 'No requests'} hint={filter === 'Pending' ? 'New leave requests from your reports will appear here.' : undefined} />
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr><th>Employee</th><th>Type</th><th>Dates</th><th className="num">Days</th><th>Reason</th><th>Status</th><th /></tr>
                        </thead>
                        <tbody>
                            {visible.map(l => (
                                <tr key={l.leave_id}>
                                    <td>
                                        <div className="row"><Avatar name={fullName(l)} size="sm" /><span className="cell-main">{fullName(l)}</span></div>
                                    </td>
                                    <td>{l.leave_type}</td>
                                    <td className="nowrap text-sm">{fmtDate(l.start_date)} → {fmtDate(l.end_date)}</td>
                                    <td className="num">{l.days}</td>
                                    <td className="text-sm muted" style={{ maxWidth: 260 }}><div className="truncate" title={l.reason}>{l.reason || '—'}</div></td>
                                    <td>
                                        <StatusBadge status={l.status} />
                                        {l.approver_first && l.status !== 'Pending' && <div className="cell-sub">by {l.approver_first} {l.approver_last}</div>}
                                    </td>
                                    <td>
                                        {l.status === 'Pending' && (
                                            <div className="row-actions" style={{ gap: '0.35rem' }}>
                                                <button className="btn btn-sm btn-success" onClick={() => handleAction(l, 'Approved')}><Check size={14} /> Approve</button>
                                                <button className="btn btn-sm btn-outline" onClick={() => handleAction(l, 'Rejected')}><X size={14} /> Reject</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Panel>
    );
}
