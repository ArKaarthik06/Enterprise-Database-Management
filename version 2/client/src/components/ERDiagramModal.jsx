import React, { useState } from 'react';
import { X, Layers, Key, Link2, Table } from 'lucide-react';

const ER_SCHEMA = [
    { name: 'roles', pk: 'role_id', fields: ['role_name', 'description'], fk: [] },
    { name: 'users', pk: 'user_id', fields: ['username', 'email', 'password_hash', 'is_active', 'created_at'], fk: ['role_id → roles.role_id'] },
    { name: 'departments', pk: 'department_id', fields: ['name', 'description'], fk: ['head_id → employees.employee_id (NULL)'] },
    { name: 'designations', pk: 'designation_id', fields: ['title', 'level'], fk: ['department_id → departments.department_id'] },
    { name: 'employees', pk: 'employee_id', fields: ['first_name', 'last_name', 'dob', 'gender', 'phone', 'address', 'joining_date', 'salary', 'status'], fk: ['user_id → users.user_id (UNIQUE)', 'department_id → departments.department_id', 'designation_id → designations.designation_id', 'manager_id → employees.employee_id'] },
    { name: 'projects', pk: 'project_id', fields: ['name', 'description', 'start_date', 'end_date', 'status'], fk: ['manager_id → employees.employee_id'] },
    { name: 'tasks', pk: 'task_id', fields: ['title', 'description', 'priority', 'status', 'due_date'], fk: ['project_id → projects.project_id', 'assigned_to → employees.employee_id'] },
    { name: 'clients', pk: 'client_id', fields: ['name', 'company', 'email', 'phone', 'address'], fk: [] },
    { name: 'invoices', pk: 'invoice_id', fields: ['amount', 'issue_date', 'due_date', 'status'], fk: ['client_id → clients.client_id', 'project_id → projects.project_id'] },
    { name: 'assets', pk: 'asset_id', fields: ['name', 'category', 'purchase_date', 'status'], fk: ['assigned_to → employees.employee_id'] },
    { name: 'notifications', pk: 'notification_id', fields: ['title', 'message', 'is_read', 'created_at'], fk: ['user_id → users.user_id'] },
    { name: 'attendance', pk: 'attendance_id', fields: ['date', 'check_in', 'check_out', 'status'], fk: ['employee_id → employees.employee_id'] },
    { name: 'leave_requests', pk: 'leave_id', fields: ['leave_type', 'start_date', 'end_date', 'reason', 'status'], fk: ['employee_id → employees.employee_id', 'approved_by → employees.employee_id'] },
    { name: 'payroll', pk: 'payroll_id', fields: ['month', 'year', 'basic_salary', 'bonus', 'deductions', 'net_salary', 'payment_date', 'status'], fk: ['employee_id → employees.employee_id'] },
    { name: 'performance_reviews', pk: 'review_id', fields: ['review_date', 'rating', 'comments'], fk: ['employee_id → employees.employee_id', 'reviewer_id → employees.employee_id'] }
];

export default function ERDiagramModal({ isOpen, onClose }) {
    const [selectedTable, setSelectedTable] = useState(null);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" style={{ maxWidth: '950px' }} onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="brand-icon" style={{ background: 'var(--primary)', width: '36px', height: '36px' }}>
                            <Layers className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="modal-title">Relational Entity-Relationship (ER) Schema</h2>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Normalized 3NF Database Entities, Primary Keys & Foreign Key Constraints</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost btn-sm">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                        {ER_SCHEMA.map((entity) => (
                            <div 
                                key={entity.name}
                                onClick={() => setSelectedTable(entity.name)}
                                className="card"
                                style={{
                                    padding: '1rem',
                                    cursor: 'pointer',
                                    border: selectedTable === entity.name ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                    backgroundColor: selectedTable === entity.name ? 'var(--primary-light)' : 'var(--bg-card)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Table className="w-4 h-4 text-indigo-600" />
                                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--secondary)' }}>{entity.name}</h3>
                                    </div>
                                    <span className="badge badge-slate">
                                        {entity.fields.length + 1 + entity.fk.length} attrs
                                    </span>
                                </div>

                                {/* Primary Key */}
                                <div className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem', width: '100%', padding: '0.35rem 0.5rem' }}>
                                    <Key className="w-3.5 h-3.5" />
                                    <span>PK: {entity.pk} (INTEGER)</span>
                                </div>

                                {/* Foreign Keys */}
                                {entity.fk.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.5rem' }}>
                                        {entity.fk.map((fkItem, idx) => (
                                            <div key={idx} className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', width: '100%', padding: '0.3rem 0.5rem', fontSize: '0.675rem' }}>
                                                <Link2 className="w-3 h-3" />
                                                <span>FK: {fkItem}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Attributes */}
                                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} className="truncate">
                                    Attributes: {entity.fields.join(', ')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer" style={{ justifyContent: 'center' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Relational Database Model • SQLite Engine • 15 Entity Tables
                    </p>
                </div>

            </div>
        </div>
    );
}
