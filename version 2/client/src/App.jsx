import React, { useState } from 'react';
import { BarChart3, Table, Building2, Users, Target, UserRound } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import TableViewer from './components/TableViewer';
import QueryConsole from './components/QueryConsole';
import AnalyticsCharts from './components/AnalyticsCharts';
import ERDiagramModal from './components/ERDiagramModal';
import ClientApp from './components/ClientApp';
import AdminLogin from './components/AdminLogin';
import EmployeeLogin from './components/EmployeeLogin';
import ManagerDashboard from './components/ManagerDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import CRMDashboard from './components/CRMDashboard';
import HRDashboard from './components/HRDashboard';

const ADMIN_ROLES = ['Admin', 'SuperAdmin'];

// Which workspaces each role can open. Anyone with an employee record also gets
// "My workspace" so managers can request leave, check in and see their payslips too.
function navFor(user) {
    const role = user.role;
    const isAdmin = ADMIN_ROLES.includes(role);
    const hasEmployee = Boolean(user.employee_id);
    const tabs = [];

    if (isAdmin) {
        tabs.push({ id: 'overview', label: 'Overview', icon: BarChart3 });
        tabs.push({ id: 'data', label: 'Data explorer', icon: Table });
    }
    if (isAdmin || role === 'HR Manager') tabs.push({ id: 'people', label: 'People & org', icon: Building2 });
    // Managers by role, plus any employee who has people reporting to them (e.g. a tech lead)
    if (hasEmployee && (role !== 'Employee' || user.report_count > 0)) tabs.push({ id: 'team', label: 'My team', icon: Users });
    if (isAdmin || role === 'HR Manager' || role === 'Project Manager') tabs.push({ id: 'crm', label: 'CRM', icon: Target });
    if (hasEmployee) tabs.push({ id: 'me', label: 'My workspace', icon: UserRound });
    return tabs;
}

function AppContent() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState(null);
    const [isERDiagramOpen, setIsERDiagramOpen] = useState(false);

    if (user?.role === 'Client') {
        return <ClientApp />;
    }

    if (window.location.pathname === '/admin' && !ADMIN_ROLES.includes(user?.role)) {
        return <AdminLogin />;
    }

    if (!user) {
        return <EmployeeLogin />;
    }

    const tabs = navFor(user);
    const current = tabs.some(t => t.id === activeTab) ? activeTab : tabs[0]?.id;

    const goToData = (anchor) => {
        setActiveTab('data');
        if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' }), 80);
    };

    return (
        <div className="app-container">
            <Navbar
                tabs={tabs}
                activeTab={current}
                setActiveTab={setActiveTab}
                onOpenERDiagram={() => setIsERDiagramOpen(true)}
            />

            <main className="main-content" key={current}>
                <div className="animate-fade-in">
                    {current === 'overview' && (
                        <div className="page">
                            <HeroBanner
                                onExploreClick={() => goToData()}
                                onRunQueryClick={() => goToData('query-console-section')}
                                onOpenERDiagram={() => setIsERDiagramOpen(true)}
                            />
                            <AnalyticsCharts />
                        </div>
                    )}

                    {current === 'data' && (
                        <div className="page">
                            <TableViewer />
                            <QueryConsole />
                        </div>
                    )}

                    {current === 'people' && <HRDashboard />}
                    {current === 'team' && <ManagerDashboard />}
                    {current === 'crm' && <CRMDashboard />}
                    {current === 'me' && <EmployeeDashboard />}

                    {tabs.length === 0 && (
                        <div className="card">This account has no workspaces assigned. Ask an administrator to link it to an employee record.</div>
                    )}
                </div>
            </main>

            <ERDiagramModal
                isOpen={isERDiagramOpen}
                onClose={() => setIsERDiagramOpen(false)}
            />

            <footer className="footer">
                <div className="footer-inner">
                    <span>Enterprise DBMS · SQLite relational engine · ACID transactions</span>
                    <span>© 2026 Enterprise Database Management</span>
                </div>
            </footer>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <AppContent />
            </ToastProvider>
        </AuthProvider>
    );
}
