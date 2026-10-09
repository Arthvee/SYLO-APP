import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosClient from '../utils/axiosClient';
import './DashboardLayout.css';

const CreateProjectPage = () => {
    const [formData, setFormData] = useState({ name: '', description: '', deadline: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { logoutUser } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            setLoading(true);
            const payload = {
                ...formData,
                deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined
            };

            const response = await axiosClient.post('/projects', payload);
            setSuccess('Project created successfully!');
            setTimeout(() => navigate(`/projects/${response.data.project._id}`), 500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

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
                    <Link to="/projects">← Back to Projects</Link>
                    <h1>Create New Project</h1>
                </header>

                <div className="dashboard-content">
                    <form onSubmit={handleSubmit} className="form-container">
                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}

                        <div className="form-group">
                            <label>Project Name *</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="My Project" />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Project description" rows="5" />
                        </div>

                        <div className="form-group">
                            <label>Deadline</label>
                            <input type="datetime-local" name="deadline" value={formData.deadline} onChange={handleChange} />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Project'}
                            </button>
                            <Link to="/projects" className="btn btn-secondary">Cancel</Link>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CreateProjectPage;
