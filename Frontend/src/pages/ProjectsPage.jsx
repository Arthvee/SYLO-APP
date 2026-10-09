import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './DashboardLayout.css';

const ProjectsPage = () => {
    const { logoutUser } = useAuth();

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h3>SYLO</h3>
                </div>
                <nav className="sidebar-nav">
                    <Link to="/dashboard" className="nav-item">
                        Dashboard
                    </Link>
                    <Link to="/projects" className="nav-item active">
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
                    <h1>Projects</h1>
                    <Link to="/projects/create" className="btn btn-primary">
                        New Project
                    </Link>
                </header>

                <div className="dashboard-content">
                    <section className="projects-section">
                        <p className="text-muted">
                            No projects yet. <Link to="/projects/create">Create your first project</Link>
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ProjectsPage;
