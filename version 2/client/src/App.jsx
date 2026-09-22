import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import TableViewer from './components/TableViewer';
import QueryConsole from './components/QueryConsole';
import AnalyticsCharts from './components/AnalyticsCharts';
import AuthModal from './components/AuthModal';
import ERDiagramModal from './components/ERDiagramModal';
import ClientApp from './components/ClientApp';
import AdminLogin from './components/AdminLogin';
import EmployeeLogin from './components/EmployeeLogin';
import ManagerDashboard from './components/ManagerDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import CRMDashboard from './components/CRMDashboard';
import { Database } from 'lucide-react';
import { useAuth } from './context/AuthContext';

function AppContent() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('tables'); // 'tables' | 'charts'
    const [isERDiagramOpen, setIsERDiagramOpen] = useState(false);

    if (user?.role === 'Client') {
        return <ClientApp />;
    }

    if (window.location.pathname === '/admin' && user?.role !== 'SuperAdmin' && user?.role !== 'Admin') {
        return <AdminLogin onLoginSuccess={() => window.location.reload()} />;
    }

    if (!user && window.location.pathname !== '/admin') {
        return <EmployeeLogin />;
    }

    const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'Admin';
    const isEmployee = user?.role === 'Employee';
    
    // Default routing
    let currentTab = activeTab;
    if (!isAdmin && activeTab === 'tables') {
        currentTab = isEmployee ? 'employee-dashboard' : 'manager-dashboard';
    }

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
                activeTab={currentTab} 
                setActiveTab={setActiveTab} 
                onOpenERDiagram={() => setIsERDiagramOpen(true)} 
            />

            {/* Main Content Area */}
            <main className="main-content">
                
                {/* Hero Banner (Only for Admins on tables or charts tab) */}
                {isAdmin && (currentTab === 'charts' || currentTab === 'tables') && (
                <HeroBanner 
                    onExploreClick={handleExploreClick}
                    onRunQueryClick={handleRunQueryClick}
                    onOpenERDiagram={() => setIsERDiagramOpen(true)}
                />
                )}

                {/* Tab 1: Data Explorer & SQL Query Terminal (Only for Admins) */}
                {currentTab === 'tables' && isAdmin && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-in">
                        <TableViewer />
                        <QueryConsole />
                    </div>
                )}

                {/* Manager Dashboard */}
                {currentTab === 'manager-dashboard' && (
                    <div className="animate-fade-in">
                        <ManagerDashboard />
                    </div>
                )}

                {/* Employee Dashboard */}
                {currentTab === 'employee-dashboard' && (
                    <div className="animate-fade-in">
                        <EmployeeDashboard />
                    </div>
                )}

                {/* CRM Dashboard */}
                {currentTab === 'crm' && (
                    <div className="animate-fade-in">
                        <CRMDashboard />
                    </div>
                )}

                {/* Tab 2: Analytics & Recharts (Only for Admins) */}
                {currentTab === 'charts' && isAdmin && (
                    <div className="animate-fade-in">
                        <AnalyticsCharts />
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
                backgroundColor: 'var(--bg-subtle)',
                borderTop: '1px solid var(--border-color)',
                padding: '1.5rem 1rem',
                marginTop: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
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
                        <Database className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                        <span style={{ fontWeight: 800, color: 'var(--primary)' }}>ENTERPRISE DBMS PLATFORM</span>
                        <span>• RELATIONAL SQLITE ENGINE</span>
                    </div>
                    <p>© 2026 ENTERPRISE DATABASE MANAGEMENT</p>
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
