import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, CheckCircle, LogOut, Database, User } from 'lucide-react';

export default function ClientApp() {
    const { user, logout } = useAuth();
    const clientId = user?.client_id;

    const [clientProjects, setClientProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [projectForm, setProjectForm] = useState({
        name: '',
        description: '',
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        if (!clientId) {
            setLoading(false);
            return;
        }

        const fetchProjects = async () => {
            setLoading(true);
            try {
                const cliProjRes = await fetch(`/api/dashboard/client/projects?client_id=${clientId}`);
                setClientProjects(await cliProjRes.json());
            } catch (err) {
                console.error("Error fetching client projects:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [clientId]);

    const submitProjectRequest = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/dashboard/client/request-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: clientId,
                    ...projectForm
                })
            });
            if (res.ok) {
                alert("Project request submitted successfully.");
                setProjectForm({ name: '', description: '', start_date: '', end_date: '' });
                const cliProjRes = await fetch(`/api/dashboard/client/projects?client_id=${clientId}`);
                setClientProjects(await cliProjRes.json());
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="app-container" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            {/* Minimal Navbar for Client */}
            <nav className="navbar" style={{ padding: '1rem 2rem', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', padding: '0.5rem', borderRadius: '8px' }}>
                            <Database className="w-6 h-6 text-white" />
                        </div>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Enterprise Client Portal</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                            <User className="w-5 h-5" />
                            <span style={{ fontWeight: 500 }}>{user?.name}</span>
                        </div>
                        <button 
                            onClick={logout}
                            className="btn btn-outline" 
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </nav>

            <main style={{ maxWidth: '1000px', margin: '3rem auto', padding: '0 2rem' }}>
                <div style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                        Welcome back, {user?.name}
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
                        Manage your requested projects and submit new ones.
                    </p>
                </div>

                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Loading your projects...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        
                        {/* Request Project Form */}
                        <div className="card" style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <FileText className="w-6 h-6 text-indigo-500" />
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Submit New Project</h3>
                            </div>
                            <form onSubmit={submitProjectRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 600 }}>Project Name</label>
                                    <input type="text" className="form-input" placeholder="e.g. New E-commerce App" required
                                        value={projectForm.name} 
                                        onChange={e => setProjectForm({...projectForm, name: e.target.value})} 
                                        style={{ padding: '0.75rem' }}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: 600 }}>Description</label>
                                    <textarea className="form-input" placeholder="Brief requirements..." required rows="3"
                                        value={projectForm.description} 
                                        onChange={e => setProjectForm({...projectForm, description: e.target.value})} 
                                        style={{ padding: '0.75rem' }}/>
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label" style={{ fontWeight: 600 }}>Desired Start Date</label>
                                        <input type="date" className="form-input" required 
                                            value={projectForm.start_date} 
                                            onChange={e => setProjectForm({...projectForm, start_date: e.target.value})} 
                                            style={{ padding: '0.75rem' }}/>
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label" style={{ fontWeight: 600 }}>Desired End Date</label>
                                        <input type="date" className="form-input" required 
                                            value={projectForm.end_date} 
                                            onChange={e => setProjectForm({...projectForm, end_date: e.target.value})} 
                                            style={{ padding: '0.75rem' }}/>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '0.75rem', fontSize: '1rem' }}>
                                    Submit Request
                                </button>
                            </form>
                        </div>

                        {/* My Projects */}
                        <div className="card" style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <CheckCircle className="w-6 h-6 text-emerald-500" />
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>My Submitted Projects</h3>
                            </div>
                            <div className="table-container" style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: '#f1f5f9' }}>
                                        <tr>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Project Name</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Dates</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clientProjects.length > 0 ? clientProjects.map(proj => (
                                            <tr key={proj.project_id} style={{ borderTop: '1px solid #e2e8f0' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{proj.name}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>{proj.description}</div>
                                                </td>
                                                <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#475569' }}>{proj.start_date} to {proj.end_date}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span className={`badge ${
                                                        proj.status === 'In Progress' ? 'badge-emerald' : 
                                                        proj.status === 'Completed' ? 'badge-indigo' : 'badge-slate'
                                                    }`} style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>
                                                        {proj.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No projects found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                )}
            </main>
        </div>
    );
}
