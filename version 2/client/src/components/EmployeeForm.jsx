import React, { useState } from 'react';
import { FormModal, Field, useForm, useLookups, useAction, api, fullName, todayISO } from './ui';

// Create or edit an employee. When creating, an optional login account is created in the
// same database transaction (see POST /api/employees).
export default function EmployeeFormModal({ employee, defaults = {}, lockManager = false, allowAccount = true, onClose, onSaved }) {
    const { data: lk } = useLookups();
    const run = useAction();
    const isEdit = Boolean(employee);

    const [form, bind, , setForm] = useForm({
        first_name: employee?.first_name || '',
        last_name: employee?.last_name || '',
        department_id: employee?.department_id || defaults.department_id || '',
        designation_id: employee?.designation_id || '',
        manager_id: employee?.manager_id || defaults.manager_id || '',
        joining_date: employee?.joining_date || todayISO(),
        salary: employee?.salary ?? '',
        status: employee?.status || 'Active',
        phone: employee?.phone || '',
        gender: employee?.gender || '',
        dob: employee?.dob || '',
        address: employee?.address || '',
        username: '',
        email: '',
        password: '',
        role_id: ''
    });
    const [withAccount, setWithAccount] = useState(false);

    const designations = lk.designations.filter(d => String(d.department_id) === String(form.department_id));
    const managers = lk.employees.filter(e => String(e.employee_id) !== String(employee?.employee_id) && e.status !== 'Inactive');

    const onDepartment = (e) => setForm(f => ({ ...f, department_id: e.target.value, designation_id: '' }));

    const submit = async () => {
        const payload = { ...form };
        if (!withAccount || isEdit) {
            delete payload.username; delete payload.email; delete payload.password; delete payload.role_id;
        }
        const ok = await run(
            () => isEdit ? api.put(`/api/employees/${employee.employee_id}`, payload) : api.post('/api/employees', payload),
            isEdit ? 'Employee updated' : `${form.first_name} ${form.last_name} added`
        );
        if (ok) { onSaved?.(); onClose(); }
    };

    return (
        <FormModal
            title={isEdit ? `Edit ${fullName(employee)}` : 'Add employee'}
            subtitle={isEdit ? `Employee #${employee.employee_id}` : 'Creates a record in the employees table'}
            onClose={onClose}
            onSubmit={submit}
            submitLabel={isEdit ? 'Save changes' : 'Create employee'}
            size="lg"
        >
            <div className="stack">
                <div className="form-grid">
                    <Field label="First name" required><input className="form-input" value={form.first_name} onChange={bind('first_name')} required /></Field>
                    <Field label="Last name" required><input className="form-input" value={form.last_name} onChange={bind('last_name')} required /></Field>

                    <Field label="Department" required>
                        <select className="form-select" value={form.department_id} onChange={onDepartment} required>
                            <option value="">Select department…</option>
                            {lk.departments.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
                        </select>
                    </Field>
                    <Field label="Designation" required hint={form.department_id && designations.length === 0 ? 'No designations in this department yet — add one under People & org.' : undefined}>
                        <select className="form-select" value={form.designation_id} onChange={bind('designation_id')} required disabled={!form.department_id}>
                            <option value="">{form.department_id ? 'Select designation…' : 'Pick a department first'}</option>
                            {designations.map(d => <option key={d.designation_id} value={d.designation_id}>{d.title} (L{d.level})</option>)}
                        </select>
                    </Field>

                    <Field label="Reports to">
                        <select className="form-select" value={form.manager_id || ''} onChange={bind('manager_id')} disabled={lockManager}>
                            <option value="">No manager (top level)</option>
                            {managers.map(m => <option key={m.employee_id} value={m.employee_id}>{fullName(m)} — {m.designation}</option>)}
                        </select>
                    </Field>
                    <Field label="Annual salary ($)" required>
                        <input className="form-input" type="number" min="0" step="100" value={form.salary} onChange={bind('salary')} required />
                    </Field>

                    <Field label="Joining date" required><input className="form-input" type="date" value={form.joining_date} onChange={bind('joining_date')} required /></Field>
                    {isEdit ? (
                        <Field label="Status" hint="Inactive employees can no longer sign in.">
                            <select className="form-select" value={form.status} onChange={bind('status')}>
                                <option>Active</option>
                                <option>On Leave</option>
                                <option>Inactive</option>
                            </select>
                        </Field>
                    ) : (
                        <Field label="Phone"><input className="form-input" value={form.phone} onChange={bind('phone')} /></Field>
                    )}
                    {isEdit && <Field label="Phone"><input className="form-input" value={form.phone} onChange={bind('phone')} /></Field>}
                    <Field label="Gender">
                        <select className="form-select" value={form.gender} onChange={bind('gender')}>
                            <option value="">Prefer not to say</option>
                            <option>Female</option>
                            <option>Male</option>
                            <option>Other</option>
                        </select>
                    </Field>
                    <Field label="Date of birth"><input className="form-input" type="date" value={form.dob} onChange={bind('dob')} /></Field>
                    <Field label="Address" span><input className="form-input" value={form.address} onChange={bind('address')} /></Field>
                </div>

                {!isEdit && allowAccount && (
                    <div className="card" style={{ background: 'var(--bg-inset)', boxShadow: 'none' }}>
                        <label className="row" style={{ cursor: 'pointer' }}>
                            <input type="checkbox" checked={withAccount} onChange={e => setWithAccount(e.target.checked)} />
                            <span className="strong">Also create a login account</span>
                            <span className="text-sm muted">— inserted into <code>users</code> in the same transaction</span>
                        </label>
                        {withAccount && (
                            <div className="form-grid" style={{ marginTop: '0.9rem' }}>
                                <Field label="Username" required><input className="form-input" value={form.username} onChange={bind('username')} required /></Field>
                                <Field label="Work email" required><input className="form-input" type="email" value={form.email} onChange={bind('email')} required /></Field>
                                <Field label="Temporary password" required><input className="form-input" value={form.password} onChange={bind('password')} required /></Field>
                                <Field label="Role">
                                    <select className="form-select" value={form.role_id} onChange={bind('role_id')}>
                                        <option value="">Employee (default)</option>
                                        {lk.roles.filter(r => r.role_name !== 'Client').map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                                    </select>
                                </Field>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </FormModal>
    );
}
