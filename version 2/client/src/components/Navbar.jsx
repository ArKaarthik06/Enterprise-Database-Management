import React, { useState, useEffect } from 'react';
import { Database, BarChart3, Table, Network, LogIn, LogOut, ShieldCheck, UserRound, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab, onOpenERDiagram }) {
    const { user, isAuthenticated, setIsAuthModalOpen, logout } = useAuth();
    const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'Admin';

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
                            <span className="brand-title">ENTERPRISE<span style={{ color: 'var(--primary)' }}>DBMS</span></span>
                            <span className="badge badge-indigo">
                                RELATIONAL SQL
                            </span>
                        </div>
                        <p className="brand-subtitle">ENTERPRISE DATABASE MANAGEMENT</p>
                    </div>
                </div>

                {/* Center Navigation Tabs */}
                <nav className="nav-tabs">
                    {(!isAuthenticated || isAdmin) && (
                        <button
                            onClick={() => setActiveTab('tables')}
                            className={`nav-tab-btn ${activeTab === 'tables' ? 'active' : ''}`}
                        >
                            <Table className="w-4 h-4" />
                            <span>Data Explorer & SQL</span>
                        </button>
                    )}

                    {isAuthenticated && !isAdmin && user?.role === 'Employee' && (
                        <button
                            onClick={() => setActiveTab('employee-dashboard')}
                            className={`nav-tab-btn ${activeTab === 'employee-dashboard' ? 'active' : ''}`}
                        >
                            <UserRound className="w-4 h-4" />
                            <span>Employee Dashboard</span>
                        </button>
                    )}

                    {isAuthenticated && !isAdmin && user?.role !== 'Employee' && (
                        <>
                            <button
                                onClick={() => setActiveTab('manager-dashboard')}
                                className={`nav-tab-btn ${activeTab === 'manager-dashboard' ? 'active' : ''}`}
                            >
                                <Table className="w-4 h-4" />
                                <span>Manager Dashboard</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('crm')}
                                className={`nav-tab-btn ${activeTab === 'crm' ? 'active' : ''}`}
                            >
                                <UserRound className="w-4 h-4" />
                                <span>CRM Module</span>
                            </button>
                        </>
                    )}

                    {(!isAuthenticated || isAdmin) && (
                        <button
                            onClick={() => setActiveTab('charts')}
                            className={`nav-tab-btn ${activeTab === 'charts' ? 'active' : ''}`}
                        >
                            <BarChart3 className="w-4 h-4" />
                            <span>Analytics & Charts</span>
                        </button>
                    )}
                </nav>

                {/* Right Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {isAuthenticated && <NotificationsDropdown />}

                    {/* ER Diagram View Button */}
                    <button
                        onClick={onOpenERDiagram}
                        className="btn btn-outline btn-sm"
                        title="View Database ER Diagram"
                    >
                        <Network className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                        <span>ER Diagram</span>
                    </button>

                    {/* Auth Status */}
                    {isAuthenticated ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
                            <ShieldCheck className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{user.name.toUpperCase()}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{user.role.toUpperCase()}</div>
                            </div>
                            <button
                                onClick={logout}
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '0.25rem' }}
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4" style={{ color: 'var(--danger)' }} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAuthModalOpen(true)}
                            className="btn btn-primary btn-sm"
                        >
                            <LogIn className="w-4 h-4" />
                            <span>System Login</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}

function NotificationsDropdown() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = () => {
        fetch(`/api/notifications?user_id=${user.id}`)
            .then(res => res.json())
            .then(data => setNotifications(data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        if (user?.id) fetchNotifications();
    }, [user?.id]);

    const markAsRead = async (id) => {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
            setNotifications(notifications.map(n => n.notification_id === id ? { ...n, is_read: 1 } : n));
        } catch (err) {
            console.error(err);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div style={{ position: 'relative' }}>
            <button 
                onClick={() => { setIsOpen(!isOpen); if(!isOpen) fetchNotifications(); }}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.5rem', position: 'relative' }}
            >
                <Bell className="w-4 h-4" style={{ color: unreadCount > 0 ? 'var(--primary)' : 'var(--text-main)' }} />
                {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)', color: 'white', fontSize: '0.65rem', padding: '0 0.3rem', borderRadius: '10px', fontFamily: 'var(--font-mono)' }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{ 
                    position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0, width: '320px', 
                    background: 'var(--bg-card)', border: '1px solid var(--border-color)', 
                    boxShadow: 'var(--shadow-glow)', zIndex: 1000 
                }}>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-subtle)' }}>
                        <h4 style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-main)' }}>Notifications</h4>
                    </div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>No notifications</div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.notification_id} style={{ 
                                    padding: '1rem', borderBottom: '1px solid var(--border-color)', 
                                    background: n.is_read ? 'transparent' : 'var(--primary-light)',
                                    cursor: 'pointer'
                                }} onClick={() => !n.is_read && markAsRead(n.notification_id)}>
                                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>{n.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{n.message}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{n.created_at}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
