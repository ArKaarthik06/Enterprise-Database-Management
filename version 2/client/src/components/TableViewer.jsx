import React, { useEffect, useMemo, useState } from 'react';
import { Table as TableIcon, Search, ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, Eye, Plus, Pencil, Trash2, Download, RefreshCw, Key, Link2 } from 'lucide-react';
import { Panel, Modal, FormModal, Field, EmptyState, ErrorNote, StatusBadge, useFetch, useAction, api } from './ui';

const TABLE_GROUPS = [
    { label: 'Organisation', tables: ['departments', 'designations', 'employees', 'teams', 'team_members'] },
    { label: 'HR', tables: ['attendance', 'leave_requests', 'payroll', 'performance_reviews'] },
    { label: 'Projects', tables: ['projects', 'tasks', 'assets'] },
    { label: 'Sales & CRM', tables: ['clients', 'invoices', 'leads', 'interactions'] },
    { label: 'System', tables: ['users', 'roles', 'notifications'] }
];

// Human-readable label for a row in a referenced table (used by FK dropdowns and cells)
function rowLabel(table, row) {
    if (!row) return '';
    if (row.first_name) return `${row.first_name} ${row.last_name || ''}`.trim();
    return row.name || row.company || row.title || row.role_name || row.username || row.company_name || '';
}

export default function TableViewer() {
    const tables = useFetch('/api/tables', []);
    const run = useAction();
    const [selectedTable, setSelectedTable] = useState('employees');
    const [result, setResult] = useState({ data: [], columns: [], primaryKey: [], foreignKeys: [], pagination: { page: 1, limit: 15, totalRows: 0, totalPages: 1 } });
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(15);
    const [sortBy, setSortBy] = useState('');
    const [sortOrder, setSortOrder] = useState('ASC');
    const [search, setSearch] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [inspectRow, setInspectRow] = useState(null);
    const [editing, setEditing] = useState(null); // null | 'new' | row
    const [fkLabels, setFkLabels] = useState({}); // { table: { id: label } }

    const meta = tables.data.find(t => t.name === selectedTable);

    const fetchTableData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit, sortBy, sortOrder, search: appliedSearch });
            setResult(await api.get(`/api/tables/${selectedTable}?${params}`));
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { setPage(1); setSortBy(''); setSearch(''); setAppliedSearch(''); }, [selectedTable]);
    useEffect(() => { fetchTableData(); }, [selectedTable, page, limit, sortBy, sortOrder, appliedSearch]);

    // Resolve FK ids to names for every referenced table on screen
    useEffect(() => {
        const refs = [...new Set(result.foreignKeys.map(fk => fk.table))].filter(t => !fkLabels[t]);
        refs.forEach(t => {
            api.get(`/api/tables/${t}?limit=1000`).then(r => {
                const pk = r.primaryKey?.[0];
                const map = {};
                r.data.forEach(row => { map[row[pk]] = rowLabel(t, row); });
                setFkLabels(prev => ({ ...prev, [t]: map }));
            }).catch(() => {});
        });
    }, [result.foreignKeys]);

    const fkFor = useMemo(() => Object.fromEntries(result.foreignKeys.map(fk => [fk.from, fk])), [result.foreignKeys]);
    const pkCols = result.primaryKey || [];
    const rowId = (row) => pkCols.map(c => row[c]).join('~');

    const handleSort = (col) => {
        if (sortBy === col) setSortOrder(o => (o === 'ASC' ? 'DESC' : 'ASC'));
        else { setSortBy(col); setSortOrder('ASC'); }
    };

    const handleDelete = async (row) => {
        const where = pkCols.map(c => `${c} = ${row[c]}`).join(' AND ');
        if (!window.confirm(`DELETE FROM ${selectedTable} WHERE ${where};\n\nRun this statement?`)) return;
        if (await run(() => api.del(`/api/tables/${selectedTable}/${encodeURIComponent(rowId(row))}`), 'Row deleted')) {
            fetchTableData();
            tables.reload();
        }
    };

    const handleExportCSV = async () => {
        const all = await api.get(`/api/tables/${selectedTable}?limit=100000&search=${encodeURIComponent(appliedSearch)}`);
        const cols = all.columns.map(c => c.name);
        const esc = v => (v === null || v === undefined ? '' : `"${String(v).replace(/"/g, '""')}"`);
        const csv = [cols.join(','), ...all.data.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        link.download = `${selectedTable}.csv`;
        link.click();
    };

    const renderCell = (col, value) => {
        if (value === null || value === undefined) return <span className="null">NULL</span>;
        const fk = fkFor[col.name];
        if (fk) {
            const label = fkLabels[fk.table]?.[value];
            return <span title={`${fk.table}.${fk.to} = ${value}`}><span className="light">{value}</span>{label ? <span style={{ fontFamily: 'var(--font-sans)' }}> · {label}</span> : null}</span>;
        }
        if (col.name === 'status' || col.name === 'priority') return <StatusBadge status={value} />;
        if (typeof value === 'number' && /salary|amount|value|bonus|deductions/.test(col.name)) return `$${value.toLocaleString()}`;
        const s = String(value);
        return s.length > 48 ? <span title={s}>{s.slice(0, 48)}…</span> : s;
    };

    const { pagination } = result;

    return (
        <Panel
            title="Database record explorer"
            subtitle={meta ? `${meta.rowCount} rows · ${meta.columnCount} columns · PK (${meta.primaryKey?.join(', ')})` : undefined}
            icon={TableIcon}
            flush
            actions={<>
                <form onSubmit={e => { e.preventDefault(); setPage(1); setAppliedSearch(search); }} className="input-icon" style={{ width: 220 }}>
                    <Search size={15} />
                    <input className="form-input sm" style={{ paddingLeft: '2rem' }} placeholder={`Search ${selectedTable}…`} value={search} onChange={e => setSearch(e.target.value)} />
                </form>
                <button onClick={fetchTableData} className="btn btn-ghost btn-icon btn-sm" title="Refresh"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
                <button onClick={handleExportCSV} className="btn btn-outline btn-sm"><Download size={15} /> CSV</button>
                <button onClick={() => setEditing('new')} className="btn btn-primary btn-sm"><Plus size={15} /> Insert row</button>
            </>}
        >
            <div className="explorer-grid">
                <nav className="explorer-nav" aria-label="Tables">
                    {TABLE_GROUPS.map(g => (
                        <div key={g.label} style={{ marginBottom: '0.6rem' }}>
                            <div className="section-title" style={{ padding: '0 0.5rem', marginBottom: '0.25rem', fontSize: '0.7rem' }}>{g.label}</div>
                            {g.tables.map(t => {
                                const info = tables.data.find(x => x.name === t);
                                return (
                                    <button
                                        key={t}
                                        onClick={() => setSelectedTable(t)}
                                        className={`nav-tab-btn ${selectedTable === t ? 'active' : ''}`}
                                        style={{ width: '100%', justifyContent: 'space-between', padding: '0.35rem 0.5rem', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}
                                    >
                                        <span className="truncate">{t}</span>
                                        <span className="text-xs light">{info?.rowCount ?? ''}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <ErrorNote message={error} onRetry={fetchTableData} />
                    <div className="table-container" style={{ flex: 1, opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s' }}>
                        <table className="data-table dense">
                            <thead>
                                <tr>
                                    {result.columns.map(col => (
                                        <th key={col.name}>
                                            <button className="th-sort" onClick={() => handleSort(col.name)} title={`${col.type}${col.notnull ? ' NOT NULL' : ''}`}>
                                                {col.pk > 0 && <Key size={11} className="text-warning" />}
                                                {fkFor[col.name] && <Link2 size={11} style={{ color: 'var(--info)' }} />}
                                                {col.name}
                                                {sortBy === col.name ? (sortOrder === 'ASC' ? <ArrowUp size={11} /> : <ArrowDown size={11} />) : <ArrowUpDown size={11} style={{ opacity: 0.35 }} />}
                                            </button>
                                        </th>
                                    ))}
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {result.data.length === 0 ? (
                                    <tr><td colSpan={result.columns.length + 1}><EmptyState title={appliedSearch ? 'No matching rows' : 'This table is empty'} /></td></tr>
                                ) : result.data.map(row => (
                                    <tr key={rowId(row)}>
                                        {result.columns.map(col => <td key={col.name}>{renderCell(col, row[col.name])}</td>)}
                                        <td>
                                            <div className="row-actions">
                                                <button onClick={() => setInspectRow(row)} className="btn btn-ghost btn-icon btn-sm" title="Inspect JSON"><Eye size={14} /></button>
                                                <button onClick={() => setEditing(row)} className="btn btn-ghost btn-icon btn-sm" title="Edit row"><Pencil size={14} /></button>
                                                <button onClick={() => handleDelete(row)} className="btn btn-ghost btn-icon btn-sm danger" title="Delete row"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination" style={{ padding: '0.65rem 1rem', borderTop: '1px solid var(--border-color)' }}>
                        <span>{pagination.totalRows} row{pagination.totalRows === 1 ? '' : 's'}{appliedSearch ? ` matching “${appliedSearch}”` : ''}</span>
                        <div className="row">
                            <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} className="form-select sm" style={{ width: 118 }} aria-label="Rows per page">
                                {[10, 15, 25, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
                            </select>
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn btn-outline btn-icon btn-sm" aria-label="Previous page"><ChevronLeft size={15} /></button>
                            <span className="mono text-sm">{pagination.page} / {pagination.totalPages}</span>
                            <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-outline btn-icon btn-sm" aria-label="Next page"><ChevronRight size={15} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {inspectRow && (
                <Modal title={`${selectedTable} · ${pkCols.map(c => `${c}=${inspectRow[c]}`).join(', ')}`} onClose={() => setInspectRow(null)}>
                    <div className="modal-body"><pre className="json-view">{JSON.stringify(inspectRow, null, 2)}</pre></div>
                </Modal>
            )}

            {editing && (
                <RowFormModal
                    table={selectedTable}
                    columns={result.columns}
                    pkCols={pkCols}
                    fkFor={fkFor}
                    row={editing === 'new' ? null : editing}
                    rowId={editing === 'new' ? null : rowId(editing)}
                    onClose={() => setEditing(null)}
                    onSaved={() => { fetchTableData(); tables.reload(); }}
                />
            )}
        </Panel>
    );
}

function inputTypeFor(col) {
    const t = (col.type || '').toUpperCase();
    if (t.includes('INT') || t.includes('DECIMAL') || t.includes('REAL') || t.includes('NUM')) return 'number';
    if (t === 'DATE') return 'date';
    if (t === 'TIME') return 'time';
    return 'text';
}

// Generic insert/update form driven by PRAGMA table_info + foreign_key_list
function RowFormModal({ table, columns, pkCols, fkFor, row, rowId, onClose, onSaved }) {
    const run = useAction();
    const isEdit = Boolean(row);
    const autoPk = pkCols.length === 1; // single INTEGER PK is AUTOINCREMENT in this schema
    const [form, setForm] = useState(() => Object.fromEntries(columns.map(c => [c.name, row ? (row[c.name] ?? '') : ''])));
    const [options, setOptions] = useState({});

    useEffect(() => {
        [...new Set(Object.values(fkFor).map(fk => fk.table))].forEach(t => {
            api.get(`/api/tables/${t}?limit=1000`).then(r => setOptions(o => ({ ...o, [t]: r }))).catch(() => {});
        });
    }, [fkFor]);

    const editable = columns.filter(c => !(autoPk && c.pk > 0) || (!isEdit && !autoPk));

    const submit = async () => {
        const payload = Object.fromEntries(editable.filter(c => !(isEdit && c.pk > 0)).map(c => [c.name, form[c.name]]));
        const ok = await run(
            () => isEdit ? api.put(`/api/tables/${table}/${encodeURIComponent(rowId)}`, payload) : api.post(`/api/tables/${table}`, payload),
            isEdit ? 'Row updated' : 'Row inserted'
        );
        if (ok) { onSaved(); onClose(); }
    };

    return (
        <FormModal
            title={isEdit ? `UPDATE ${table}` : `INSERT INTO ${table}`}
            subtitle={isEdit ? `WHERE ${pkCols.map(c => `${c} = ${row[c]}`).join(' AND ')}` : 'Leave optional fields blank to store NULL'}
            onClose={onClose}
            onSubmit={submit}
            submitLabel={isEdit ? 'Update row' : 'Insert row'}
            size="lg"
        >
            <div className="form-grid">
                {editable.map(col => {
                    const fk = fkFor[col.name];
                    const disabled = isEdit && col.pk > 0;
                    const set = e => setForm(f => ({ ...f, [col.name]: e.target.value }));
                    let input;
                    if (fk && options[fk.table]) {
                        const ref = options[fk.table];
                        const refPk = ref.primaryKey?.[0] || fk.to;
                        input = (
                            <select className="form-select" value={form[col.name] ?? ''} onChange={set} disabled={disabled} required={col.notnull && !col.dflt_value}>
                                <option value="">NULL</option>
                                {ref.data.map(r => <option key={r[refPk]} value={r[refPk]}>{r[refPk]} · {rowLabel(fk.table, r)}</option>)}
                            </select>
                        );
                    } else if ((col.type || '').toUpperCase() === 'BOOLEAN') {
                        input = (
                            <select className="form-select" value={form[col.name] === '' ? '' : Number(form[col.name])} onChange={set} disabled={disabled}>
                                <option value="">NULL / default</option><option value={1}>1 (true)</option><option value={0}>0 (false)</option>
                            </select>
                        );
                    } else if ((col.type || '').toUpperCase() === 'TEXT') {
                        input = <textarea className="form-textarea" value={form[col.name] ?? ''} onChange={set} disabled={disabled} />;
                    } else {
                        input = <input type={inputTypeFor(col)} step="any" className="form-input" value={form[col.name] ?? ''} onChange={set} disabled={disabled} required={Boolean(col.notnull) && col.dflt_value === null && !disabled} />;
                    }
                    return (
                        <Field
                            key={col.name}
                            label={<span className="mono">{col.name}</span>}
                            required={Boolean(col.notnull) && col.dflt_value === null}
                            hint={fk ? `FK → ${fk.table}.${fk.to}` : `${col.type || 'ANY'}${col.dflt_value !== null && col.dflt_value !== undefined ? ` · default ${col.dflt_value}` : ''}`}
                            span={(col.type || '').toUpperCase() === 'TEXT'}
                        >
                            {input}
                        </Field>
                    );
                })}
            </div>
        </FormModal>
    );
}
