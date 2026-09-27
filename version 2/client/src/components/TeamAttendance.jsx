import React, { useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Panel, StatusBadge, EmptyState, Loading, Avatar, FormModal, Field, useFetch, useForm, useAction, api, fmtDate, fullName, todayISO } from './ui';

export default function TeamAttendance({ team = [] }) {
    const { user } = useAuth();
    const attendance = useFetch(`/api/hr/attendance?manager_id=${user.employee_id}`, []);
    const [showForm, setShowForm] = useState(false);

    const todays = attendance.data.filter(a => a.date === todayISO());
    const summary = ['Present', 'Late', 'Absent'].map(s => ({ s, n: todays.filter(a => a.status === s).length }));
    const notLogged = team.filter(e => e.status === 'Active' && !todays.some(a => a.employee_id === e.employee_id));

    return (
        <Panel
            title="Team attendance"
            subtitle={`Today: ${summary.map(x => `${x.n} ${x.s.toLowerCase()}`).join(' · ')}${notLogged.length ? ` · ${notLogged.length} not checked in` : ''}`}
            icon={Clock}
            flush
            actions={<button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={15} /> Log attendance</button>}
        >
            {attendance.loading ? <Loading /> : attendance.data.length === 0 ? (
                <EmptyState icon={Clock} title="No attendance records" hint="Records appear when your reports check in from My workspace, or when you log them here." />
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr><th>Date</th><th>Employee</th><th>Check in</th><th>Check out</th><th className="num">Hours</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {attendance.data.map(r => (
                                <tr key={r.attendance_id}>
                                    <td className="nowrap">{fmtDate(r.date)}</td>
                                    <td><div className="row"><Avatar name={fullName(r)} size="sm" />{fullName(r)}</div></td>
                                    <td className="mono">{r.check_in || '—'}</td>
                                    <td className="mono">{r.check_out || '—'}</td>
                                    <td className="num">{hoursBetween(r.check_in, r.check_out)}</td>
                                    <td><StatusBadge status={r.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && <AttendanceModal team={team} onClose={() => setShowForm(false)} onSaved={attendance.reload} />}
        </Panel>
    );
}

export function hoursBetween(a, b) {
    if (!a || !b) return '—';
    const [ah, am] = a.split(':').map(Number);
    const [bh, bm] = b.split(':').map(Number);
    const mins = (bh * 60 + bm) - (ah * 60 + am);
    return mins > 0 ? (mins / 60).toFixed(1) : '—';
}

function AttendanceModal({ team, onClose, onSaved }) {
    const run = useAction();
    const [form, bind] = useForm({ employee_id: '', date: todayISO(), check_in: '09:00', check_out: '17:00', status: 'Present' });

    const submit = async () => {
        const payload = form.status === 'Absent' ? { ...form, check_in: null, check_out: null } : form;
        if (await run(() => api.post('/api/hr/attendance', payload), (r) => r.message)) { onSaved(); onClose(); }
    };

    return (
        <FormModal title="Log attendance" subtitle="If a record already exists for that day it is corrected, not duplicated." onClose={onClose} onSubmit={submit}>
            <div className="form-grid">
                <Field label="Employee" required span>
                    <select className="form-select" value={form.employee_id} onChange={bind('employee_id')} required>
                        <option value="">Select employee…</option>
                        {team.map(t => <option key={t.employee_id} value={t.employee_id}>{fullName(t)}</option>)}
                    </select>
                </Field>
                <Field label="Date" required><input type="date" className="form-input" value={form.date} onChange={bind('date')} required /></Field>
                <Field label="Status" required>
                    <select className="form-select" value={form.status} onChange={bind('status')}>
                        <option>Present</option>
                        <option>Late</option>
                        <option>Half Day</option>
                        <option>Absent</option>
                    </select>
                </Field>
                {form.status !== 'Absent' && <>
                    <Field label="Check in"><input type="time" className="form-input" value={form.check_in} onChange={bind('check_in')} /></Field>
                    <Field label="Check out"><input type="time" className="form-input" value={form.check_out} onChange={bind('check_out')} /></Field>
                </>}
            </div>
        </FormModal>
    );
}
