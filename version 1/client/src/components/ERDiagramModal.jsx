import React, { useState } from 'react';
import { X, Layers, Key, Link2, Sparkles, Table } from 'lucide-react';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden glass-panel max-h-[90vh] flex flex-col">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Relational Database ER Diagram Schema</h2>
                            <p className="text-xs text-slate-400">Primary Keys, Foreign Keys & Cardinalities for 15 Entities</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Schema Map Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ER_SCHEMA.map((entity) => (
                            <div 
                                key={entity.name}
                                onClick={() => setSelectedTable(entity.name)}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                    selectedTable === entity.name 
                                        ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500 shadow-lg'
                                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <Table className="w-4 h-4 text-indigo-400" />
                                        <h3 className="font-bold text-sm text-white">{entity.name}</h3>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                                        {entity.fields.length + 1 + entity.fk.length} attributes
                                    </span>
                                </div>

                                {/* Primary Key */}
                                <div className="flex items-center space-x-2 text-xs font-mono text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 mb-2">
                                    <Key className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                    <span>PK: {entity.pk} (INT)</span>
                                </div>

                                {/* Foreign Keys */}
                                {entity.fk.length > 0 && (
                                    <div className="space-y-1 mb-2">
                                        {entity.fk.map((fkItem, idx) => (
                                            <div key={idx} className="flex items-center space-x-1.5 text-[11px] font-mono text-cyan-300 bg-cyan-500/10 p-1.5 rounded border border-cyan-500/20">
                                                <Link2 className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                                                <span>FK: {fkItem}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Attributes summary */}
                                <div className="text-[11px] text-slate-400 font-mono truncate">
                                    Attributes: {entity.fields.join(', ')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-center">
                    <p className="text-xs text-slate-400">
                        DBMS Relational Model • Normalized 3NF Schema • Foreign Key Constraints Enabled
                    </p>
                </div>

            </div>
        </div>
    );
}
