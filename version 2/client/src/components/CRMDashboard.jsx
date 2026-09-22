import React, { useState } from 'react';
import LeadsKanban from './LeadsKanban';
import ClientDirectory from './ClientDirectory';
import InvoicesView from './InvoicesView';
import { Target, Users, Receipt } from 'lucide-react';

export default function CRMDashboard() {
    const [activeTab, setActiveTab] = useState('pipeline');

    const tabs = [
        { id: 'pipeline', label: 'Sales Pipeline', icon: Target },
        { id: 'clients', label: 'Client Directory', icon: Users },
        { id: 'invoices', label: 'Invoices & Billing', icon: Receipt }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2rem', background: 'var(--bg-page)', color: 'var(--text-main)', overflowY: 'auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '2rem', textTransform: 'uppercase', color: 'var(--primary)', margin: 0, textShadow: 'var(--shadow-glow)' }}>
                    Customer Relationship Management
                </h2>
                <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Manage your leads, clients, and billing lifecycle.</p>
            </div>

            {/* Sub-Navigation */}
            <div style={{ display: 'flex', borderBottom: '2px solid var(--border-color)', marginBottom: '2rem' }}>
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                background: isActive ? 'var(--primary)' : 'transparent',
                                color: isActive ? 'var(--primary-text)' : 'var(--text-muted)',
                                border: 'none',
                                borderTop: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                                borderRight: '1px solid var(--border-color)',
                                padding: '1rem 1.5rem',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            className="hover:bg-white/10"
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1 }}>
                {activeTab === 'pipeline' && <LeadsKanban />}
                {activeTab === 'clients' && <ClientDirectory />}
                {activeTab === 'invoices' && <InvoicesView />}
            </div>
        </div>
    );
}
