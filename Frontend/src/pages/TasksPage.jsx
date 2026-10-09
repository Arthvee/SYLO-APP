import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './DashboardLayout.css';

const TasksPage = () => {
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
                    <h1>Tasks</h1>
                    <Link to="/tasks/create" className="btn btn-primary">
                        New Task
                    </Link>
                </header>

                <div className="dashboard-content">
                    <p className="text-muted">No tasks yet.</p>
                </div>
            </main>
        </div>
    );
};

export default TasksPage;
