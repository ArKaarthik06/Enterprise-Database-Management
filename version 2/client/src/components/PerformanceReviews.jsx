import React, { useState } from 'react';
import { Star, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Loading, useFetch, useAction, api, fmtDate, useForm } from './ui';

export function Stars({ rating }) {
    const r = Number(rating) || 0;
    return (
        <span className="row" style={{ gap: 2 }} aria-label={`${r.toFixed(1)} out of 5`}>
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={14} fill={i <= Math.round(r) ? 'var(--warning)' : 'none'} color={i <= Math.round(r) ? 'var(--warning)' : 'var(--border-strong)'} />
            ))}
            <span className="mono text-sm strong" style={{ marginLeft: 4 }}>{r.toFixed(1)}</span>
        </span>
    );
}

export default function PerformanceReviews({ employeeId, employeeName, readOnly = false }) {
    const { user } = useAuth();
    const reviews = useFetch(employeeId ? `/api/hr/reviews?employee_id=${employeeId}` : null, []);
    const run = useAction();
    const [showForm, setShowForm] = useState(false);
    const [form, bind, reset] = useForm({ rating: '4', comments: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const ok = await run(() => api.post('/api/hr/reviews', {
            employee_id: employeeId,
            reviewer_id: user.employee_id,
            rating: parseFloat(form.rating),
            comments: form.comments
        }), 'Review submitted');
        if (ok) {
            setShowForm(false);
            reset();
            reviews.reload();
        }
    };

    const avg = reviews.data.length ? reviews.data.reduce((s, r) => s + Number(r.rating), 0) / reviews.data.length : null;

    return (
        <div className="stack-sm">
            <div className="row-between">
                <div className="row">
                    <span className="strong">Performance reviews{employeeName ? ` · ${employeeName}` : ''}</span>
                    {avg !== null && <span className="text-sm muted">avg <Stars rating={avg} /></span>}
                </div>
                {!readOnly && (
                    <button className={`btn btn-sm ${showForm ? 'btn-ghost' : 'btn-outline'}`} onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Cancel' : <><Plus size={14} /> Add review</>}
                    </button>
                )}
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="card stack-sm" style={{ boxShadow: 'none' }}>
                    <div className="row wrap" style={{ gap: '1rem', alignItems: 'flex-end' }}>
                        <label className="field" style={{ width: 150 }}>
                            <span className="form-label">Rating (1 – 5)</span>
                            <input type="number" step="0.5" min="1" max="5" required className="form-input" value={form.rating} onChange={bind('rating')} />
                        </label>
                        <Stars rating={form.rating} />
                    </div>
                    <label className="field">
                        <span className="form-label">Comments</span>
                        <textarea required className="form-textarea" rows={3} value={form.comments} onChange={bind('comments')} placeholder="Strengths, growth areas, goals for next cycle…" />
                    </label>
                    <div className="form-actions"><button type="submit" className="btn btn-primary btn-sm">Submit review</button></div>
                </form>
            )}

            {reviews.loading ? <Loading /> : reviews.data.length === 0 ? (
                <div className="text-sm muted">No reviews recorded yet.</div>
            ) : (
                <div className="timeline">
                    {reviews.data.map(r => (
                        <div key={r.review_id} className="timeline-item">
                            <div className="row-between wrap">
                                <Stars rating={r.rating} />
                                <span className="text-xs muted">{r.reviewer_first} {r.reviewer_last} · {fmtDate(r.review_date)}</span>
                            </div>
                            {r.comments && <p className="text-sm" style={{ marginTop: '0.35rem' }}>{r.comments}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
