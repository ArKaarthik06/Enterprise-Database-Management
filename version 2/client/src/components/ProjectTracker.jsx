import React, { useState, useEffect } from 'react';
import { FolderGit2, CheckCircle2, Circle, Clock, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProjectTracker() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [teams, setTeams] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedProject, setSelectedProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [projectTeam, setProjectTeam] = useState([]);
    
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskAssignee, setNewTaskAssignee] = useState('');

    const [showProjectForm, setShowProjectForm] = useState(false);
    const [projectFormData, setProjectFormData] = useState({
        name: '', description: '', start_date: '', end_date: '', team_id: '', client_id: ''
    });

    const fetchData = async () => {
        if (!user?.employee_id) return;
        try {
            const [projRes, teamsRes, clientsRes] = await Promise.all([
                fetch(`/api/projects/my-projects?manager_id=${user.employee_id}`),
                fetch(`/api/dashboard/manager/teams`),
                fetch(`/api/crm/clients`)
            ]);
            if (projRes.ok) setProjects(await projRes.json());
            if (teamsRes.ok) setTeams(await teamsRes.json());
            if (clientsRes.ok) setClients(await clientsRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    useEffect(() => {
        if (selectedProject) {
            Promise.all([
                fetch(`/api/projects/${selectedProject.project_id}/tasks`).then(r => r.json()),
                fetch(`/api/projects/${selectedProject.project_id}/team-members`).then(r => r.json())
            ])
            .then(([tasksData, teamData]) => {
                setTasks(tasksData);
                setProjectTeam(teamData);
            })
            .catch(err => console.error(err));
        }
    }, [selectedProject]);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...projectFormData, manager_id: user.employee_id })
            });
            if (res.ok) {
                setShowProjectForm(false);
                setProjectFormData({ name: '', description: '', start_date: '', end_date: '', team_id: '', client_id: '' });
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !selectedProject) return;
        try {
            const res = await fetch(`/api/projects/${selectedProject.project_id}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTaskTitle, assigned_to: newTaskAssignee || null })
            });
            if (res.ok) {
                setNewTaskTitle('');
                setNewTaskAssignee('');
                const tasksRes = await fetch(`/api/projects/${selectedProject.project_id}/tasks`);
                setTasks(await tasksRes.json());
            }
        } catch (err) {
            console.error('Error creating task', err);
        }
    };

    const handleUpdateTaskStatus = async (taskId, newStatus) => {
        try {
            const res = await fetch(`/api/projects/tasks/${taskId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setTasks(tasks.map(t => t.task_id === taskId ? { ...t, status: newStatus } : t));
            }
        } catch (err) {
            console.error('Error updating status', err);
        }
    };

    if (loading) {
        return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>LOADING PROJECTS...</div>;
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
            {/* Projects List */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FolderGit2 className="w-4 h-4 text-primary" /> Active Projects
                    </h3>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowProjectForm(!showProjectForm)}>
                        {showProjectForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                </div>
                
                {showProjectForm && (
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-page)' }}>
                        <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <input className="form-input" placeholder="Project Name" value={projectFormData.name} onChange={e => setProjectFormData({...projectFormData, name: e.target.value})} required />
                            <textarea className="form-input" placeholder="Description" rows="2" value={projectFormData.description} onChange={e => setProjectFormData({...projectFormData, description: e.target.value})} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <select className="form-select" value={projectFormData.client_id} onChange={e => setProjectFormData({...projectFormData, client_id: e.target.value})}>
                                    <option value="">Internal (No Client)</option>
                                    {clients.map(c => <option key={c.client_id} value={c.client_id}>{c.company}</option>)}
                                </select>
                                <select className="form-select" value={projectFormData.team_id} onChange={e => setProjectFormData({...projectFormData, team_id: e.target.value})}>
                                    <option value="">No Team Assigned</option>
                                    {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input type="date" className="form-input" value={projectFormData.start_date} onChange={e => setProjectFormData({...projectFormData, start_date: e.target.value})} />
                                <input type="date" className="form-input" value={projectFormData.end_date} onChange={e => setProjectFormData({...projectFormData, end_date: e.target.value})} />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.5rem' }}>Create Project</button>
                        </form>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {projects.length === 0 && !showProjectForm ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <p style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontSize: '0.85rem' }}>NO ACTIVE PROJECTS.</p>
                        </div>
                    ) : (
                        projects.map(proj => (
                            <button
                                key={proj.project_id}
                                onClick={() => setSelectedProject(proj)}
                                style={{
                                    padding: '1rem', textAlign: 'left', background: selectedProject?.project_id === proj.project_id ? 'var(--primary-light)' : 'transparent',
                                    border: 'none', borderBottom: '1px solid var(--border-color)', borderLeft: selectedProject?.project_id === proj.project_id ? '3px solid var(--primary)' : '3px solid transparent',
                                    cursor: 'pointer', transition: 'all 0.1s', fontFamily: 'var(--font-mono)'
                                }}
                                className="hover:bg-white/5"
                            >
                                <div style={{ fontWeight: 800, color: selectedProject?.project_id === proj.project_id ? 'var(--primary)' : 'var(--text-main)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                    {proj.name}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{proj.client_company || proj.client_name || 'Internal'}</span>
                                    <span style={{ color: proj.status === 'Completed' ? 'var(--success)' : 'var(--warning)' }}>{proj.status}</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Task View */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                {selectedProject ? (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-subtle)' }}>
                            <h3 style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '0.25rem' }}>
                                {selectedProject.name}
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{selectedProject.description}</p>
                        </div>

                        {/* Task List */}
                        <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
                            {tasks.length === 0 ? (
                                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>No tasks found.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {tasks.map(task => (
                                        <div key={task.task_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid var(--border-color)', background: 'var(--bg-page)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <button onClick={() => handleUpdateTaskStatus(task.task_id, task.status === 'Completed' ? 'Pending' : 'Completed')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.status === 'Completed' ? 'var(--success)' : 'var(--text-muted)' }}>
                                                    {task.status === 'Completed' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                                </button>
                                                <div>
                                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: task.status === 'Completed' ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: task.status === 'Completed' ? 'line-through' : 'none' }}>
                                                        {task.title}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                                        {task.first_name ? `Assigned to: ${task.first_name} ${task.last_name}` : 'Unassigned'}
                                                    </div>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                                {task.priority}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add Task Input */}
                        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-page)' }}>
                            <form onSubmit={handleCreateTask} style={{ display: 'flex', gap: '0.5rem' }}>
                                <input 
                                    type="text" 
                                    placeholder="New Task Title..." 
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    className="form-input"
                                    style={{ flex: 1 }}
                                />
                                <select 
                                    value={newTaskAssignee}
                                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                                    className="form-select"
                                    style={{ width: '150px' }}
                                >
                                    <option value="">Unassigned</option>
                                    {projectTeam.map(member => (
                                        <option key={member.employee_id} value={member.employee_id}>
                                            {member.first_name} {member.last_name}
                                        </option>
                                    ))}
                                </select>
                                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                                    <Plus className="w-4 h-4" /> Add
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        Select a project to view tasks
                    </div>
                )}
            </div>
        </div>
    );
}
