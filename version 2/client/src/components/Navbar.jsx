import React, { useState, useEffect, useRef } from 'react';
import { Database, Network, LogOut, Bell, CheckCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, Avatar, EmptyState, fmtDateTime } from './ui';

export default function Navbar({ tabs, activeTab, setActiveTab, onOpenERDiagram }) {
    const { user, logout } = useAuth();

    return (
        <header className="navbar">
            <div className="navbar-inner">
                <div className="brand-logo">
                    <div className="brand-icon"><Database size={18} /></div>
                    <div className="brand-text">
                        <div className="brand-title">Enterprise DBMS</div>
                        <div className="brand-subtitle">Relational workspace</div>
                    </div>
                </div>

                <nav className="nav-tabs" aria-label="Workspaces">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`nav-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                aria-current={activeTab === tab.id ? 'page' : undefined}
                            >
                                <Icon size={16} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="nav-actions">
                    <button onClick={onOpenERDiagram} className="btn btn-ghost btn-icon" title="Database ER diagram" aria-label="Database ER diagram">
                        <Network size={18} />
                    </button>

                    {user?.id && user.role !== 'SuperAdmin' && <NotificationsDropdown />}

                    <div className="user-chip">
                        <Avatar name={user.name} size="sm" />
                        <div className="user-chip-text">
                            <div className="user-chip-name">{user.name}</div>
                            <div className="user-chip-role">{user.role}</div>
                        </div>
                        <button onClick={logout} className="btn btn-ghost btn-icon btn-sm danger" title="Sign out" aria-label="Sign out">
                            <LogOut size={15} />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}

export function NotificationsDropdown() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    const fetchNotifications = () => {
        api.get(`/api/notifications?user_id=${user.id}`)
            .then(data => setNotifications(Array.isArray(data) ? data : []))
            .catch(() => {});
    };

    useEffect(() => {
        if (!user?.id) return;
        fetchNotifications();
        const timer = setInterval(fetchNotifications, 30000);
        return () => clearInterval(timer);
    }, [user?.id]);

    useEffect(() => {
        if (!isOpen) return;
        const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [isOpen]);

    const markAsRead = async (id) => {
        await api.patch(`/api/notifications/${id}/read`).catch(() => {});
        setNotifications(ns => ns.map(n => n.notification_id === id ? { ...n, is_read: 1 } : n));
    };

    const markAllRead = async () => {
        await api.patch('/api/notifications/read-all', { user_id: user.id }).catch(() => {});
        setNotifications(ns => ns.map(n => ({ ...n, is_read: 1 })));
    };

    const dismiss = async (e, id) => {
        e.stopPropagation();
        await api.del(`/api/notifications/${id}`).catch(() => {});
        setNotifications(ns => ns.filter(n => n.notification_id !== id));
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div style={{ position: 'relative' }} ref={ref}>
            <button
                onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }}
                className="btn btn-ghost btn-icon"
                style={{ position: 'relative' }}
                aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
            >
                <Bell size={18} />
                {unreadCount > 0 && <span className="dot-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="dropdown">
                    <div className="row-between" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                        <div className="strong">Notifications</div>
                        {unreadCount > 0 && (
                            <button className="btn btn-ghost btn-sm" onClick={markAllRead}><CheckCheck size={14} /> Mark all read</button>
                        )}
                    </div>
                    <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <EmptyState icon={Bell} title="You're all caught up" hint="Approvals, assignments and payments will show up here." />
                        ) : notifications.map(n => (
                            <div key={n.notification_id} className={`notif-item ${n.is_read ? '' : 'unread'}`} onClick={() => !n.is_read && markAsRead(n.notification_id)}>
                                {n.is_read ? <span style={{ width: 8 }} /> : <span className="notif-dot" />}
                                <div className="grow">
                                    <div className="strong text-sm">{n.title}</div>
                                    <div className="text-sm muted">{n.message}</div>
                                    <div className="text-xs light" style={{ marginTop: 2 }}>{fmtDateTime(n.created_at)}</div>
                                </div>
                                <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => dismiss(e, n.notification_id)} aria-label="Dismiss"><X size={13} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
