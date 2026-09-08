import React, { useState, useEffect } from 'react';
import { Table as TableIcon, Search, ArrowUpDown, ChevronLeft, ChevronRight, Filter, Info, Eye } from 'lucide-react';

const TABLES_LIST = [
    { id: 'departments', label: 'Departments', category: 'Org' },
    { id: 'designations', label: 'Designations', category: 'Org' },
    { id: 'roles', label: 'Roles', category: 'Auth' },
    { id: 'users', label: 'Users', category: 'Auth' },
    { id: 'employees', label: 'Employees', category: 'HR' },
    { id: 'payroll', label: 'Payroll', category: 'HR' },
    { id: 'attendance', label: 'Attendance', category: 'HR' },
    { id: 'leave_requests', label: 'Leave Requests', category: 'HR' },
    { id: 'performance_reviews', label: 'Performance', category: 'HR' },
    { id: 'projects', label: 'Projects', category: 'Operations' },
    { id: 'tasks', label: 'Tasks', category: 'Operations' },
    { id: 'clients', label: 'Clients', category: 'Sales' },
    { id: 'invoices', label: 'Invoices', category: 'Sales' },
    { id: 'assets', label: 'Assets', category: 'IT' },
    { id: 'notifications', label: 'Notifications', category: 'Sys' }
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
    const [selectedRow, setSelectedRow] = useState(null);

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

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl mb-8">
            
            {/* Header Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <div className="flex items-center space-x-2 text-indigo-400 mb-1">
                        <TableIcon className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">Relational Database Table Explorer</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white">15 ER Relational Tables Viewer</h2>
                </div>

                {/* Global Search Form */}
                <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                        <input
                            type="text"
                            placeholder={`Search ${selectedTable}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-48 sm:w-64"
                        />
                    </div>
                    <button type="submit" className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all">
                        Search
                    </button>
                </form>
            </div>

            {/* Table Tabs Bar */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-3 mb-6 scrollbar-thin border-b border-slate-800">
                {TABLES_LIST.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setSelectedTable(t.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                            selectedTable === t.id
                                ? 'bg-indigo-600 text-white shadow-md glow-indigo'
                                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                        }`}
                    >
                        <span>{t.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            selectedTable === t.id ? 'bg-indigo-400/30 text-white' : 'bg-slate-800 text-slate-500'
                        }`}>
                            {t.category}
                        </span>
                    </button>
                ))}
            </div>

            {/* Table Container */}
            <div className="relative overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                {loading && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-20 flex items-center justify-center">
                        <div className="flex items-center space-x-3 text-indigo-400 text-sm font-semibold">
                            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>Querying SQL database...</span>
                        </div>
                    </div>
                )}

                <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800">
                        <tr>
                            <th className="p-3.5 text-slate-500 text-[10px]">#</th>
                            {columns.map((col) => (
                                <th 
                                    key={col.name} 
                                    onClick={() => handleSort(col.name)}
                                    className="p-3.5 cursor-pointer hover:text-white transition-colors select-none"
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>{col.name}</span>
                                        {col.pk === 1 && (
                                            <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300 rounded font-mono">PK</span>
                                        )}
                                        <ArrowUpDown className="w-3 h-3 text-slate-600 hover:text-indigo-400" />
                                    </div>
                                </th>
                            ))}
                            <th className="p-3.5 text-right">Inspect</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                        {tableData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + 2} className="p-8 text-center text-slate-500 font-sans">
                                    No records found matching query filter.
                                </td>
                            </tr>
                        ) : (
                            tableData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                                    <td className="p-3.5 text-slate-600 text-[10px]">{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                                    {columns.map((col) => (
                                        <td key={col.name} className="p-3.5 font-sans">
                                            {row[col.name] !== null && row[col.name] !== undefined ? (
                                                typeof row[col.name] === 'number' && col.name.includes('salary') || col.name.includes('amount') ? (
                                                    <span className="font-semibold text-emerald-400 font-mono">${Number(row[col.name]).toLocaleString()}</span>
                                                ) : (
                                                    <span className="text-slate-200">{String(row[col.name])}</span>
                                                )
                                            ) : (
                                                <span className="text-slate-600 italic text-[10px]">NULL</span>
                                            )}
                                        </td>
                                    ))}
                                    <td className="p-3.5 text-right font-sans">
                                        <button
                                            onClick={() => setSelectedRow(row)}
                                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                                            title="View Record JSON"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 gap-3">
                <div>
                    Showing <span className="font-bold text-white">{tableData.length}</span> of <span className="font-bold text-white">{pagination.totalRows}</span> records in <span className="font-bold text-indigo-400">{selectedTable}</span>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <span>Page Size:</span>
                        <select
                            value={pagination.limit}
                            onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-1.5">
                        <button
                            disabled={pagination.page <= 1}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <span className="font-bold text-slate-200 px-2">
                            {pagination.page} / {pagination.totalPages}
                        </span>

                        <button
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Row Detail Drawer Modal */}
            {selectedRow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                            <h3 className="font-bold text-white text-base">Record Details ({selectedTable})</h3>
                            <button onClick={() => setSelectedRow(null)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <div className="space-y-2 text-xs font-mono">
                            {Object.entries(selectedRow).map(([k, v]) => (
                                <div key={k} className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800/60">
                                    <span className="text-indigo-300 font-semibold">{k}:</span>
                                    <span className="text-slate-200">{v !== null ? String(v) : 'NULL'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
