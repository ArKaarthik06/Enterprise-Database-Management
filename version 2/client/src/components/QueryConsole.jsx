import React, { useState, useEffect } from 'react';
import { Terminal, Play, Sparkles, Clock, FileCode2, CheckCircle2, AlertCircle, RefreshCw, Download } from 'lucide-react';

export default function QueryConsole() {
    const [presets, setPresets] = useState([]);
    const [activePresetId, setActivePresetId] = useState(null);
    const [customSql, setCustomSql] = useState(`SELECT 
    d.name AS department_name,
    COUNT(e.employee_id) AS staff_count,
    ROUND(AVG(e.salary), 2) AS avg_base_salary
FROM departments d
JOIN employees e ON d.department_id = e.department_id
GROUP BY d.department_id
ORDER BY avg_base_salary DESC;`);
    
    const [queryResult, setQueryResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/api/query/presets')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPresets(data);
                }
            })
            .catch(err => console.error('Error fetching preset queries:', err));
    }, []);

    const executePresetQuery = (preset) => {
        setActivePresetId(preset.id);
        setCustomSql(preset.sql);
        setLoading(true);
        setError(null);

        fetch(`/api/query/preset/${preset.id}`)
            .then(res => res.json())
            .then(resData => {
                if (resData.error) {
                    setError(resData.error);
                    setQueryResult(null);
                } else {
                    setQueryResult(resData);
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    const handleExecuteCustomSql = (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);
        setActivePresetId(null);

        fetch('/api/query/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sql: customSql })
        })
            .then(res => res.json())
            .then(resData => {
                if (resData.error) {
                    setError(resData.error);
                    setQueryResult(null);
                } else {
                    setQueryResult(resData);
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    const handleExportResultsCSV = () => {
        if (!queryResult || !queryResult.data || queryResult.data.length === 0) return;
        const colHeaders = queryResult.columns.join(',');
        const rowsCsv = queryResult.data.map(row => 
            queryResult.columns.map(col => {
                const val = row[col];
                if (val === null || val === undefined) return '""';
                return `"${String(val).replace(/"/g, '""')}"`;
            }).join(',')
        ).join('\n');

        const blob = new Blob([`${colHeaders}\n${rowsCsv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `query_result_${Date.now()}.csv`;
        link.click();
    };

    return (
        <div id="query-console-section" className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            
            {/* Console Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                        <Terminal className="w-5 h-5 text-success-text" />
                        <span className="badge badge-success">SQL Analytical Workbench</span>
                    </div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--secondary)' }}>
                        Interactive SQL Query Terminal
                    </h2>
                </div>

                <button
                    onClick={handleExecuteCustomSql}
                    disabled={loading}
                    className="btn btn-success"
                >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    <span>Run SQL Query</span>
                </button>
            </div>

            {/* Presets Grid */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    <Sparkles className="w-4 h-4" style={{ color: 'var(--warning)' }} />
                    <span>Important Analytical SQL Query Presets</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                    {presets.map((preset) => (
                        <div
                            key={preset.id}
                            onClick={() => executePresetQuery(preset)}
                            className="card"
                            style={{
                                padding: '1rem',
                                cursor: 'pointer',
                                border: activePresetId === preset.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                backgroundColor: activePresetId === preset.id ? 'var(--primary-light)' : 'var(--bg-card)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                                    {preset.category}
                                </span>
                            </div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                                {preset.title}
                            </h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                                {preset.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* SQL Input Editor */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.825rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FileCode2 className="w-4 h-4 text-indigo-600" />
                        <span>SQL Buffer</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supports SELECT, JOIN, GROUP BY, SUM, AVG, HAVING, UPDATE, INSERT</span>
                </div>

                <div className="sql-console">
                    <div className="sql-header">
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>main.sqlite &gt; sql_editor.sql</span>
                        <span style={{ fontSize: '0.725rem', color: '#10b981' }}>● Database Engine Ready</span>
                    </div>
                    <textarea
                        value={customSql}
                        onChange={(e) => setCustomSql(e.target.value)}
                        rows={6}
                        className="sql-input"
                        placeholder="Write custom SQL query here..."
                    />
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="badge badge-danger" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '1rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <strong>SQLite Execution Error:</strong>
                        <div style={{ marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>{error}</div>
                    </div>
                </div>
            )}

            {/* Results Output Section */}
            {queryResult && (
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700, color: 'var(--success-text)', fontSize: '0.85rem' }}>
                                <CheckCircle2 className="w-4 h-4" />
                                Execution Success
                            </span>
                            <span className="badge badge-indigo">
                                {queryResult.queryType || 'SELECT'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
                            {queryResult.rowCount !== undefined && (
                                <span className="badge badge-slate">
                                    Rows: <strong>{queryResult.rowCount}</strong>
                                </span>
                            )}
                            {queryResult.executionTimeMs && (
                                <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <Clock className="w-3 h-3" />
                                    {queryResult.executionTimeMs} ms
                                </span>
                            )}
                            {queryResult.data && queryResult.data.length > 0 && (
                                <button onClick={handleExportResultsCSV} className="btn btn-outline btn-sm">
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Download CSV</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {queryResult.queryType === 'MUTATION' ? (
                        <div style={{ padding: '1rem', backgroundColor: 'var(--success-light)', color: 'var(--success-text)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                            <strong>Mutation Executed Successfully!</strong>
                            <p style={{ marginTop: '0.25rem' }}>Rows Changed: {queryResult.changes} | Last Insert Row ID: {queryResult.lastInsertRowid}</p>
                        </div>
                    ) : (
                        <div className="table-container" style={{ maxHeight: '350px' }}>
                            {queryResult.data && queryResult.data.length > 0 ? (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40px' }}>#</th>
                                            {queryResult.columns.map((col) => (
                                                <th key={col}>{col}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {queryResult.data.map((row, idx) => (
                                            <tr key={idx}>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{idx + 1}</td>
                                                {queryResult.columns.map((col) => (
                                                    <td key={col}>
                                                        {row[col] !== null && row[col] !== undefined ? (
                                                            typeof row[col] === 'number' ? (
                                                                <span style={{ fontWeight: 700, color: 'var(--success-text)' }}>{row[col]}</span>
                                                            ) : (
                                                                <span>{String(row[col])}</span>
                                                            )
                                                        ) : (
                                                            <span style={{ color: 'var(--text-light)', italic: true }}>NULL</span>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Query returned 0 rows.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}
