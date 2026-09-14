import React, { useState, useEffect } from 'react';
import { Table as TableIcon, Search, ArrowUpDown, ChevronLeft, ChevronRight, Eye, Plus, Edit, Trash2, Download, RefreshCw } from 'lucide-react';

const TABLES_LIST = [
    { id: 'employees', label: 'Employees', category: 'HR' },
    { id: 'departments', label: 'Departments', category: 'Org' },
    { id: 'projects', label: 'Projects', category: 'Ops' },
    { id: 'clients', label: 'Clients', category: 'Sales' },
    { id: 'invoices', label: 'Invoices', category: 'Sales' },
    { id: 'payroll', label: 'Payroll', category: 'HR' },
    { id: 'tasks', label: 'Tasks', category: 'Ops' },
    { id: 'assets', label: 'Assets', category: 'IT' },
    { id: 'attendance', label: 'Attendance', category: 'HR' },
    { id: 'leave_requests', label: 'Leave Requests', category: 'HR' },
    { id: 'performance_reviews', label: 'Performance', category: 'HR' },
    { id: 'notifications', label: 'Notifications', category: 'Sys' },
    { id: 'designations', label: 'Designations', category: 'Org' },
    { id: 'roles', label: 'Roles', category: 'Auth' },
    { id: 'users', label: 'Users', category: 'Auth' }
];

export default function TableViewer() {
    const [selectedTable, setSelectedTable] = useState('employees');
    const [tableData, setTableData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalRows: 0, totalPages: 1 });
    const [sortBy, setSortBy] = useState('');
    const [sortOrder, setSortOrder] = useState('ASC');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [employeesLookup, setEmployeesLookup] = useState({});

    useEffect(() => {
        fetch('/api/tables/employees?limit=1000')
            .then(res => res.json())
            .then(resData => {
                if (resData.data) {
                    const lookup = {};
                    resData.data.forEach(emp => {
                        lookup[emp.employee_id] = `${emp.first_name} ${emp.last_name}`;
                    });
                    setEmployeesLookup(lookup);
                }
            })
            .catch(err => console.error('Error fetching employees lookup:', err));
    }, []);
    
    // Modal states
    const [inspectRow, setInspectRow] = useState(null);
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null); // null for Add, row object for Edit
    const [formData, setFormData] = useState({});
    const [modalError, setModalError] = useState('');

    const fetchTableData = () => {
        setLoading(true);
        const url = `/api/tables/${selectedTable}?page=${pagination.page}&limit=${pagination.limit}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${encodeURIComponent(searchTerm)}`;
        
        fetch(url)
            .then(res => res.json())
            .then(resData => {
                if (resData.data) {
                    setTableData(resData.data);
                    setColumns(resData.columns || []);
                    setPagination(resData.pagination || { page: 1, limit: 10, totalRows: 0, totalPages: 1 });
                }
            })
            .catch(err => console.error('Error fetching table data:', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
        setSortBy('');
        setSearchTerm('');
    }, [selectedTable]);

    useEffect(() => {
        fetchTableData();
    }, [selectedTable, pagination.page, pagination.limit, sortBy, sortOrder]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchTableData();
    };

    const handleSort = (colName) => {
        if (sortBy === colName) {
            setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortBy(colName);
            setSortOrder('ASC');
        }
    };

    // Open Add Modal
    const handleOpenAddModal = () => {
        setEditingRow(null);
        const initialForm = {};
        columns.forEach(c => {
            if (c.pk !== 1) {
                initialForm[c.name] = '';
            }
        });
        setFormData(initialForm);
        setModalError('');
        setIsAddEditModalOpen(true);
    };

    // Open Edit Modal
    const handleOpenEditModal = (row) => {
        setEditingRow(row);
        setFormData({ ...row });
        setModalError('');
        setIsAddEditModalOpen(true);
    };

    // Save (Add or Edit)
    const handleSaveRecord = (e) => {
        e.preventDefault();
        setModalError('');

        const pkCol = columns.find(c => c.pk === 1)?.name || columns[0]?.name;
        const isEditing = Boolean(editingRow);
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing 
            ? `/api/tables/${selectedTable}/${editingRow[pkCol]}`
            : `/api/tables/${selectedTable}`;

        fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save record');
            setIsAddEditModalOpen(false);
            fetchTableData();
        })
        .catch(err => setModalError(err.message));
    };

    // Delete Record
    const handleDeleteRecord = (row) => {
        const pkCol = columns.find(c => c.pk === 1)?.name || columns[0]?.name;
        const pkVal = row[pkCol];
        if (!window.confirm(`Are you sure you want to delete record with ${pkCol} = ${pkVal}?`)) return;

        fetch(`/api/tables/${selectedTable}/${pkVal}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(data => {
                if (data.error) alert(`Error: ${data.error}`);
                else fetchTableData();
            })
            .catch(err => alert(`Failed to delete record: ${err.message}`));
    };

    // Export CSV
    const handleExportCSV = () => {
        if (tableData.length === 0) return;
        const colHeaders = columns.map(c => c.name).join(',');
        const rowsCsv = tableData.map(row => 
            columns.map(c => {
                const val = row[c.name];
                if (val === null || val === undefined) return '""';
                return `"${String(val).replace(/"/g, '""')}"`;
            }).join(',')
        ).join('\n');
        
        const blob = new Blob([`${colHeaders}\n${rowsCsv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${selectedTable}_export.csv`;
        link.click();
    };

    return (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            
            {/* Header Title & Actions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                        <TableIcon className="w-5 h-5 text-indigo-600" />
                        <span className="badge badge-indigo">15 Relational Tables</span>
                    </div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--secondary)' }}>
                        Database Record Explorer
                    </h2>
                </div>

                {/* Search & Actions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                    <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.4rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Search className="w-4 h-4" style={{ position: 'absolute', left: '0.65rem', top: '0.65rem', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder={`Search ${selectedTable}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="form-input"
                                style={{ paddingLeft: '2.1rem', width: '200px' }}
                            />
                        </div>
                        <button type="submit" className="btn btn-secondary btn-sm">Search</button>
                    </form>

                    <button onClick={handleOpenAddModal} className="btn btn-primary btn-sm">
                        <Plus className="w-4 h-4" />
                        <span>Add Record</span>
                    </button>

                    <button onClick={handleExportCSV} className="btn btn-outline btn-sm" title="Export current page to CSV">
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Table Navigation Selector Tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                {TABLES_LIST.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setSelectedTable(t.id)}
                        className={`btn btn-sm ${selectedTable === t.id ? 'btn-primary' : 'btn-outline'}`}
                        style={{ borderRadius: 'var(--radius-sm)' }}
                    >
                        <span>{t.label}</span>
                        <span className="badge badge-slate" style={{ fontSize: '0.65rem' }}>{t.category}</span>
                    </button>
                ))}
            </div>

            {/* Data Table */}
            <div className="table-container" style={{ position: 'relative' }}>
                {loading && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.75)',
                        backdropFilter: 'blur(2px)',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontWeight: 600,
                        color: 'var(--primary)'
                    }}>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Fetching database records...
                    </div>
                )}

                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>#</th>
                            {columns.map((col) => (
                                <th 
                                    key={col.name}
                                    onClick={() => handleSort(col.name)}
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <span>{col.name}</span>
                                        {col.pk === 1 && <span className="badge badge-warning">PK</span>}
                                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                    </div>
                                </th>
                            ))}
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + 2} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                                    No records found in table matching your search.
                                </td>
                            </tr>
                        ) : (
                            tableData.map((row, idx) => (
                                <tr key={idx}>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                        {(pagination.page - 1) * pagination.limit + idx + 1}
                                    </td>
                                    {columns.map((col) => (
                                        <td key={col.name}>
                                            {row[col.name] !== null && row[col.name] !== undefined ? (
                                                col.name === 'status' ? (
                                                    <span className={`badge ${
                                                        ['Completed', 'Paid', 'Active'].includes(row[col.name]) ? 'badge-success' :
                                                        ['In Progress', 'Pending', 'Medium'].includes(row[col.name]) ? 'badge-warning' :
                                                        ['Unpaid', 'High', 'Inactive'].includes(row[col.name]) ? 'badge-danger' :
                                                        'badge-info'
                                                    }`}>
                                                        {row[col.name]}
                                                    </span>
                                                ) : (col.name === 'manager_id' || col.name === 'assigned_to' || col.name === 'head_id' || col.name === 'approved_by' || col.name === 'reviewer_id') ? (
                                                    <span>{employeesLookup[row[col.name]] || row[col.name]}</span>
                                                ) : (typeof row[col.name] === 'number' && (col.name.includes('salary') || col.name.includes('amount'))) ? (
                                                    <span style={{ fontWeight: 700, color: 'var(--success-text)' }}>
                                                        ${Number(row[col.name]).toLocaleString()}
                                                    </span>
                                                ) : (
                                                    <span>{String(row[col.name])}</span>
                                                )
                                            ) : (
                                                <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>NULL</span>
                                            )}
                                        </td>
                                    ))}
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                                            <button
                                                onClick={() => setInspectRow(row)}
                                                className="btn btn-ghost btn-sm"
                                                title="Inspect Record JSON"
                                            >
                                                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                            </button>
                                            <button
                                                onClick={() => handleOpenEditModal(row)}
                                                className="btn btn-ghost btn-sm"
                                                title="Edit Record"
                                            >
                                                <Edit className="w-3.5 h-3.5 text-info" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRecord(row)}
                                                className="btn btn-ghost btn-sm"
                                                title="Delete Record"
                                                style={{ color: 'var(--danger-text)' }}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <div>
                    Showing <strong>{tableData.length}</strong> of <strong>{pagination.totalRows}</strong> entries in <strong>{selectedTable}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>Rows:</span>
                        <select
                            value={pagination.limit}
                            onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                            className="form-select"
                            style={{ padding: '0.25rem 0.5rem', width: '70px' }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <button
                            disabled={pagination.page <= 1}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            className="btn btn-outline btn-sm"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span style={{ fontWeight: 700, padding: '0 0.4rem', color: 'var(--text-main)' }}>
                            {pagination.page} / {pagination.totalPages}
                        </span>
                        <button
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            className="btn btn-outline btn-sm"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Inspect Drawer Modal */}
            {inspectRow && (
                <div className="modal-overlay" onClick={() => setInspectRow(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Record JSON Data ({selectedTable})</h3>
                            <button onClick={() => setInspectRow(null)} className="btn btn-ghost btn-sm">✕</button>
                        </div>
                        <div className="modal-body">
                            <pre className="font-mono" style={{ backgroundColor: '#0f172a', color: '#38bdf8', padding: '1rem', borderRadius: 'var(--radius-sm)', overflowX: 'auto', fontSize: '0.825rem' }}>
                                {JSON.stringify(inspectRow, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Record Modal */}
            {isAddEditModalOpen && (
                <div className="modal-overlay" onClick={() => setIsAddEditModalOpen(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingRow ? `Edit Record in ${selectedTable}` : `Add New Record to ${selectedTable}`}
                            </h3>
                            <button onClick={() => setIsAddEditModalOpen(false)} className="btn btn-ghost btn-sm">✕</button>
                        </div>
                        <form onSubmit={handleSaveRecord}>
                            <div className="modal-body">
                                {modalError && (
                                    <div className="badge badge-danger" style={{ display: 'block', padding: '0.6rem', marginBottom: '1rem' }}>
                                        Error: {modalError}
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                                    {columns.map(col => {
                                        const isPk = col.pk === 1;
                                        return (
                                            <div key={col.name} className="form-group">
                                                <label className="form-label">
                                                    {col.name} {isPk && <span style={{ color: 'var(--danger-text)' }}>*(Primary Key)</span>}
                                                </label>
                                                <input
                                                    type="text"
                                                    disabled={isPk && editingRow} // PK cannot be edited when updating
                                                    value={formData[col.name] !== undefined && formData[col.name] !== null ? formData[col.name] : ''}
                                                    onChange={e => setFormData({ ...formData, [col.name]: e.target.value })}
                                                    className="form-input"
                                                    placeholder={`Enter ${col.name}`}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsAddEditModalOpen(false)} className="btn btn-outline">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingRow ? 'Update Record' : 'Create Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
