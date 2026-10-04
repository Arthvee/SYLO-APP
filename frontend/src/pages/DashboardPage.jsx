import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProject } from '../hooks/useProject';

export default function DashboardPage() {
  const { user } = useAuth();
  const { projects, fetchProjects, isLoadingProjects } = useProject();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const totalProjects = projects.length;
  const totalTasks = projects.reduce((acc, p) => acc + (p.taskCount || 0), 0);
  const completedTasks = projects.reduce((acc, p) => acc + (p.completedTaskCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            Welcome, {user?.name || user?.username}!
          </h1>
          <p className="text-sm text-on-surface-variant">
            Here is what is happening across your projects today.
          </p>
        </div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-primary-container px-4 py-2.5 text-xs font-semibold text-on-primary hover:bg-primary transition-colors shadow-subtle"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Project
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-surface-container-lowest p-5 border border-surface-container shadow-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Total Projects
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
              <span className="material-symbols-outlined text-lg">folder</span>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-on-surface">{totalProjects}</div>
        </div>

        <div className="rounded-2xl bg-surface-container-lowest p-5 border border-surface-container shadow-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Total Tasks
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high text-on-surface">
              <span className="material-symbols-outlined text-lg">task</span>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-on-surface">{totalTasks}</div>
        </div>

        <div className="rounded-2xl bg-surface-container-lowest p-5 border border-surface-container shadow-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Completed Tasks
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tertiary-fixed text-on-tertiary-fixed">
              <span className="material-symbols-outlined text-lg">check_circle</span>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-on-surface">{completedTasks}</div>
        </div>
      </div>

      {/* Recent Projects Section */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-on-surface">Your Projects</h2>
          <Link to="/projects" className="text-xs font-semibold text-primary hover:underline">
            View All
          </Link>
        </div>

        {isLoadingProjects ? (
          <div className="py-8 text-center text-sm text-on-surface-variant">
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="py-12 text-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">folder_off</span>
            <p className="text-sm font-medium text-on-surface">No projects found</p>
            <p className="text-xs text-on-surface-variant mt-1 mb-4">
              Get started by creating your first workspace project.
            </p>
            <Link
              to="/projects"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-container px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary transition-colors"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Create Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((project) => {
              const statusClass =
                project.status === 'Completed'
                  ? 'bg-[#e6f4ea] text-[#137333]'
                  : project.status === 'Almost Done'
                  ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                  : 'bg-primary-fixed text-on-primary-fixed';

              return (
                <Link
                  key={project.id || project._id}
                  to={`/projects/${project.id || project._id}`}
                  className="flex flex-col justify-between rounded-xl border border-surface-container bg-surface p-4 hover:border-primary/40 hover:shadow-subtle transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusClass}`}>
                        {project.status || 'Active'}
                      </span>
                      <span className="text-xs text-on-surface-variant font-medium">
                        {project.role || 'Member'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-on-surface line-clamp-1 mb-1">
                      {project.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2">
                      {project.description || 'No description provided'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
                    <span>{project.taskCount || 0} tasks</span>
                    <span className="font-semibold text-primary">{project.progress || 0}%</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
