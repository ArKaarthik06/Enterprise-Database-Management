import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import TableViewer from './components/TableViewer';
import QueryConsole from './components/QueryConsole';
import AnalyticsCharts from './components/AnalyticsCharts';
import AuthModal from './components/AuthModal';
import ERDiagramModal from './components/ERDiagramModal';
import RoleDashboard from './components/RoleDashboard';
import { Database } from 'lucide-react';

function AppContent() {
    const [activeTab, setActiveTab] = useState('tables'); // 'tables' | 'charts'
    const [isERDiagramOpen, setIsERDiagramOpen] = useState(false);

    const handleExploreClick = () => {
        setActiveTab('tables');
        window.scrollTo({ top: 380, behavior: 'smooth' });
    };

    const handleRunQueryClick = () => {
        setActiveTab('tables');
        setTimeout(() => {
            const querySec = document.getElementById('query-console-section');
            if (querySec) {
                querySec.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    return (
        <div className="app-container">
            
            {/* Top Navigation */}
            <Navbar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                onOpenERDiagram={() => setIsERDiagramOpen(true)} 
            />

            {/* Main Content Area */}
            <main className="main-content">
                
                {/* Hero Banner */}
                {(activeTab === 'charts' || activeTab === 'tables')&& (
                <HeroBanner 
                    onExploreClick={handleExploreClick}
                    onRunQueryClick={handleRunQueryClick}
                    onOpenERDiagram={() => setIsERDiagramOpen(true)}
                />
                )}

                {/* Tab 1: Data Explorer & SQL Query Terminal */}
                {activeTab === 'tables' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
                        {/* 15 ER Relational Tables Explorer with CRUD */}
                        <TableViewer />

                        {/* Analytical SQL Query Console */}
                        <QueryConsole />
                    </div>
                )}

                {/* Tab 2: Analytics & Recharts */}
                {activeTab === 'charts' && (
                    <div className="animate-fade-in">
                        <AnalyticsCharts />
                    </div>
                )}

                {/* Tab 3: Role Dashboard */}
                {activeTab === 'role-dashboard' && (
                    <div className="animate-fade-in">
                        <RoleDashboard />
                    </div>
                )}

            </main>

            {/* Modals */}
            <AuthModal />
            <ERDiagramModal 
                isOpen={isERDiagramOpen} 
                onClose={() => setIsERDiagramOpen(false)} 
            />

            {/* Clean Footer */}
            <footer style={{
                backgroundColor: 'var(--bg-card)',
                borderTop: '1px solid var(--border-color)',
                padding: '1.5rem 1rem',
                marginTop: 'auto',
                fontSize: '0.8rem',
                color: 'var(--text-muted)'
            }}>
                <div style={{
                    maxWidth: '1280px',
                    margin: '0 auto',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Database className="w-4 h-4 text-indigo-600" />
                        <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>Enterprise DBMS Platform</span>
                        <span>• Relational SQLite Engine</span>
                    </div>
                    <p>© 2026 Enterprise Database Management System</p>
                </div>
            </footer>

        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
