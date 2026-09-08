import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import TableViewer from './components/TableViewer';
import QueryConsole from './components/QueryConsole';
import AnalyticsCharts from './components/AnalyticsCharts';
import AuthModal from './components/AuthModal';
import ERDiagramModal from './components/ERDiagramModal';
import { Database, ShieldCheck, Github, BookOpen } from 'lucide-react';

function AppContent() {
    const [activeTab, setActiveTab] = useState('tables'); // 'tables' | 'charts'
    const [isERDiagramOpen, setIsERDiagramOpen] = useState(false);

    const handleExploreClick = () => {
        setActiveTab('tables');
        window.scrollTo({ top: 400, behavior: 'smooth' });
    };

    const handleRunQueryClick = () => {
        setActiveTab('tables');
        const querySec = document.getElementById('query-console-section');
        if (querySec) {
            querySec.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
            
            {/* Top Navigation */}
            <Navbar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                onOpenERDiagram={() => setIsERDiagramOpen(true)} 
            />

            {/* Main Container */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
                
                {/* Hero Banner */}
                <HeroBanner 
                    onExploreClick={handleExploreClick}
                    onRunQueryClick={handleRunQueryClick}
                    onOpenERDiagram={() => setIsERDiagramOpen(true)}
                />

                {/* Navbar Tab 1: Tabular Data & Querying */}
                {activeTab === 'tables' && (
                    <div className="space-y-8 animate-fadeIn">
                        {/* 15 ER Tables Explorer */}
                        <TableViewer />

                        {/* SQL Analytical Query Console & Terminal */}
                        <QueryConsole />
                    </div>
                )}

                {/* Navbar Tab 2: Data Charts & Analytics */}
                {activeTab === 'charts' && (
                    <AnalyticsCharts />
                )}

            </main>

            {/* Modals */}
            <AuthModal />
            <ERDiagramModal 
                isOpen={isERDiagramOpen} 
                onClose={() => setIsERDiagramOpen(false)} 
            />

            {/* Footer */}
            <footer className="border-t border-slate-900 bg-slate-950/90 py-8 px-4 text-center text-xs text-slate-500 mt-12">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-slate-300">Enterprise DBMS Project</span>
                        <span>• Relational SQL Database</span>
                    </div>
                    <p>© 2026 Database Management System Course Submission</p>
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
