import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './DashboardLayout.css';

const SettingsPage = () => {
    const { user, logoutUser } = useAuth();

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
                    <Link to="/tasks" className="nav-item">
                        Tasks
                    </Link>
                    <Link to="/settings" className="nav-item active">
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
                    <h1>Settings</h1>
                </header>

                <div className="dashboard-content">
                    <section className="settings-section">
                        <h2>Profile Information</h2>
                        <div className="settings-card">
                            <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
                            <p><strong>Username:</strong> {user?.username}</p>
                            <p><strong>Email:</strong> {user?.email}</p>
                        </div>
                    </section>

                    <section className="settings-section">
                        <h2>Account</h2>
                        <div className="settings-card">
                            <p><strong>Email Verified:</strong> {user?.isEmailVerified ? 'Yes' : 'No'}</p>
                        </div>
                    </section>

                    <section className="settings-section">
                        <h2>Actions</h2>
                        <div className="settings-actions">
                            <button className="btn btn-secondary">Change Password</button>
                            <button onClick={logoutUser} className="btn btn-danger">Logout</button>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default SettingsPage;
