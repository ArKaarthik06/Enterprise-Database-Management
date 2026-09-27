import React from 'react';
import { Database, Play, Network, Users, FolderGit2, DollarSign, Layers, Receipt, CalendarClock } from 'lucide-react';
import { StatCard, useFetch, fmtMoney } from './ui';

export default function HeroBanner({ onExploreClick, onRunQueryClick, onOpenERDiagram }) {
    const { data } = useFetch('/api/query/analytics-summary', null);
    const c = data?.counts || {};
    const v = (x) => (data ? x : '—');

    return (
        <div className="stack">
            <div className="card" style={{ padding: '1.5rem 1.6rem', display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ maxWidth: 640 }}>
                    <div className="page-eyebrow">Administrator overview</div>
                    <h1 className="page-title">Enterprise resource &amp; SQL workbench</h1>
                    <p className="page-subtitle">
                        Live aggregates across {v(c.tables)} relational tables — employees, projects, CRM, billing, payroll and assets — with foreign keys enforced and every write wrapped in a transaction.
                    </p>
                </div>
                <div className="toolbar">
                    <button onClick={onExploreClick} className="btn btn-primary"><Database size={16} /> Browse tables</button>
                    <button onClick={onRunQueryClick} className="btn btn-outline"><Play size={16} /> Run SQL</button>
                    <button onClick={onOpenERDiagram} className="btn btn-outline"><Network size={16} /> ER schema</button>
                </div>
            </div>

            <div className="stats-grid">
                <StatCard label="Relational tables" value={v(c.tables)} meta="3NF schema, FK enforced" icon={Layers} />
                <StatCard label="Employees" value={v(c.employees)} meta={`across ${v(c.departments)} departments`} icon={Users} tone="info" />
                <StatCard label="Active projects" value={v(c.activeProjects)} meta={`${v(c.projects)} total · ${v(c.clients)} clients`} icon={FolderGit2} tone="warning" />
                <StatCard label="Paid revenue" value={data ? fmtMoney(c.totalRevenue) : '—'} meta="Invoices marked Paid" icon={DollarSign} tone="success" />
                <StatCard label="Outstanding" value={data ? fmtMoney(c.outstanding) : '—'} meta={`${v(c.invoices)} invoices issued`} icon={Receipt} tone="danger" />
                <StatCard label="Pending leave" value={v(c.pendingLeaves)} meta="Awaiting manager approval" icon={CalendarClock} tone="neutral" />
            </div>
        </div>
    );
}
