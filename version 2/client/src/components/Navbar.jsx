import React from 'react';
import { Database, BarChart3, Table, Network, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab, onOpenERDiagram }) {
    const { user, isAuthenticated, setIsAuthModalOpen, logout } = useAuth();

    return (
        <header className="navbar">
            <div className="navbar-inner">
                
                {/* Brand Logo & Title */}
                <div className="brand-logo">
                    <div className="brand-icon">
                        <Database className="w-5 h-5" />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="brand-title">Enterprise<span style={{ color: '#4f46e5' }}>DBMS</span></span>
                            <span className="badge badge-indigo">
                                Relational SQL
                            </span>
                        </div>
                        <p className="brand-subtitle">Enterprise Database Management System</p>
                    </div>
                </div>

                {/* Center Navigation Tabs */}
                <nav className="nav-tabs">
                    <button
                        onClick={() => setActiveTab('tables')}
                        className={`nav-tab-btn ${activeTab === 'tables' ? 'active' : ''}`}
                    >
                        <Table className="w-4 h-4" />
                        <span>Data Explorer & SQL</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('charts')}
                        className={`nav-tab-btn ${activeTab === 'charts' ? 'active' : ''}`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        <span>Analytics & Charts</span>
                    </button>
                </nav>

                {/* Right Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* ER Diagram View Button */}
                    <button
                        onClick={onOpenERDiagram}
                        className="btn btn-outline btn-sm"
                        title="View Database ER Diagram"
                    >
                        <Network className="w-4 h-4 text-indigo-600" />
                        <span>ER Diagram</span>
                    </button>

                    {/* Auth Status */}
                    {isAuthenticated ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.65rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)' }}>{user.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.role}</div>
                            </div>
                            <button
                                onClick={logout}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '0.2rem 0.4rem', color: 'var(--danger-text)' }}
                                title="Sign Out"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAuthModalOpen(true)}
                            className="btn btn-primary btn-sm"
                        >
                            <LogIn className="w-4 h-4" />
                            <span>Sign In</span>
                        </button>
                    )}
                </div>

            </div>
        </header>
    );
}
