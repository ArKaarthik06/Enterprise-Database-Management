import React, { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, 
    PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Building2, Wallet, Briefcase, CheckCircle2 } from 'lucide-react';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

export default function AnalyticsCharts() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/query/analytics-summary')
            .then(res => res.json())
            .then(data => {
                setAnalytics(data);
            })
            .catch(err => console.error('Error loading analytics charts:', err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-semibold">Compiling database analytics and rendering charts...</p>
            </div>
        );
    }

    if (!analytics) return null;

    const { deptSalaries, invoiceSummary, taskStatus, assetCategory, counts } = analytics;

    return (
        <div className="space-y-8 animate-fadeIn">
            
            {/* Overview Banner Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</p>
                        <p className="text-2xl font-black text-emerald-400 mt-1">${counts.totalRevenue.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Paid Client Invoices</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Wallet className="w-6 h-6" />
                    </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Staff</p>
                        <p className="text-2xl font-black text-indigo-400 mt-1">{counts.employees} Members</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Across {counts.departments} Departments</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Building2 className="w-6 h-6" />
                    </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projects</p>
                        <p className="text-2xl font-black text-purple-400 mt-1">{counts.projects} Active</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">With {counts.clients} Enterprise Clients</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <Briefcase className="w-6 h-6" />
                    </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hardware Assets</p>
                        <p className="text-2xl font-black text-cyan-400 mt-1">{counts.assets} Devices</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Tracked in Relational DB</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 1. Department Salaries Distribution */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center space-x-2 text-indigo-400 mb-2">
                        <BarChart3 className="w-5 h-5" />
                        <h3 className="text-lg font-bold text-white">Department Average Salary ($)</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-6">Computed using SQL AVG(salary) grouped by department</p>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptSalaries} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="department" stroke="#94a3b8" fontSize={11} angle={-15} textAnchor="end" />
                                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `$${val / 1000}k`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Average Base Salary']}
                                />
                                <Bar dataKey="avg_salary" fill="#6366f1" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Invoice Revenue Breakdown */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center space-x-2 text-purple-400 mb-2">
                        <PieChartIcon className="w-5 h-5" />
                        <h3 className="text-lg font-bold text-white">Invoice Billed Amounts by Status</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-6">SQL SUM(amount) aggregation across Paid, Pending & Overdue invoices</p>

                    <div className="h-72 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={invoiceSummary}
                                    dataKey="total_amount"
                                    nameKey="status"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={95}
                                    innerRadius={55}
                                    paddingAngle={4}
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                >
                                    {invoiceSummary.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.status === 'Paid' ? '#10b981' : entry.status === 'Pending' ? '#f59e0b' : '#ef4444'} 
                                        />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Total Amount']}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 3. Task Status Ratios */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center space-x-2 text-emerald-400 mb-2">
                        <TrendingUp className="w-5 h-5" />
                        <h3 className="text-lg font-bold text-white">Task Execution Progress Breakdown</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-6">Task volume count categorized by Pending, In Progress & Completed</p>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={taskStatus} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                                <YAxis dataKey="status" type="category" stroke="#94a3b8" fontSize={11} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                                />
                                <Bar dataKey="count" fill="#a855f7" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. Asset Categories */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center space-x-2 text-cyan-400 mb-2">
                        <Building2 className="w-5 h-5" />
                        <h3 className="text-lg font-bold text-white">Hardware Asset Distribution</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-6">Equipment count categorized by Category (Laptop, Server, Monitor, etc.)</p>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={assetCategory} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} />
                                <YAxis stroke="#94a3b8" fontSize={11} precision={0} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                                />
                                <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

        </div>
    );
}
