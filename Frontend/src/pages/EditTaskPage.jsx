import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './DashboardLayout.css';

const EditTaskPage = () => {
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
                    <Link to="/projects" className="nav-item">
                        Projects
                    </Link>
                    <Link to="/tasks" className="nav-item active">
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
                    <Link to="/tasks">← Back to Tasks</Link>
                    <h1>Edit Task</h1>
                </header>

                <div className="dashboard-content">
                    <p className="text-muted">Task edit form coming soon...</p>
                </div>
            </main>
        </div>
    );
};

export default EditTaskPage;
