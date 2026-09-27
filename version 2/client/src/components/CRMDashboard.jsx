import React, { useState } from 'react';
import { Target, Users, Receipt, TrendingUp, Trophy, AlertTriangle } from 'lucide-react';
import LeadsKanban from './LeadsKanban';
import ClientDirectory from './ClientDirectory';
import InvoicesView from './InvoicesView';
import { PageHeader, Tabs, StatCard, useFetch, fmtMoney } from './ui';

export default function CRMDashboard() {
    const [activeTab, setActiveTab] = useState('pipeline');
    const leads = useFetch('/api/crm/leads', []);
    const invoices = useFetch('/api/crm/invoices', []);

    const openLeads = leads.data.filter(l => !['Won', 'Lost'].includes(l.status));
    const won = leads.data.filter(l => l.status === 'Won');
    const closed = won.length + leads.data.filter(l => l.status === 'Lost').length;
    const outstanding = invoices.data.filter(i => !['Paid', 'Cancelled'].includes(i.status));

    const tabs = [
        { id: 'pipeline', label: 'Sales pipeline', icon: Target, count: openLeads.length },
        { id: 'clients', label: 'Clients', icon: Users },
        { id: 'invoices', label: 'Invoices & billing', icon: Receipt, count: outstanding.filter(i => i.is_overdue || i.status === 'Overdue').length, attention: true }
    ];

    return (
        <div className="page">
            <PageHeader eyebrow="Customer relationships" title="CRM" subtitle="Move leads through the pipeline, convert them into clients and bill their projects." />

            <div className="stats-grid">
                <StatCard label="Open pipeline" value={fmtMoney(openLeads.reduce((s, l) => s + (l.expected_value || 0), 0))} meta={`${openLeads.length} active leads`} icon={TrendingUp} />
                <StatCard label="Won deals" value={fmtMoney(won.reduce((s, l) => s + (l.expected_value || 0), 0))} meta={`Win rate ${closed ? Math.round((won.length / closed) * 100) : 0}%`} icon={Trophy} tone="success" />
                <StatCard label="Outstanding invoices" value={fmtMoney(outstanding.reduce((s, i) => s + i.amount, 0))} meta={`${outstanding.length} unpaid`} icon={Receipt} tone="warning" />
                <StatCard label="Overdue" value={outstanding.filter(i => i.is_overdue || i.status === 'Overdue').length} meta="Past due date and unpaid" icon={AlertTriangle} tone="danger" />
            </div>

            <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

            <div className="animate-fade-in" key={activeTab}>
                {activeTab === 'pipeline' && <LeadsKanban leads={leads} />}
                {activeTab === 'clients' && <ClientDirectory />}
                {activeTab === 'invoices' && <InvoicesView invoices={invoices} />}
            </div>
        </div>
    );
}
