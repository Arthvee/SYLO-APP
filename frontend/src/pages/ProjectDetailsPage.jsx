import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProject } from '../hooks/useProject';
import { useToast } from '../hooks/useToast';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    activeProject,
    tasks,
    fetchProjectDetails,
    createTask,
    updateTaskStatus,
    deleteTask,
    deleteProject,
    isLoadingDetails,
  } = useProject();
  const { showToast } = useToast();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    deadline: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (id) {
      fetchProjectDetails(id);
    }
  }, [id, fetchProjectDetails]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskData.title.trim()) {
      showToast('Task title is required', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await createTask(id, {
        title: taskData.title.trim(),
        description: taskData.description.trim(),
        priority: taskData.priority,
        deadline: taskData.deadline || undefined,
      });
      showToast('Task created successfully', 'success');
      setTaskData({ title: '', description: '', priority: 'Medium', deadline: '' });
      setIsTaskModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create task';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      showToast(`Task status updated to ${newStatus}`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update task status';
      showToast(msg, 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(taskId);
      showToast('Task deleted successfully', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete task';
      showToast(msg, 'error');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? All associated tasks will be permanently removed.')) return;
    try {
      await deleteProject(id);
      showToast('Project deleted successfully', 'success');
      navigate('/projects');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete project';
      showToast(msg, 'error');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(taskSearch.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-error-container text-on-error-container';
      case 'Medium':
        return 'bg-primary-fixed text-on-primary-fixed';
      case 'Low':
        return 'bg-tertiary-fixed text-on-tertiary-fixed';
      default:
        return 'bg-surface-container text-on-surface-variant';
    }
  };

  if (isLoadingDetails && !activeProject) {
    return (
      <div className="py-20 text-center text-sm text-on-surface-variant">
        Loading project details...
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-lg font-bold text-on-surface">Project not found</h2>
        <Link to="/projects" className="mt-4 inline-block text-xs font-semibold text-primary hover:underline">
          Return to Projects
        </Link>
      </div>
    );
  }

  const isAdmin = activeProject.role === 'Admin' || activeProject.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
        <Link to="/projects" className="hover:text-primary transition-colors">
          Projects
        </Link>
        <span>/</span>
        <span className="font-semibold text-on-surface truncate max-w-xs">{activeProject.title}</span>
      </div>

      {/* Project Overview Banner */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container p-6 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-on-surface">
                {activeProject.title}
              </h1>
              <span className="rounded-full bg-primary-fixed px-2.5 py-0.5 text-xs font-semibold text-on-primary-fixed">
                {activeProject.status || 'Active'}
              </span>
              <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-semibold text-outline capitalize">
                Role: {activeProject.role || 'Member'}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant max-w-2xl">
              {activeProject.description || 'No description provided.'}
            </p>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/projects/${id}/kanban`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-container bg-surface px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors shadow-subtle"
            >
              <span className="material-symbols-outlined text-base">view_kanban</span>
              Kanban Board
            </Link>
            <Link
              to={`/projects/${id}/members`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-container bg-surface px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors shadow-subtle"
            >
              <span className="material-symbols-outlined text-base">group</span>
              Team Members
            </Link>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-container px-3.5 py-2 text-xs font-semibold text-on-primary hover:bg-primary transition-colors shadow-subtle"
            >
              <span className="material-symbols-outlined text-base">add</span>
              New Task
            </button>
            {isAdmin && (
              <button
                onClick={handleDeleteProject}
                className="p-2 rounded-xl text-outline hover:text-error hover:bg-error-container/20 transition-colors"
                title="Delete Project"
              >
                <span className="material-symbols-outlined text-base">delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress & Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-surface-container">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="text-on-surface-variant">Completion Progress</span>
              <span className="text-primary">{activeProject.progress || 0}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-container">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-300"
                style={{ width: `${activeProject.progress || 0}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-outline">calendar_today</span>
            <div>
              <div className="text-[11px] font-semibold text-outline uppercase">Deadline</div>
              <div className="text-xs font-semibold text-on-surface">
                {activeProject.deadline
                  ? new Date(activeProject.deadline).toLocaleDateString()
                  : 'No deadline'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-outline">checklist</span>
            <div>
              <div className="text-[11px] font-semibold text-outline uppercase">Tasks Total</div>
              <div className="text-xs font-semibold text-on-surface">
                {tasks.filter((t) => t.status === 'Completed').length} / {tasks.length} Completed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container p-6 shadow-card space-y-4">
        {/* Task List Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-lg text-outline">
              search
            </span>
            <input
              type="text"
              placeholder="Search tasks..."
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
              className="w-full rounded-xl bg-surface-container-low pl-9 pr-4 py-2 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'To Do', 'In Progress', 'Completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === tab
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Task List Table */}
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">task_alt</span>
            <p className="text-sm font-semibold text-on-surface">No tasks found</p>
            <p className="text-xs text-on-surface-variant mt-1 mb-4">
              Add actionable tasks to track project progress.
            </p>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-container px-3.5 py-2 text-xs font-semibold text-on-primary hover:bg-primary transition-colors"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Create First Task
            </button>
          </div>
        ) : (
          <div className="divide-y divide-surface-container">
            {filteredTasks.map((task) => {
              const taskId = task.id || task._id;
              return (
                <div
                  key={taskId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 hover:bg-surface-container-low/50 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Status check toggle */}
                    <button
                      onClick={() =>
                        handleStatusChange(
                          taskId,
                          task.status === 'Completed' ? 'To Do' : 'Completed'
                        )
                      }
                      className="mt-0.5 text-outline hover:text-primary transition-colors"
                      title={task.status === 'Completed' ? 'Mark Incomplete' : 'Mark Completed'}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {task.status === 'Completed' ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-semibold text-on-surface ${
                            task.status === 'Completed' ? 'line-through text-outline' : ''
                          }`}
                        >
                          {task.title}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPriorityBadge(
                            task.priority
                          )}`}
                        >
                          {task.priority || 'Medium'}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {task.deadline && (
                      <span className="text-[11px] text-outline flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    )}

                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(taskId, e.target.value)}
                      className="rounded-lg bg-surface border border-surface-container px-2 py-1 text-xs text-on-surface font-medium focus:outline-none focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>

                    <button
                      onClick={() => handleDeleteTask(taskId)}
                      className="p-1 rounded-lg text-outline hover:text-error hover:bg-error-container/20 transition-colors"
                      title="Delete Task"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-on-surface/40 backdrop-blur-xs"
            onClick={() => setIsTaskModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-modal border border-surface-container z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-on-surface">Create New Task</h2>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement user profile avatar upload"
                  value={taskData.title}
                  onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                  className="w-full rounded-xl border border-surface-container bg-surface px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Details, acceptance criteria, or links..."
                  value={taskData.description}
                  onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                  className="w-full rounded-xl border border-surface-container bg-surface px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Priority
                  </label>
                  <select
                    value={taskData.priority}
                    onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
                    className="w-full rounded-xl border border-surface-container bg-surface px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={taskData.deadline}
                    onChange={(e) => setTaskData({ ...taskData, deadline: e.target.value })}
                    className="w-full rounded-xl border border-surface-container bg-surface px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-primary-container px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
