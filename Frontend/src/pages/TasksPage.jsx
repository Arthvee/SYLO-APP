import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosClient from '../utils/axiosClient';
import './DashboardLayout.css';

const TasksPage = () => {
    const { logoutUser } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get('/tasks');
            setTasks(response.data.tasks || []);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleStatusChange = async (taskId, status) => {
        try {
            await axiosClient.patch(`/tasks/${taskId}/status`, { status });
            fetchTasks();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update task status');
        }
    };

    const handleDelete = async (taskId) => {
        if (!window.confirm('Delete this task?')) return;

        try {
            await axiosClient.delete(`/tasks/${taskId}`);
            fetchTasks();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete task');
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
                    <h1>Tasks</h1>
                    <Link to="/tasks/create" className="btn btn-primary">New Task</Link>
                </header>

                <div className="dashboard-content">
                    {error && <div className="alert alert-error">{error}</div>}

                    {loading ? (
                        <p className="text-muted">Loading tasks...</p>
                    ) : tasks.length === 0 ? (
                        <p className="text-muted">No tasks yet.</p>
                    ) : (
                        <div className="task-list">
                            {tasks.map((task) => (
                                <div key={task._id} className="task-card">
                                    <div className="task-card-header">
                                        <div>
                                            <h3>{task.title}</h3>
                                            <div className="task-project-name">Project: {task.project?.name || 'Unknown'}</div>
                                        </div>
                                        <span className={`status-badge status-${task.status.replace(/\s+/g, '-')}`}>
                                            {task.status}
                                        </span>
                                    </div>

                                    <p className="text-muted">{task.description || 'No description provided.'}</p>

                                    <div className="task-meta-grid">
                                        <div><strong>Deadline:</strong> {task.deadline ? new Date(task.deadline).toLocaleString() : 'No deadline'}</div>
                                        <div><strong>Assignees:</strong> {task.assignees?.length ? task.assignees.map((u) => `${u.firstName} ${u.lastName}`).join(', ') : 'Unassigned'}</div>
                                        <div><strong>Created by:</strong> {task.createdBy ? `${task.createdBy.firstName} ${task.createdBy.lastName}` : 'Unknown'}</div>
                                    </div>

                                    <div className="task-actions">
                                        <select
                                            value={task.status}
                                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                        >
                                            <option value="todo">To do</option>
                                            <option value="in-progress">In progress</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(`/tasks/${task._id}/edit`)}>Edit</button>
                                        <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(task._id)}>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TasksPage;
