import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosClient from '../utils/axiosClient';
import './DashboardLayout.css';

const ProjectsPage = () => {
    const { logoutUser } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get('/projects');
            setProjects(response.data.projects || []);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm('Delete this project and all its tasks?')) return;

        try {
            await axiosClient.delete(`/projects/${projectId}`);
            fetchProjects();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete project');
        }
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h3>SYLO</h3>
                </div>
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
                    <h1>Projects</h1>
                    <Link to="/projects/create" className="btn btn-primary">New Project</Link>
                </header>

                <div className="dashboard-content">
                    <section className="projects-section">
                        {error && <div className="alert alert-error">{error}</div>}

                        {loading ? (
                            <p className="text-muted">Loading projects...</p>
                        ) : projects.length === 0 ? (
                            <p className="text-muted">No projects yet. <Link to="/projects/create">Create your first project</Link></p>
                        ) : (
                            <div className="list-stack">
                                {projects.map((project) => (
                                    <div key={project._id} className="list-item card-item">
                                        <div className="list-item-header">
                                            <div>
                                                <Link to={`/projects/${project._id}`} className="project-title-link">
                                                    {project.name}
                                                </Link>
                                                <div className="meta-row">
                                                    <span className="badge badge-primary">{project.userRole}</span>
                                                    <span className="text-muted small-text">{project.taskCount} tasks</span>
                                                </div>
                                            </div>
                                            <div className="inline-actions">
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => navigate(`/projects/${project._id}`)}
                                                >
                                                    View
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDeleteProject(project._id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-muted">{project.description || 'No description provided.'}</p>

                                        <div className="project-meta-row">
                                            <span>Progress: {project.progress}%</span>
                                            <span>Completed: {project.completedTasks}</span>
                                        </div>

                                        <div className="progress-bar">
                                            <div
                                                className={`progress-fill ${project.progress >= 75 ? 'almost-done' : ''}`}
                                                style={{ width: `${project.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ProjectsPage;
