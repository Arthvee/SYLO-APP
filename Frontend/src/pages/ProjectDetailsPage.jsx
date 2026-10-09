import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosClient from '../utils/axiosClient';
import './DashboardLayout.css';

const ProjectDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, logoutUser } = useAuth();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [collaboratorUsername, setCollaboratorUsername] = useState('');
    const [taskStatus, setTaskStatus] = useState({});

    const fetchProject = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get(`/projects/${id}`);
            const projectData = response.data.project;
            setProject(projectData);
            const statusMap = {};
            projectData.tasks.forEach((task) => {
                statusMap[task._id] = task.status;
            });
            setTaskStatus(statusMap);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load project');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProject();
    }, [id]);

    const isOwner = project?.owner?._id === user?.id || project?.owner === user?.id || project?.userRole === 'owner';

    const handleAddCollaborator = async (e) => {
        e.preventDefault();
        if (!collaboratorUsername.trim()) return;

        try {
            await axiosClient.post(`/projects/${id}/add-collaborator`, {
                username: collaboratorUsername.trim()
            });
            setCollaboratorUsername('');
            fetchProject();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add collaborator');
        }
    };

    const handleRemoveCollaborator = async (collaboratorId) => {
        try {
            await axiosClient.post(`/projects/${id}/remove-collaborator`, { collaboratorId });
            fetchProject();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to remove collaborator');
        }
    };

    const handleLeaveProject = async () => {
        if (!window.confirm('Leave this project?')) return;

        try {
            await axiosClient.post(`/projects/${id}/leave`);
            navigate('/projects');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to leave project');
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await axiosClient.patch(`/tasks/${taskId}/status`, { status: newStatus });
            setTaskStatus((prev) => ({ ...prev, [taskId]: newStatus }));
            fetchProject();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update task status');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Delete this task?')) return;

        try {
            await axiosClient.delete(`/tasks/${taskId}`);
            fetchProject();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete task');
        }
    };

    if (loading) {
        return (
            <div className="dashboard-layout">
                <aside className="sidebar">
                    <div className="sidebar-header"><h3>SYLO</h3></div>
                    <nav className="sidebar-nav">
                        <Link to="/dashboard" className="nav-item">Dashboard</Link>
                        <Link to="/projects" className="nav-item active">Projects</Link>
                        <Link to="/tasks" className="nav-item">Tasks</Link>
                        <Link to="/settings" className="nav-item">Settings</Link>
                    </nav>
                    <div className="sidebar-footer">
                        <button onClick={logoutUser} className="btn btn-danger btn-sm">Logout</button>
                    </div>
                </aside>

                <main className="dashboard-main">
                    <div className="dashboard-content">
                        <p className="text-muted">Project details loading...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="dashboard-layout">
                <aside className="sidebar">
                    <div className="sidebar-header"><h3>SYLO</h3></div>
                    <nav className="sidebar-nav">
                        <Link to="/dashboard" className="nav-item">Dashboard</Link>
                        <Link to="/projects" className="nav-item active">Projects</Link>
                        <Link to="/tasks" className="nav-item">Tasks</Link>
                        <Link to="/settings" className="nav-item">Settings</Link>
                    </nav>
                    <div className="sidebar-footer">
                        <button onClick={logoutUser} className="btn btn-danger btn-sm">Logout</button>
                    </div>
                </aside>
                <main className="dashboard-main">
                    <div className="dashboard-content">
                        <div className="alert alert-error">{error || 'Project not found'}</div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-header"><h3>SYLO</h3></div>
                <nav className="sidebar-nav">
                    <Link to="/dashboard" className="nav-item">Dashboard</Link>
                    <Link to="/projects" className="nav-item active">Projects</Link>
                    <Link to="/tasks" className="nav-item">Tasks</Link>
                    <Link to="/settings" className="nav-item">Settings</Link>
                </nav>
                <div className="sidebar-footer">
                    <button onClick={logoutUser} className="btn btn-danger btn-sm">Logout</button>
                </div>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <Link to="/projects">← Back to Projects</Link>
                    <h1>{project.name}</h1>
                </header>

                <div className="dashboard-content">
                    <div className="detail-grid">
                        <section className="project-summary-card">
                            <div className="project-summary-header">
                                <div>
                                    <p className="subtitle">Project overview</p>
                                    <h2>{project.name}</h2>
                                </div>
                                <span className="badge badge-primary">{project.userRole}</span>
                            </div>

                            <p>{project.description || 'No description provided.'}</p>

                            <div className="info-grid">
                                <div><strong>Owner:</strong> {project.owner?.firstName} {project.owner?.lastName}</div>
                                <div><strong>Deadline:</strong> {project.deadline ? new Date(project.deadline).toLocaleString() : 'No deadline'}</div>
                                <div><strong>Progress:</strong> {project.progress}%</div>
                                <div><strong>Status:</strong> {project.projectState}</div>
                            </div>

                            <div className="progress-bar">
                                <div
                                    className={`progress-fill ${project.progress >= 75 ? 'almost-done' : ''}`}
                                    style={{ width: `${project.progress}%` }}
                                ></div>
                            </div>

                            <div className="form-actions">
                                <Link to="/tasks/create" state={{ projectId: project._id }} className="btn btn-primary">Create Task</Link>
                                {isOwner ? (
                                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/projects')}>Manage Project</button>
                                ) : (
                                    <button type="button" className="btn btn-danger" onClick={handleLeaveProject}>Leave Project</button>
                                )}
                            </div>
                        </section>

                        <section className="project-sidebar-card">
                            <h3>Collaborators</h3>
                            {isOwner && (
                                <form onSubmit={handleAddCollaborator} className="inline-form">
                                    <input
                                        type="text"
                                        value={collaboratorUsername}
                                        onChange={(e) => setCollaboratorUsername(e.target.value)}
                                        placeholder="Add collaborator username"
                                    />
                                    <button type="submit" className="btn btn-primary btn-sm">Add</button>
                                </form>
                            )}

                            <div className="member-list">
                                {project.collaborators?.length ? project.collaborators.map((member) => (
                                    <div key={member._id} className="member-item">
                                        <div>
                                            <strong>{member.firstName} {member.lastName}</strong>
                                            <div className="text-muted small-text">@{member.username}</div>
                                        </div>
                                        {isOwner && member._id !== project.owner?._id && (
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleRemoveCollaborator(member._id)}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                )) : <p className="text-muted">No collaborators yet.</p>}
                            </div>
                        </section>
                    </div>

                    <section className="tasks-section">
                        <div className="section-header-row">
                            <h2>Tasks</h2>
                            <Link to="/tasks/create" state={{ projectId: project._id }} className="btn btn-primary">New Task</Link>
                        </div>

                        {project.tasks?.length ? (
                            <div className="task-list">
                                {project.tasks.map((task) => (
                                    <div key={task._id} className="task-card">
                                        <div className="task-card-header">
                                            <div>
                                                <h3>{task.title}</h3>
                                                <p className="text-muted">{task.description || 'No description.'}</p>
                                            </div>
                                            <span className={`status-badge status-${task.status.replace(/\s+/g, '-')}`}>
                                                {task.status}
                                            </span>
                                        </div>

                                        <div className="task-meta-grid">
                                            <div><strong>Deadline:</strong> {task.deadline ? new Date(task.deadline).toLocaleString() : 'No deadline'}</div>
                                            <div><strong>Assignees:</strong> {task.assignees?.length ? task.assignees.map((assignee) => assignee.username).join(', ') : 'Unassigned'}</div>
                                        </div>

                                        <div className="task-actions">
                                            <select
                                                value={taskStatus[task._id] || task.status}
                                                onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                            >
                                                <option value="todo">To do</option>
                                                <option value="in-progress">In progress</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(`/tasks/${task._id}/edit`)}>Edit</button>
                                            <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(task._id)}>Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted">No tasks yet. Create one to get started.</p>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ProjectDetailsPage;
