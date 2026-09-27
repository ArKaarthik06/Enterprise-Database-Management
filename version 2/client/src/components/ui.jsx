import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Inbox, AlertTriangle, Info } from 'lucide-react';

// ============================================================
// API helper - throws with the server's error message on non-2xx
// ============================================================
async function request(method, url, body) {
    const res = await fetch(url, {
        method,
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined
    });
    let data = null;
    try { data = await res.json(); } catch { /* empty body */ }
    if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
    return data;
}

export const api = {
    get: (url) => request('GET', url),
    post: (url, body = {}) => request('POST', url, body),
    put: (url, body = {}) => request('PUT', url, body),
    patch: (url, body = {}) => request('PATCH', url, body),
    del: (url) => request('DELETE', url)
};

// Fetches JSON and keeps loading / error / reload together.
// `fallback` is what `data` holds before the first load or after an error, so
// callers can safely `.map()` without guarding against error payloads.
export function useFetch(url, fallback = null) {
    const [data, setData] = useState(fallback);
    const [loading, setLoading] = useState(Boolean(url));
    const [error, setError] = useState(null);
    const fallbackRef = useRef(fallback);

    const load = useCallback(async () => {
        if (!url) { setLoading(false); return; }
        setLoading(true);
        try {
            setData(await api.get(url));
            setError(null);
        } catch (err) {
            setError(err.message);
            setData(fallbackRef.current);
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => { load(); }, [load]);
    return { data, loading, error, reload: load, setData };
}

// ============================================================
// Formatters
// ============================================================
export const fmtMoney = (v, digits = 0) =>
    v === null || v === undefined || v === '' ? '—'
        : `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

export const fmtDate = (v) => {
    if (!v) return '—';
    const d = new Date(String(v).length === 10 ? `${v}T00:00:00` : String(v).replace(' ', 'T'));
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

export const fmtDateTime = (v) => {
    if (!v) return '—';
    const d = new Date(String(v).replace(' ', 'T') + (String(v).includes('Z') || String(v).length <= 10 ? '' : 'Z'));
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

export const fullName = (o, first = 'first_name', last = 'last_name') =>
    o && (o[first] || o[last]) ? `${o[first] || ''} ${o[last] || ''}`.trim() : '';

export const code = (prefix, id) => `${prefix}-${String(id).padStart(4, '0')}`;

export const todayISO = () => new Date().toLocaleDateString('en-CA');

export const isPastDue = (date, status) =>
    Boolean(date) && !['Completed', 'Paid', 'Cancelled'].includes(status) && date < todayISO();

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ============================================================
// Toasts
// ============================================================
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const push = useCallback((message, type = 'success') => {
        const id = Math.random().toString(36).slice(2);
        setToasts(t => [...t, { id, message, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), type === 'error' ? 5000 : 3000);
    }, []);

    const toast = useCallback((m) => push(m, 'success'), [push]);
    toast.error = (m) => push(m, 'error');

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="toast-stack" role="status" aria-live="polite">
                {toasts.map(t => (
                    <div key={t.id} className={`toast ${t.type}`}>
                        {t.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}

// Runs an async mutation, shows a toast for success/failure, returns true on success.
export function useAction() {
    const toast = useToast();
    return useCallback(async (fn, successMessage) => {
        try {
            const result = await fn();
            if (successMessage) toast(typeof successMessage === 'function' ? successMessage(result) : successMessage);
            return result ?? true;
        } catch (err) {
            toast.error(err.message);
            return false;
        }
    }, [toast]);
}

// ============================================================
// Layout pieces
// ============================================================
export function PageHeader({ eyebrow, title, subtitle, actions }) {
    return (
        <div className="page-header">
            <div>
                {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
                <h1 className="page-title">{title}</h1>
                {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="page-actions">{actions}</div>}
        </div>
    );
}

export function Tabs({ tabs, active, onChange }) {
    return (
        <div className="tabs" role="tablist">
            {tabs.map(t => {
                const Icon = t.icon;
                return (
                    <button
                        key={t.id}
                        role="tab"
                        aria-selected={active === t.id}
                        className={`tab ${active === t.id ? 'active' : ''}`}
                        onClick={() => onChange(t.id)}
                    >
                        {Icon && <Icon size={16} />}
                        {t.label}
                        {t.count !== undefined && t.count !== null && (
                            <span className={`tab-count ${t.attention && t.count > 0 ? 'attention' : ''}`}>{t.count}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

export function Panel({ title, subtitle, icon: Icon, actions, children, footer, bodyClass = '', flush = false, className = '' }) {
    return (
        <section className={`panel ${className}`}>
            {(title || actions) && (
                <header className="panel-header">
                    <div>
                        <h2 className="panel-title">{Icon && <Icon size={17} />}{title}</h2>
                        {subtitle && <div className="panel-subtitle">{subtitle}</div>}
                    </div>
                    {actions && <div className="toolbar">{actions}</div>}
                </header>
            )}
            {flush ? children : <div className={`panel-body ${bodyClass}`}>{children}</div>}
            {footer && <footer className="panel-footer">{footer}</footer>}
        </section>
    );
}

export function StatCard({ label, value, meta, icon: Icon, tone = 'primary' }) {
    return (
        <div className="stat-card">
            <div style={{ minWidth: 0 }}>
                <div className="stat-lbl">{label}</div>
                <div className="stat-val">{value}</div>
                {meta && <div className="stat-meta">{meta}</div>}
            </div>
            {Icon && <div className={`stat-icon tone-${tone}`}><Icon size={18} /></div>}
        </div>
    );
}

export function EmptyState({ icon: Icon = Inbox, title, hint, action }) {
    return (
        <div className="empty-state">
            <div className="empty-icon"><Icon size={20} /></div>
            {title && <div className="empty-title">{title}</div>}
            {hint && <div className="empty-hint">{hint}</div>}
            {action}
        </div>
    );
}

export function Loading({ label = 'Loading…' }) {
    return <div className="loading-state"><span className="spinner" />{label}</div>;
}

export function ErrorNote({ message, onRetry }) {
    if (!message) return null;
    return (
        <div className="alert tone-danger">
            <AlertCircle size={16} />
            <div className="grow">{message}</div>
            {onRetry && <button className="btn btn-sm btn-outline" onClick={onRetry}>Retry</button>}
        </div>
    );
}

export function Alert({ tone = 'info', children }) {
    const Icon = tone === 'danger' ? AlertCircle : tone === 'warning' ? AlertTriangle : tone === 'success' ? CheckCircle2 : Info;
    return <div className={`alert tone-${tone}`}><Icon size={16} /><div className="grow">{children}</div></div>;
}

export function Avatar({ name = '', size = '' }) {
    const initials = name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';
    return <div className={`avatar ${size}`} aria-hidden="true">{initials}</div>;
}

export function Progress({ value, total }) {
    const pct = total ? Math.round((value / total) * 100) : 0;
    return (
        <div className="row" style={{ gap: '0.6rem' }}>
            <div className={`progress grow ${pct === 100 ? 'success' : ''}`}><span style={{ width: `${pct}%` }} /></div>
            <span className="text-xs muted mono nowrap">{total ? `${value}/${total}` : '—'}</span>
        </div>
    );
}

// ============================================================
// Status badge - one mapping for every status column in the schema
// ============================================================
const STATUS_TONES = {
    success: ['Active', 'Approved', 'Paid', 'Completed', 'Present', 'Won', 'In Use', 'Done'],
    warning: ['Pending', 'In Progress', 'Late', 'Proposal', 'Maintenance', 'Medium', 'On Leave', 'Half Day'],
    danger: ['Rejected', 'Overdue', 'Absent', 'Lost', 'Inactive', 'High', 'Critical', 'Unpaid'],
    info: ['New', 'Contacted', 'Pending Assignment', 'Planning', 'Available'],
    neutral: ['Cancelled', 'Retired', 'Low', 'On Hold']
};
const TONE_CLASS = { success: 'badge-success', warning: 'badge-warning', danger: 'badge-danger', info: 'badge-info', neutral: 'badge-slate' };

export function StatusBadge({ status, plain = false }) {
    if (!status) return <span className="null">—</span>;
    const tone = Object.keys(STATUS_TONES).find(t => STATUS_TONES[t].includes(status)) || 'neutral';
    return <span className={`badge ${TONE_CLASS[tone]} ${plain ? 'plain' : ''}`}>{status}</span>;
}

// ============================================================
// Modal & form fields
// ============================================================
export function Modal({ title, subtitle, onClose, children, footer, size = '' }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    return (
        <div className="modal-overlay" onMouseDown={onClose}>
            <div className={`modal-card ${size}`} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} onMouseDown={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h3 className="modal-title">{title}</h3>
                        {subtitle && <div className="modal-subtitle">{subtitle}</div>}
                    </div>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close"><X size={18} /></button>
                </div>
                {children}
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

// A modal whose body is a form; handles submit + busy state.
export function FormModal({ title, subtitle, onClose, onSubmit, submitLabel = 'Save', children, size = '', danger }) {
    const [busy, setBusy] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try { await onSubmit(); } finally { setBusy(false); }
    };
    return (
        <Modal title={title} subtitle={subtitle} onClose={onClose} size={size}>
            <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
                <div className="modal-body">{children}</div>
                <div className="modal-footer">
                    {danger}
                    <div className="grow" />
                    <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
                </div>
            </form>
        </Modal>
    );
}

export function Field({ label, required, hint, span, children }) {
    return (
        <label className={`field ${span ? 'span-all' : ''}`}>
            <span className="form-label">{label}{required && <span className="req">*</span>}</span>
            {children}
            {hint && <span className="field-hint">{hint}</span>}
        </label>
    );
}

// Controlled-form state helper: const [form, set, reset] = useForm({...}); set('name')(event)
export function useForm(initial) {
    const [form, setForm] = useState(initial);
    const bind = (key) => (e) => setForm(f => ({ ...f, [key]: e && e.target ? e.target.value : e }));
    const reset = (next = initial) => setForm(next);
    return [form, bind, reset, setForm];
}

// Search box used above tables
export function SearchInput({ value, onChange, placeholder = 'Search…', icon: Icon, width = 240 }) {
    return (
        <div className="input-icon" style={{ width }}>
            {Icon && <Icon size={15} />}
            <input className="form-input sm" style={{ paddingLeft: Icon ? '2rem' : undefined }} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        </div>
    );
}

// Dropdown data for departments, designations, employees, teams, clients, projects, roles
const EMPTY_LOOKUPS = { roles: [], departments: [], designations: [], employees: [], teams: [], clients: [], projects: [] };
export function useLookups() {
    return useFetch('/api/org/lookups', EMPTY_LOOKUPS);
}
