import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './DashboardLayout.css';

const DashboardPage = () => {
    const { user, logoutUser } = useAuth();

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h3>SYLO</h3>
                </div>
                <nav className="sidebar-nav">
                    <Link to="/dashboard" className="nav-item active">
                        Dashboard
                    </Link>
                    <Link to="/projects" className="nav-item">
                        Projects
                    </Link>
                    <Link to="/tasks" className="nav-item">
                        Tasks
                    </Link>
                    <Link to="/settings" className="nav-item">
                        Settings
                    </Link>
                </nav>
                <div className="sidebar-footer">
                    <button onClick={logoutUser} className="btn btn-danger btn-sm">
                        Logout
                    </button>
                </div>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <h1>Dashboard</h1>
                    <div className="user-info">
                        Welcome, {user?.firstName} {user?.lastName}!
                    </div>
                </header>

                <div className="dashboard-content">
                    <section className="stats-section">
                        <h2>Overview</h2>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <h3>0</h3>
                                <p>Total Projects</p>
                            </div>
                            <div className="stat-card">
                                <h3>0</h3>
                                <p>Active Tasks</p>
                            </div>
                            <div className="stat-card">
                                <h3>0</h3>
                                <p>Completed Tasks</p>
                            </div>
                            <div className="stat-card">
                                <h3>0</h3>
                                <p>Overdue Tasks</p>
                            </div>
                        </div>
                    </section>

                    <section className="quick-actions">
                        <h2>Quick Actions</h2>
                        <div className="actions-grid">
                            <Link to="/projects/create" className="btn btn-primary">
                                Create Project
                            </Link>
                            <Link to="/tasks/create" className="btn btn-secondary">
                                Create Task
                            </Link>
                        </div>
                    </section>

                    <section className="recent-projects">
                        <h2>Recent Projects</h2>
                        <p className="text-muted">No projects yet. <Link to="/projects/create">Create one</Link></p>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
