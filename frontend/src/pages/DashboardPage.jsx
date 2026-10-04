import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProject } from '../hooks/useProject';
import { useToast } from '../hooks/useToast';
import MetricCard from '../components/molecules/MetricCard';
import ProjectCard from '../components/molecules/ProjectCard';
import ProjectModal from '../components/modals/ProjectModal';
import Button from '../components/common/Button';
import Skeleton from '../components/common/Skeleton';
import { isOverdue } from '../utils/formatters';

export default function DashboardPage() {
  const { user } = useAuth();
  const { projects, fetchProjects, createProject, isLoadingProjects } = useProject();
  const { showToast } = useToast();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (formData) => {
    try {
      setIsSubmitting(true);
      await createProject(formData);
      showToast('Project created successfully', 'success');
      setIsCreateModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create project';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalProjects = projects.length;
  const totalTasks = projects.reduce((acc, p) => acc + (p.taskCount || 0), 0);
  const completedTasks = projects.reduce((acc, p) => acc + (p.completedTaskCount || 0), 0);
  const overdueProjects = projects.filter((p) => isOverdue(p.deadline, p.status)).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
            Welcome back, {user?.name || user?.username}!
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Overview of your workspaces, workload distribution, and milestone progress.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon="add"
          onClick={() => setIsCreateModalOpen(true)}
          className="self-start sm:self-auto shrink-0"
        >
          New Project
        </Button>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Projects"
          value={totalProjects}
          icon="folder"
          variant="primary"
          subtitle="Workspaces enrolled"
          isLoading={isLoadingProjects}
        />
        <MetricCard
          title="Total Tasks"
          value={totalTasks}
          icon="checklist"
          variant="default"
          subtitle="All assigned tasks"
          isLoading={isLoadingProjects}
        />
        <MetricCard
          title="Completed"
          value={completedTasks}
          icon="check_circle"
          variant="tertiary"
          subtitle="Done milestones"
          isLoading={isLoadingProjects}
        />
        <MetricCard
          title="Overdue Items"
          value={overdueProjects}
          icon="event_busy"
          variant="secondary"
          subtitle="Past target deadlines"
          isLoading={isLoadingProjects}
        />
      </div>

      {/* Recent Projects Section */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-on-surface">
              Active Projects
            </h2>
            <p className="text-xs text-on-surface-variant">
              Quick access to your recent workspaces (FR-34)
            </p>
          </div>
          <Link
            to="/projects"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            View All
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {isLoadingProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl bg-surface-container-low border border-surface-container p-5 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <Skeleton variant="text" width="40%" height="16px" />
                  <Skeleton variant="text" width="20%" height="16px" />
                </div>
                <Skeleton variant="text" width="80%" height="20px" />
                <Skeleton variant="text" width="90%" height="12px" />
                <Skeleton variant="rect" height="8px" className="mt-4" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-dashed border-surface-container">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">
              folder_off
            </span>
            <p className="text-sm font-semibold text-on-surface">No projects available</p>
            <p className="text-xs text-on-surface-variant mt-1 mb-4">
              Get started by creating your first collaborative project workspace.
            </p>
            <Button
              variant="primary"
              size="sm"
              icon="add"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create Workspace
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
            {projects.slice(0, 6).map((project) => (
              <ProjectCard
                key={project.id || project._id}
                project={project}
              />
            ))}
          </div>
        )}
      </div>

      {/* Project Creation Modal */}
      <ProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
        isLoading={isSubmitting}
      />
    </div>
  );
}
