import React, { useState } from 'react';
import { Terminal, Play, Clock, CheckCircle2, Download, Sparkles } from 'lucide-react';
import { Panel, ErrorNote, EmptyState, useFetch, api } from './ui';

const DEFAULT_SQL = `SELECT
    d.name AS department_name,
    COUNT(e.employee_id) AS staff_count,
    ROUND(AVG(e.salary), 2) AS avg_base_salary
FROM departments d
JOIN employees e ON d.department_id = e.department_id
GROUP BY d.department_id
ORDER BY avg_base_salary DESC;`;

export default function QueryConsole() {
    const presets = useFetch('/api/query/presets', []);
    const [activePresetId, setActivePresetId] = useState(null);
    const [sql, setSql] = useState(DEFAULT_SQL);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const execute = async (runner) => {
        setLoading(true);
        setError(null);
        try {
            setResult(await runner());
        } catch (err) {
            setError(err.message);
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    const runPreset = (preset) => {
        setActivePresetId(preset.id);
        setSql(preset.sql);
        execute(() => api.get(`/api/query/preset/${preset.id}`));
    };

    const runCustom = () => {
        setActivePresetId(null);
        execute(() => api.post('/api/query/execute', { sql }));
    };

    const exportCSV = () => {
        const esc = v => (v === null || v === undefined ? '' : `"${String(v).replace(/"/g, '""')}"`);
        const csv = [result.columns.join(','), ...result.data.map(r => result.columns.map(c => esc(r[c])).join(','))].join('\n');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        link.download = `query_result_${Date.now()}.csv`;
        link.click();
    };

    return (
        <div id="query-console-section">
            <Panel
                title="SQL query terminal"
                subtitle="SELECT / WITH run read-only; INSERT, UPDATE and DELETE run inside a transaction"
                icon={Terminal}
                actions={<button onClick={runCustom} disabled={loading || !sql.trim()} className="btn btn-primary btn-sm"><Play size={14} /> {loading ? 'Running…' : 'Run query'}</button>}
            >
                <div className="stack">
                    {presets.data.length > 0 && (
                        <div>
                            <div className="section-title row" style={{ gap: 6 }}><Sparkles size={13} /> Analytical presets</div>
                            <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '0.6rem' }}>
                                {presets.data.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => runPreset(p)}
                                        className="card interactive"
                                        style={{ textAlign: 'left', padding: '0.75rem 0.85rem', borderColor: activePresetId === p.id ? 'var(--primary)' : undefined, background: activePresetId === p.id ? 'var(--primary-light)' : undefined }}
                                    >
                                        <div className="text-xs strong" style={{ color: 'var(--primary)', marginBottom: 2 }}>{p.category}</div>
                                        <div className="strong text-sm">{p.title}</div>
                                        <div className="text-xs muted" style={{ marginTop: 3, lineHeight: 1.35 }}>{p.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="sql-console">
                        <div className="sql-header">
                            <span>enterprise.db › query.sql</span>
                            <span>Ctrl + Enter to run</span>
                        </div>
                        <textarea
                            value={sql}
                            onChange={e => setSql(e.target.value)}
                            onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runCustom(); } }}
                            rows={8}
                            className="sql-input"
                            spellCheck={false}
                            aria-label="SQL query"
                        />
                    </div>

                    <ErrorNote message={error && `SQLite error: ${error}`} />

                    {result && (
                        <div className="stack-sm">
                            <div className="row-between wrap">
                                <div className="row text-sm">
                                    <CheckCircle2 size={16} className="text-success" />
                                    <span className="strong">{result.queryType === 'MUTATION' ? 'Statement committed' : `${result.rowCount} row${result.rowCount === 1 ? '' : 's'}`}</span>
                                    {result.executionTimeMs && <span className="muted row" style={{ gap: 4 }}><Clock size={13} />{result.executionTimeMs} ms</span>}
                                </div>
                                {result.data?.length > 0 && <button onClick={exportCSV} className="btn btn-outline btn-sm"><Download size={14} /> CSV</button>}
                            </div>

                            {result.queryType === 'MUTATION' ? (
                                <div className="alert tone-success">Rows changed: <strong>{result.changes}</strong> · last insert rowid: <span className="mono">{String(result.lastInsertRowid)}</span></div>
                            ) : result.data?.length > 0 ? (
                                <div className="table-container bordered" style={{ maxHeight: 380 }}>
                                    <table className="data-table dense">
                                        <thead><tr><th className="num">#</th>{result.columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
                                        <tbody>
                                            {result.data.map((row, i) => (
                                                <tr key={i}>
                                                    <td className="num light">{i + 1}</td>
                                                    {result.columns.map(c => (
                                                        <td key={c} className={typeof row[c] === 'number' ? 'num' : ''}>
                                                            {row[c] === null || row[c] === undefined ? <span className="null">NULL</span> : String(row[c])}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="card"><EmptyState title="Query returned 0 rows" /></div>
                            )}
                        </div>
                    )}
                </div>
            </Panel>
        </div>
    );
}
