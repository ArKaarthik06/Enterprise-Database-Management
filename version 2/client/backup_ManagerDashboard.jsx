import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Briefcase, Mail, Phone, FolderGit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProjectTracker from './ProjectTracker';

export default function ManagerDashboard() {
    const { user } = useAuth();
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('team'); // 'team' | 'projects'
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        department_id: '1', // Defaulting for MVP
        designation_id: '1',
        salary: '60000'
    });

    const fetchTeam = async () => {
        if (!user || !user.employee_id) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`/api/employees/my-team?manager_id=${user.employee_id}`);
            if (res.ok) {
                const data = await res.json();
                setTeam(data);
            }
        } catch (err) {
            console.error('Error fetching team:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeam();
    }, [user]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                manager_id: user.employee_id
            };
            const res = await fetch('/api/employees/add-subordinate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                setShowAddForm(false);
                setFormData({ ...formData, first_name: '', last_name: '', email: '' }); // Reset fields
                fetchTeam(); // Refresh list
            } else {
                alert('Failed to add employee');
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (!user || !user.employee_id) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <h2>Welcome, {user?.name || 'User'}</h2>
                <p>You do not have an employee profile linked to act as a manager.</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                        Manager Dashboard
                    </h1>
                    <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                        Manage your team, track performance, and add new subordinates.
                    </p>
                </div>
                <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: showAddForm ? 'transparent' : 'var(--primary)',
                        color: showAddForm ? 'var(--text-main)' : '#000',
                        border: '1px solid var(--primary)',
                        padding: '0.75rem 1.25rem',
                        fontFamily: 'var(--font-mono)', fontWeight: '800', textTransform: 'uppercase',
                        cursor: 'pointer', transition: 'all 0.1s'
                    }}
                    onMouseEnter={(e) => e.target.style.boxShadow = 'var(--shadow-glow)'}
                    onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
                >
                    {showAddForm ? 'Cancel' : <><UserPlus className="w-4 h-4" /> Add Team Member</>}
                </button>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
                <button 
                    onClick={() => setActiveTab('team')}
                    style={{
                        background: 'none', border: 'none', borderBottom: activeTab === 'team' ? '2px solid var(--primary)' : '2px solid transparent',
                        padding: '0.75rem 1rem', color: activeTab === 'team' ? 'var(--primary)' : 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                >
                    <Users className="w-4 h-4" /> Team Management
                </button>
                <button 
                    onClick={() => setActiveTab('projects')}
                    style={{
                        background: 'none', border: 'none', borderBottom: activeTab === 'projects' ? '2px solid var(--primary)' : '2px solid transparent',
                        padding: '0.75rem 1rem', color: activeTab === 'projects' ? 'var(--primary)' : 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                >
                    <FolderGit2 className="w-4 h-4" /> Projects & Tasks
                </button>
            </div>

            {activeTab === 'projects' ? (
                <div className="animate-fade-in">
                    <ProjectTracker />
                </div>
            ) : (
                <div className="animate-fade-in">
                    {showAddForm && (
                <div className="animate-fade-in" style={{
                    background: 'var(--bg-card)', border: '1px solid var(--primary)',
                    padding: '2rem', marginBottom: '2rem', boxShadow: 'var(--shadow-glow)'
                }}>
                    <h3 style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', color: 'var(--primary)' }}>
                        Add New Subordinate
                    </h3>
                    <form onSubmit={handleAddEmployee} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>First Name</label>
                            <input name="first_name" value={formData.first_name} onChange={handleInputChange} required className="form-input" />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Last Name</label>
                            <input name="last_name" value={formData.last_name} onChange={handleInputChange} required className="form-input" />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Department ID</label>
                            <input name="department_id" type="number" value={formData.department_id} onChange={handleInputChange} required className="form-input" />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Designation ID</label>
                            <input name="designation_id" type="number" value={formData.designation_id} onChange={handleInputChange} required className="form-input" />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Base Salary</label>
                            <input name="salary" type="number" value={formData.salary} onChange={handleInputChange} required className="form-input" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button type="submit" style={{
                                width: '100%', padding: '0.75rem', background: 'var(--primary)', color: '#000',
                                border: '1px solid var(--primary)', fontFamily: 'var(--font-mono)', fontWeight: '800', 
                                textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.1s'
                            }}
                            onMouseEnter={(e) => e.target.style.boxShadow = 'var(--shadow-glow)'}
                            onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
                            >
                                Save Employee
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                overflow: 'hidden'
            }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-subtle)' }}>
                    <Users className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                    <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: '800', textTransform: 'uppercase' }}>Direct Reports ({team.length})</h2>
                </div>
                
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>LOADING...</div>
                ) : team.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '1px solid var(--border-color)' }}>
                            <Users className="w-8 h-8 opacity-50" />
                        </div>
                        <p style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontSize: '0.85rem' }}>NO EMPLOYEES CURRENTLY REPORT TO YOU.</p>
                        <button onClick={() => setShowAddForm(true)} style={{ marginTop: '1rem', background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.5rem 1rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: '700', cursor: 'pointer' }}>
                            ADD FIRST TEAM MEMBER
                        </button>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>EMPLOYEE</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>ROLE</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>CONTACT</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {team.map((emp) => (
                                    <tr key={emp.employee_id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="hover:bg-white/5">
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontWeight: '600' }}>{emp.first_name} {emp.last_name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: EMP-{emp.employee_id.toString().padStart(4, '0')}</div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                                                <Briefcase className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                                                {emp.designation_title || 'Employee'}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '1.4rem' }}>
                                                {emp.department_name || 'No Dept'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                                <Mail className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                                                {emp.email || 'N/A'}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                                <Phone className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                                                {emp.phone || 'N/A'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{ 
                                                display: 'inline-block', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase',
                                                border: emp.status === 'Active' ? '1px solid var(--success)' : '1px solid var(--danger)',
                                                color: emp.status === 'Active' ? 'var(--success)' : 'var(--danger)'
                                            }}>
                                                {emp.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            </div>
            )}
    );
}
