import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PerformanceReviews({ employeeId, employeeName }) {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ rating: '5.0', comments: '' });

    const fetchReviews = async () => {
        try {
            const res = await fetch(`/api/hr/reviews?employee_id=${employeeId}`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (employeeId) fetchReviews();
    }, [employeeId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/hr/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee_id: employeeId,
                    reviewer_id: user.employee_id,
                    rating: parseFloat(formData.rating),
                    comments: formData.comments
                })
            });
            if (res.ok) {
                setShowForm(false);
                setFormData({ rating: '5.0', comments: '' });
                fetchReviews();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>LOADING REVIEWS...</div>;

    return (
        <div style={{ marginTop: '1rem', background: 'var(--bg-subtle)', padding: '1rem', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Star className="w-4 h-4" /> Performance Reviews for {employeeName}
                </h3>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        background: showForm ? 'transparent' : 'var(--primary)', 
                        color: showForm ? 'var(--text-muted)' : '#000',
                        border: '1px solid var(--primary)',
                        padding: '0.4rem 0.75rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: '800', textTransform: 'uppercase', cursor: 'pointer'
                    }}
                >
                    {showForm ? 'Cancel' : <><Plus className="w-3 h-3 inline-block mr-1" /> Add Review</>}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '1rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Rating (1.0 - 5.0)</label>
                        <input 
                            type="number" step="0.1" min="1" max="5" required 
                            className="form-input" 
                            style={{ maxWidth: '150px' }}
                            value={formData.rating} 
                            onChange={(e) => setFormData({ ...formData, rating: e.target.value })} 
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Comments</label>
                        <textarea 
                            required 
                            className="form-input" 
                            rows="3"
                            value={formData.comments} 
                            onChange={(e) => setFormData({ ...formData, comments: e.target.value })} 
                        />
                    </div>
                    <button type="submit" style={{
                        background: 'var(--primary)', color: 'var(--primary-text)', border: 'none', padding: '0.5rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: '800', textTransform: 'uppercase', cursor: 'pointer'
                    }}>
                        Submit Review
                    </button>
                </form>
            )}

            {reviews.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No reviews found for this employee.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {reviews.map(r => (
                        <div key={r.review_id} style={{ background: 'var(--bg-card)', padding: '1rem', borderLeft: '2px solid var(--primary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                                    {r.reviewer_first} {r.reviewer_last} <span style={{ color: 'var(--text-muted)', fontWeight: '400', marginLeft: '0.5rem' }}>on {new Date(r.review_date).toLocaleDateString()}</span>
                                </div>
                                <div style={{ background: 'var(--primary)', color: 'var(--primary-text)', padding: '0.1rem 0.5rem', fontWeight: '800', fontSize: '0.75rem' }}>
                                    {r.rating.toFixed(1)}
                                </div>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
                                <MessageSquare className="w-4 h-4 flex-shrink-0 mt-1 opacity-50" />
                                <p style={{ margin: 0 }}>{r.comments}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
