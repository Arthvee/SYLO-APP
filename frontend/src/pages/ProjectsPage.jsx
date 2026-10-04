import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../hooks/useProject';
import { useToast } from '../hooks/useToast';

export default function ProjectsPage() {
  const { projects, fetchProjects, createProject, isLoadingProjects } = useProject();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
  });

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Project title is required', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await createProject({
        title: formData.title.trim(),
        description: formData.description.trim(),
        deadline: formData.deadline || undefined,
      });
      showToast('Project created successfully', 'success');
      setFormData({ title: '', description: '', deadline: '' });
      setIsModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create project';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || (project.status && project.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-[#e6f4ea] text-[#137333]';
      case 'Almost Done':
        return 'bg-tertiary-fixed text-on-tertiary-fixed';
      case 'Overdue':
        return 'bg-error-container text-on-error-container';
      default:
        return 'bg-primary-fixed text-on-primary-fixed';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Projects</h1>
          <p className="text-sm text-on-surface-variant">
            Manage your active workspaces and track overall project milestones.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-primary-container px-4 py-2.5 text-xs font-semibold text-on-primary hover:bg-primary transition-colors shadow-subtle"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Project
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl bg-surface-container-lowest p-3 border border-surface-container shadow-card">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-lg text-outline">
            search
          </span>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl bg-surface-container-low pl-9 pr-4 py-2 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'Active', 'Almost Done', 'Completed', 'Overdue'].map((tab) => (
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

      {/* Projects Grid */}
      {isLoadingProjects ? (
        <div className="py-12 text-center text-sm text-on-surface-variant">
          Loading projects...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-surface-container-lowest border border-surface-container">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">folder_off</span>
          <p className="text-sm font-semibold text-on-surface">No projects matched your criteria</p>
          <p className="text-xs text-on-surface-variant mt-1 mb-4">
            Try adjusting filters or create a new workspace project.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-container px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const pId = project.id || project._id;
            return (
              <div
                key={pId}
                className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest border border-surface-container p-5 hover:border-primary/40 hover:shadow-card transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getStatusBadge(
                        project.status
                      )}`}
                    >
                      {project.status || 'Active'}
                    </span>
                    <span className="text-xs font-semibold text-outline capitalize">
                      {project.role || 'Member'}
                    </span>
                  </div>

                  <Link to={`/projects/${pId}`}>
                    <h3 className="text-base font-bold text-on-surface hover:text-primary transition-colors mb-1">
                      {project.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-on-surface-variant line-clamp-2 mb-4">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                <div>
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-on-surface-variant">Progress</span>
                      <span className="text-primary">{project.progress || 0}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-surface-container">
                      <div
                        className="h-1.5 rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions & Meta */}
                  <div className="flex items-center justify-between pt-3 border-t border-surface-container text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-sm">task_alt</span>
                      {project.taskCount || 0} tasks
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/projects/${pId}/kanban`}
                        className="p-1.5 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface transition-colors"
                        title="Kanban Board"
                      >
                        <span className="material-symbols-outlined text-base">view_kanban</span>
                      </Link>
                      <Link
                        to={`/projects/${pId}`}
                        className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                      >
                        Details
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-on-surface/40 backdrop-blur-xs"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-modal border border-surface-container z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-on-surface">Create New Project</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Website Redesign"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-surface-container bg-surface px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline project objectives and scope..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-surface-container bg-surface px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full rounded-xl border border-surface-container bg-surface px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-primary-container px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
