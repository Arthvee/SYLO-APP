import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosClient from '../utils/axiosClient';
import './DashboardLayout.css';

const CreateTaskPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logoutUser } = useAuth();
    const initialProjectId = location.state?.projectId || '';

    const [projects, setProjects] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        project: initialProjectId,
        assignees: [],
        deadline: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await axiosClient.get('/projects');
                const projectList = response.data.projects || [];
                setProjects(projectList);
                if (!formData.project && projectList[0]?._id) {
                    setFormData((prev) => ({ ...prev, project: projectList[0]._id }));
                }
            } catch (err) {
                console.error('Failed to load projects for task creation:', err);
            }
        };

        fetchProjects();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAssigneeChange = (e) => {
        const selected = Array.from(e.target.selectedOptions, (option) => option.value);
        setFormData((prev) => ({ ...prev, assignees: selected }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            setLoading(true);
            const payload = {
                ...formData,
                deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
                assignees: formData.assignees.length ? formData.assignees : []
            };

            await axiosClient.post('/tasks', payload);
            navigate('/tasks');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    const selectedProject = projects.find((project) => project._id === formData.project);
    const projectMembers = selectedProject ? [selectedProject.owner, ...(selectedProject.collaborators || [])] : [];

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-header"><h3>SYLO</h3></div>
                <nav className="sidebar-nav">
                    <Link to="/dashboard" className="nav-item">Dashboard</Link>
                    <Link to="/projects" className="nav-item">Projects</Link>
                    <Link to="/tasks" className="nav-item active">Tasks</Link>
                    <Link to="/settings" className="nav-item">Settings</Link>
                </nav>
                <div className="sidebar-footer">
                    <button onClick={logoutUser} className="btn btn-danger btn-sm">Logout</button>
                </div>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <Link to="/tasks">← Back to Tasks</Link>
                    <h1>Create New Task</h1>
                </header>

                <div className="dashboard-content">
                    <form onSubmit={handleSubmit} className="form-container">
                        {error && <div className="alert alert-error">{error}</div>}

                        <div className="form-group">
                            <label>Project *</label>
                            <select name="project" value={formData.project} onChange={handleChange} required>
                                <option value="">Select a project</option>
                                {projects.map((project) => (
                                    <option key={project._id} value={project._id}>{project.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Task Title *</label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="Build landing page" />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows="5" placeholder="Describe the task" />
                        </div>

                        <div className="form-group">
                            <label>Assignees</label>
                            <select multiple value={formData.assignees} onChange={handleAssigneeChange}>
                                {projectMembers.map((member) => (
                                    <option key={member._id} value={member._id}>{member.firstName} {member.lastName}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Deadline</label>
                            <input type="datetime-local" name="deadline" value={formData.deadline} onChange={handleChange} />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Task'}
                            </button>
                            <Link to="/tasks" className="btn btn-secondary">Cancel</Link>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CreateTaskPage;
