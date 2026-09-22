import React, { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, 
    PieChart, Pie, Cell 
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Building2, Wallet, Briefcase, CheckCircle2 } from 'lucide-react';

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
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ width: '2rem', height: '2rem', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1rem auto' }} className="animate-spin" />
                <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Compiling database analytics & aggregating charts...</p>
            </div>
        );
    }

    if (!analytics) return null;

    const { deptSalaries, invoiceSummary, taskStatus, assetCategory, counts } = analytics;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Overview Stat Cards Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div>
                        <div className="stat-lbl">Total Paid Revenue</div>
                        <div className="stat-val" style={{ color: 'var(--success-text)' }}>${counts.totalRevenue.toLocaleString()}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>From Paid Invoices</div>
                    </div>
                    <div className="stat-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success-text)' }}>
                        <Wallet className="w-5 h-5" />
                    </div>
                </div>

                <div className="stat-card">
                    <div>
                        <div className="stat-lbl">Active Employees</div>
                        <div className="stat-val" style={{ color: 'var(--primary)' }}>{counts.employees} Members</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Across {counts.departments} Departments</div>
                    </div>
                    <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                        <Building2 className="w-5 h-5" />
                    </div>
                </div>

                <div className="stat-card">
                    <div>
                        <div className="stat-lbl">Active Projects</div>
                        <div className="stat-val" style={{ color: 'var(--warning-text)' }}>{counts.projects} Projects</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>With {counts.clients} Clients</div>
                    </div>
                    <div className="stat-icon" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning-text)' }}>
                        <Briefcase className="w-5 h-5" />
                    </div>
                </div>

                <div className="stat-card">
                    <div>
                        <div className="stat-lbl">Hardware Assets</div>
                        <div className="stat-val" style={{ color: 'var(--info-text)' }}>{counts.assets} Assets</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Tracked in SQLite</div>
                    </div>
                    <div className="stat-icon" style={{ backgroundColor: 'var(--info-light)', color: 'var(--info-text)' }}>
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Charts Grid Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                
                {/* 1. Department Salaries Distribution */}
                <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <BarChart3 className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                        <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)' }}>Department Average Salary ($)</h3>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                        Aggregated using SQL <code>AVG(salary)</code> grouped by department
                    </p>

                    <div style={{ height: '280px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptSalaries} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="department" stroke="#64748b" fontSize={11} angle={-15} textAnchor="end" />
                                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val / 1000}k`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Avg Base Salary']}
                                />
                                <Bar dataKey="avg_salary" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Invoice Revenue Breakdown */}
                <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <PieChartIcon className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                        <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)' }}>Invoice Revenue Breakdown</h3>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                        SQL <code>SUM(amount)</code> grouped by payment status (Paid, Pending, Overdue)
                    </p>

                    <div style={{ height: '280px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={invoiceSummary}
                                    dataKey="total_amount"
                                    nameKey="status"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={90}
                                    innerRadius={50}
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
                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Billed Amount']}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* Charts Grid Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                
                {/* 3. Task Status Ratios */}
                <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <TrendingUp className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                        <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)' }}>Task Execution Progress</h3>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                        Project task volume count by status (Completed, In Progress, Pending)
                    </p>

                    <div style={{ height: '280px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={taskStatus} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis type="number" stroke="#64748b" fontSize={11} />
                                <YAxis dataKey="status" type="category" stroke="#64748b" fontSize={11} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. Asset Categories */}
                <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <Building2 className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                        <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)' }}>Hardware Asset Distribution</h3>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                        IT Infrastructure devices categorized by hardware asset class
                    </p>

                    <div style={{ height: '280px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={assetCategory} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                                <YAxis stroke="#64748b" fontSize={11} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

        </div>
    );
}
