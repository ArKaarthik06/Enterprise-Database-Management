import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Key, ShieldCheck, X, Sparkles, ArrowRight } from 'lucide-react';

export default function AuthModal() {
    const { isAuthModalOpen, setIsAuthModalOpen, login, quickUsers } = useAuth();
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!isAuthModalOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(username, password);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickSelect = (userObj) => {
        setUsername(userObj.username);
        setPassword(userObj.password);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden glass-panel">
                
                {/* Close Button */}
                <button
                    onClick={() => setIsAuthModalOpen(false)}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="p-6 pb-4 border-b border-slate-800 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 glow-indigo">
                        <Lock className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Enterprise Authentication</h2>
                    <p className="text-xs text-slate-400 mt-1">Sign in to access DBMS query console & confidential records</p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    
                    {error && (
                        <div className="p-3 text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-xl">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                Username or Email
                            </label>
                            <div className="relative">
                                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Enter username"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Key className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Enter password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg glow-indigo transition-all flex items-center justify-center space-x-2"
                        >
                            {loading ? <span>Signing in...</span> : (
                                <>
                                    <span>Authenticate User</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Preset Role Quick Select (Perfect for Demo Evaluation) */}
                    <div>
                        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-2">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Quick Demo Accounts (1-Click Fill)</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {quickUsers.slice(0, 4).map((u, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleQuickSelect(u)}
                                    className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-left transition-colors group"
                                >
                                    <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-300">{u.name}</p>
                                    <p className="text-[10px] text-slate-400">{u.role_name} ({u.username})</p>
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-950/60 border-t border-slate-800 text-center">
                    <p className="text-[11px] text-slate-500">
                        DBMS Project Coursework Authentication • SQLite Relational Engine
                    </p>
                </div>

            </div>
        </div>
    );
}
