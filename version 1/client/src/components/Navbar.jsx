import React from 'react';
import { Database, BarChart3, Table, FileText, UserCheck, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab, onOpenERDiagram }) {
    const { user, isAuthenticated, setIsAuthModalOpen, logout } = useAuth();

    return (
        <header className="sticky top-0 z-40 glass-nav px-4 lg:px-8 py-3 transition-all duration-200">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                
                {/* Brand Title */}
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg glow-purple">
                        <Database className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-lg text-white tracking-wide">Enterprise<span className="text-indigo-400">DBMS</span></span>
                            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                Relational SQL
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 hidden sm:block">Database Management System Course Project</p>
                    </div>
                </div>

                {/* 2 Primary Navbar Sections */}
                <nav className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setActiveTab('tables')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            activeTab === 'tables'
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md glow-indigo'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                    >
                        <Table className="w-4 h-4" />
                        <span>Tabular Data & Queries</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('charts')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            activeTab === 'charts'
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md glow-indigo'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        <span>Data Charts & Analytics</span>
                    </button>
                </nav>

                {/* Right Actions */}
                <div className="flex items-center space-x-3">
                    {/* ER Diagram View Button */}
                    <button
                        onClick={onOpenERDiagram}
                        className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                        title="View Database ER Diagram"
                    >
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span>ER Diagram</span>
                    </button>

                    {/* Auth Status */}
                    {isAuthenticated ? (
                        <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 pl-3 pr-1 py-1 rounded-xl">
                            <div className="flex items-center space-x-2 text-xs">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <div className="text-left hidden xl:block">
                                    <p className="font-semibold text-slate-200 text-xs leading-none">{user.name}</p>
                                    <p className="text-[10px] text-slate-400 leading-tight">{user.role}</p>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAuthModalOpen(true)}
                            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
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
