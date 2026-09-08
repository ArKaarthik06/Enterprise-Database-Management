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
        <div className="relative overflow-hidden rounded-3xl mb-8 border border-slate-800 shadow-2xl">
            {/* Background Image with Dark Gradient Overlay */}
            <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                style={{ backgroundImage: `url('/hero_bg.jpg')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-indigo-950/70" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />

            {/* Content Overlay */}
            <div className="relative z-10 p-6 md:p-10 lg:p-12 text-white max-w-5xl">
                
                {/* Badge */}
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-semibold mb-4 backdrop-blur-md">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Relational Database Management System (15 ER Tables)</span>
                </div>

                {/* Hero Title */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white leading-tight">
                    Enterprise Record & <br className="hidden sm:block"/>
                    <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                        Analytical SQL Query Workbench
                    </span>
                </h1>

                {/* Description */}
                <p className="text-slate-300 text-sm sm:text-base max-w-2xl mb-8 leading-relaxed">
                    Comprehensive enterprise resource platform engineered for viewing, sorting, aggregating, and executing complex SQL queries across products, employees, departments, projects, invoices, assets, and payroll.
                </p>

                {/* Key Metrics Overview Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="glass-panel p-3.5 rounded-2xl border border-slate-700/50">
                        <div className="flex items-center space-x-2 text-indigo-400 mb-1">
                            <Layers className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ER Tables</span>
                        </div>
                        <p className="text-2xl font-black text-white">15 Tables</p>
                    </div>

                    <div className="glass-panel p-3.5 rounded-2xl border border-slate-700/50">
                        <div className="flex items-center space-x-2 text-purple-400 mb-1">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Employees</span>
                        </div>
                        <p className="text-2xl font-black text-white">{stats.employees}</p>
                    </div>

                    <div className="glass-panel p-3.5 rounded-2xl border border-slate-700/50">
                        <div className="flex items-center space-x-2 text-cyan-400 mb-1">
                            <FolderGit2 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Projects</span>
                        </div>
                        <p className="text-2xl font-black text-white">{stats.projects}</p>
                    </div>

                    <div className="glass-panel p-3.5 rounded-2xl border border-slate-700/50">
                        <div className="flex items-center space-x-2 text-emerald-400 mb-1">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Paid Invoices</span>
                        </div>
                        <p className="text-2xl font-black text-emerald-400">${stats.totalRevenue ? stats.totalRevenue.toLocaleString() : '265,000'}</p>
                    </div>
                </div>

                {/* Quick Action CTA Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={onExploreClick}
                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm flex items-center space-x-2 shadow-lg glow-purple transition-all"
                    >
                        <Database className="w-4 h-4" />
                        <span>Explore Tabular Records</span>
                    </button>

                    <button
                        onClick={onRunQueryClick}
                        className="px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-bold text-sm flex items-center space-x-2 border border-slate-700 shadow transition-all"
                    >
                        <Play className="w-4 h-4 text-emerald-400" />
                        <span>Execute SQL Queries</span>
                    </button>

                    <button
                        onClick={onOpenERDiagram}
                        className="px-4 py-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-indigo-300 font-semibold text-sm flex items-center space-x-2 border border-indigo-500/30 transition-all"
                    >
                        <Building2 className="w-4 h-4" />
                        <span>Inspect ER Schema</span>
                    </button>
                </div>

            </div>
        </div>
    );
}
