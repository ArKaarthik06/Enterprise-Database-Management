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
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: 'var(--shadow-sm)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Subtle decorative background gradient accent */}
            <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '350px',
                height: '100%',
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(59, 130, 246, 0.02) 100%)',
                pointerEvents: 'none',
                borderTopRightRadius: 'var(--radius-lg)',
                borderBottomRightRadius: 'var(--radius-lg)'
            }} />

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
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: 'var(--secondary)',
                    letterSpacing: '-0.02em',
                    marginBottom: '0.5rem',
                    lineHeight: 1.2
                }}>
                    Enterprise Resource & Analytical SQL Workbench
                </h1>

                {/* Description */}
                <p style={{
                    fontSize: '0.95rem',
                    color: 'var(--text-muted)',
                    maxWidth: '720px',
                    marginBottom: '1.5rem',
                    lineHeight: 1.5
                }}>
                    Comprehensive relational database system engineered for real-time querying, record management, multi-table aggregation, and analytics across employees, departments, projects, invoices, assets, and payroll.
                </p>

                {/* Key Metrics Overview Grid */}
                <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    <div className="stat-card">
                        <div>
                            <div className="stat-lbl">ER Tables</div>
                            <div className="stat-val" style={{ color: 'var(--primary)' }}>15</div>
                        </div>
                        <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                            <Layers className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div>
                            <div className="stat-lbl">Employees</div>
                            <div className="stat-val">{stats.employees}</div>
                        </div>
                        <div className="stat-icon" style={{ backgroundColor: 'var(--info-light)', color: 'var(--info)' }}>
                            <Users className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div>
                            <div className="stat-lbl">Active Projects</div>
                            <div className="stat-val">{stats.projects}</div>
                        </div>
                        <div className="stat-icon" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning-text)' }}>
                            <FolderGit2 className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div>
                            <div className="stat-lbl">Paid Revenue</div>
                            <div className="stat-val" style={{ color: 'var(--success-text)' }}>${stats.totalRevenue ? stats.totalRevenue.toLocaleString() : '265,000'}</div>
                        </div>
                        <div className="stat-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success-text)' }}>
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
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <span>Inspect ER Schema</span>
                    </button>
                </div>

            </div>
        </div>
    );
}
