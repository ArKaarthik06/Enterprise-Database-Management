import React, { useState, useEffect } from 'react';
import { Terminal, Play, Sparkles, Clock, Layers, FileCode2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

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

    return (
        <div id="query-console-section" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl mb-8">
            
            {/* Console Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <div className="flex items-center space-x-2 text-emerald-400 mb-1">
                        <Terminal className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">DBMS Course Analytical SQL Console</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Preset & Custom SQL Query Execution</h2>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleExecuteCustomSql}
                        disabled={loading}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg glow-blue flex items-center space-x-2 transition-all disabled:opacity-50"
                    >
                        {loading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4 fill-white" />
                        )}
                        <span>Run SQL Command</span>
                    </button>
                </div>
            </div>

            {/* Presets Grid */}
            <div className="mb-6">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Important Course DBMS Analytical Query Presets</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {presets.map((preset) => (
                        <div
                            key={preset.id}
                            onClick={() => executePresetQuery(preset)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                activePresetId === preset.id
                                    ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] uppercase font-bold text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                                    {preset.category}
                                </span>
                                <Play className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-400" />
                            </div>
                            <h4 className="text-xs font-bold text-white mb-1 leading-snug">{preset.title}</h4>
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{preset.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Interactive SQL Terminal Input */}
            <div className="mb-6">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                    <div className="flex items-center space-x-2">
                        <FileCode2 className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-slate-200">SQL Terminal Buffer</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Supports SELECT, JOIN, GROUP BY, SUM, AVG, HAVING</span>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                    <textarea
                        value={customSql}
                        onChange={(e) => setCustomSql(e.target.value)}
                        rows={6}
                        className="w-full p-4 font-mono text-xs text-emerald-300 bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-y leading-relaxed"
                        placeholder="Write your custom SQL query here..."
                    />
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl mb-6 flex items-start space-x-3 text-rose-300 text-xs font-mono">
                    <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-rose-200">SQLite Execution Error:</p>
                        <p className="mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Results Output Section */}
            {queryResult && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    {/* Execution Meta Bar */}
                    <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2 text-xs font-mono">
                        <div className="flex items-center space-x-3">
                            <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Execution Success</span>
                            </span>
                            <span className="text-slate-500">|</span>
                            <span className="text-slate-300">
                                Type: <strong className="text-indigo-400">{queryResult.queryType || 'SELECT'}</strong>
                            </span>
                        </div>

                        <div className="flex items-center space-x-4 text-slate-400 text-[11px]">
                            {queryResult.rowCount !== undefined && (
                                <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                                    Rows: <strong className="text-white">{queryResult.rowCount}</strong>
                                </span>
                            )}
                            {queryResult.executionTimeMs && (
                                <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center space-x-1">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    <span>{queryResult.executionTimeMs} ms</span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Mutation Output */}
                    {queryResult.queryType === 'MUTATION' ? (
                        <div className="p-4 text-xs font-mono text-emerald-400 bg-slate-900/50 rounded-xl">
                            <p>Query executed successfully.</p>
                            <p className="text-slate-400 mt-1">Rows Affected: {queryResult.changes} | Last Row ID: {queryResult.lastInsertRowid}</p>
                        </div>
                    ) : (
                        /* Results Table */
                        <div className="overflow-x-auto max-h-96 scrollbar-thin">
                            {queryResult.data && queryResult.data.length > 0 ? (
                                <table className="w-full text-left text-xs font-mono text-slate-200">
                                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 sticky top-0">
                                        <tr>
                                            <th className="p-3 text-slate-500">#</th>
                                            {queryResult.columns.map((col) => (
                                                <th key={col} className="p-3 text-indigo-300">{col}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {queryResult.data.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-900/50">
                                                <td className="p-3 text-slate-600 text-[10px]">{idx + 1}</td>
                                                {queryResult.columns.map((col) => (
                                                    <td key={col} className="p-3">
                                                        {row[col] !== null && row[col] !== undefined ? (
                                                            typeof row[col] === 'number' ? (
                                                                <span className="text-emerald-400 font-semibold">{row[col]}</span>
                                                            ) : (
                                                                <span>{String(row[col])}</span>
                                                            )
                                                        ) : (
                                                            <span className="text-slate-600 italic">NULL</span>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="p-6 text-center text-slate-500 text-xs font-sans">
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
