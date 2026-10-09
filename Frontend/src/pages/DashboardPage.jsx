import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosClient from '../utils/axiosClient';
import './DashboardLayout.css';

const DashboardPage = () => {
    const { user, logoutUser } = useAuth();
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [projectsResponse, tasksResponse] = await Promise.all([
                    axiosClient.get('/projects'),
                    axiosClient.get('/tasks')
                ]);

                const projectList = projectsResponse.data.projects || [];
                const taskList = tasksResponse.data.tasks || [];

                setProjects(projectList);
                setTasks(taskList);
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const stats = {
        totalProjects: projects.length,
        activeTasks: tasks.filter(task => task.status !== 'completed').length,
        completedTasks: tasks.filter(task => task.status === 'completed').length,
        overdueTasks: tasks.filter(task =>
            task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed'
        ).length
    };

    const recentProjects = projects.slice(0, 3);

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h3>SYLO</h3>
                </div>
                <nav className="sidebar-nav">
                    <Link to="/dashboard" className="nav-item active">Dashboard</Link>
                    <Link to="/projects" className="nav-item">Projects</Link>
                    <Link to="/tasks" className="nav-item">Tasks</Link>
                    <Link to="/settings" className="nav-item">Settings</Link>
                </nav>
                <div className="sidebar-footer">
                    <button onClick={logoutUser} className="btn btn-danger btn-sm">Logout</button>
                </div>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <h1>Dashboard</h1>
                    <div className="user-info">Welcome, {user?.firstName} {user?.lastName}!</div>
                </header>

                <div className="dashboard-content">
                    <section className="stats-section">
                        <h2>Overview</h2>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <h3>{loading ? '...' : stats.totalProjects}</h3>
                                <p>Total Projects</p>
                            </div>
                            <div className="stat-card">
                                <h3>{loading ? '...' : stats.activeTasks}</h3>
                                <p>Active Tasks</p>
                            </div>
                            <div className="stat-card">
                                <h3>{loading ? '...' : stats.completedTasks}</h3>
                                <p>Completed Tasks</p>
                            </div>
                            <div className="stat-card">
                                <h3>{loading ? '...' : stats.overdueTasks}</h3>
                                <p>Overdue Tasks</p>
                            </div>
                        </div>
                    </section>

                    <section className="quick-actions">
                        <h2>Quick Actions</h2>
                        <div className="actions-grid">
                            <Link to="/projects/create" className="btn btn-primary">Create Project</Link>
                            <Link to="/tasks/create" className="btn btn-secondary">Create Task</Link>
                        </div>
                    </section>

                    <section className="recent-projects">
                        <h2>Recent Projects</h2>
                        {loading ? (
                            <p className="text-muted">Loading projects...</p>
                        ) : recentProjects.length > 0 ? (
                            <div className="list-stack">
                                {recentProjects.map((project) => (
                                    <div key={project._id} className="list-item card-item">
                                        <div className="list-item-header">
                                            <Link to={`/projects/${project._id}`} className="project-title-link">
                                                {project.name}
                                            </Link>
                                            <span className="badge badge-primary">{project.userRole}</span>
                                        </div>
                                        <p className="text-muted">{project.description || 'No description provided.'}</p>
                                        <div className="progress-bar">
                                            <div
                                                className={`progress-fill ${project.progress >= 75 ? 'almost-done' : ''}`}
                                                style={{ width: `${project.progress}%` }}
                                            ></div>
                                        </div>
                                        <small>{project.progress}% complete</small>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted">No projects yet. <Link to="/projects/create">Create one</Link></p>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
