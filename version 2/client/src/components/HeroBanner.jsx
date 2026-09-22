import React, { useState, useEffect } from 'react';
import { Database, Play, Sparkles, Building2, Users, FolderGit2, DollarSign, Layers } from 'lucide-react';

export default function HeroBanner({ onExploreClick, onRunQueryClick, onOpenERDiagram }) {
    const [stats, setStats] = useState({
        employees: 8,
        departments: 5,
        projects: 4,
        totalRevenue: 265000
    });

    useEffect(() => {
        fetch('/api/query/analytics-summary')
            .then(res => res.json())
            .then(data => {
                if (data && data.counts) {
                    setStats({
                        employees: data.counts.employees || 8,
                        departments: data.counts.departments || 5,
                        projects: data.counts.projects || 4,
                        totalRevenue: data.counts.totalRevenue || 265000
                    });
                }
            })
            .catch(() => {});
    }, []);

    return (
        <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--primary)',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: 'var(--shadow-glow)',
            position: 'relative',
            overflow: 'hidden'
        }}>

            <div style={{ position: 'relative', zIndex: 2, maxWidth: '100%' }}>
                
                {/* Top Badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    <span className="badge badge-indigo">
                        <Sparkles className="w-3.5 h-3.5" />
                        Relational DBMS (15 ER Tables)
                    </span>
                    <span className="badge badge-success">
                        SQLite Active
                    </span>
                </div>

                {/* Hero Title */}
                <h1 style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--primary)',
                    letterSpacing: '-0.02em',
                    marginBottom: '1rem',
                    lineHeight: 1.1
                }}>
                    Enterprise Resource &<br/>Analytical SQL Workbench
                </h1>

                {/* Description */}
                <p style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    maxWidth: '720px',
                    marginBottom: '2rem',
                    lineHeight: 1.5
                }}>
                    Comprehensive relational database system engineered for real-time querying, record management, multi-table aggregation, and analytics across employees, departments, projects, invoices, assets, and payroll.
                </p>

                {/* Key Metrics Overview Grid */}
                <div className="stats-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    <div className="stat-card" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-page)', borderRadius: '0' }}>
                        <div>
                            <div className="stat-lbl" style={{ fontFamily: 'var(--font-mono)' }}>ER Tables</div>
                            <div className="stat-val" style={{ color: 'var(--primary)', fontFamily: 'var(--font-sans)' }}>15</div>
                        </div>
                        <div className="stat-icon" style={{ backgroundColor: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '0' }}>
                            <Layers className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="stat-card" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-page)', borderRadius: '0' }}>
                        <div>
                            <div className="stat-lbl" style={{ fontFamily: 'var(--font-mono)' }}>Employees</div>
                            <div className="stat-val" style={{ color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>{stats.employees}</div>
                        </div>
                        <div className="stat-icon" style={{ backgroundColor: 'transparent', border: '1px solid var(--text-main)', color: 'var(--text-main)', borderRadius: '0' }}>
                            <Users className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="stat-card" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-page)', borderRadius: '0' }}>
                        <div>
                            <div className="stat-lbl" style={{ fontFamily: 'var(--font-mono)' }}>Active Projects</div>
                            <div className="stat-val" style={{ color: 'var(--warning)', fontFamily: 'var(--font-sans)' }}>{stats.projects}</div>
                        </div>
                        <div className="stat-icon" style={{ backgroundColor: 'transparent', border: '1px solid var(--warning)', color: 'var(--warning)', borderRadius: '0' }}>
                            <FolderGit2 className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="stat-card" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-page)', borderRadius: '0' }}>
                        <div>
                            <div className="stat-lbl" style={{ fontFamily: 'var(--font-mono)' }}>Paid Revenue</div>
                            <div className="stat-val" style={{ color: 'var(--success)', fontFamily: 'var(--font-sans)' }}>${stats.totalRevenue ? stats.totalRevenue.toLocaleString() : '265,000'}</div>
                        </div>
                        <div className="stat-icon" style={{ backgroundColor: 'transparent', border: '1px solid var(--success)', color: 'var(--success)', borderRadius: '0' }}>
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Quick Action CTA Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                        onClick={onExploreClick}
                        className="btn btn-primary"
                    >
                        <Database className="w-4 h-4" />
                        <span>Explore 15 Tables</span>
                    </button>

                    <button
                        onClick={onRunQueryClick}
                        className="btn btn-secondary"
                    >
                        <Play className="w-4 h-4" />
                        <span>Execute SQL Queries</span>
                    </button>

                    <button
                        onClick={onOpenERDiagram}
                        className="btn btn-outline"
                    >
                        <Building2 className="w-4 h-4" />
                        <span>Inspect ER Schema</span>
                    </button>
                </div>

            </div>
        </div>
    );
}
