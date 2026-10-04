import React from 'react';
import { Link } from 'react-router-dom';
import Badge from '../common/Badge';
import Button from '../common/Button';
import ProgressBar from '../common/ProgressBar';
import ProjectAdminGuard from '../guards/ProjectAdminGuard';
import { formatDate, isOverdue } from '../../utils/formatters';

/**
 * ProjectHeader organism rendering project overview, progress bar, view navigation, and RBAC action controls.
 * Adheres strictly to the Shared-Interface Principle (FR-35, FR-36, BR-15).
 *
 * @param {object} project
 * @param {'details' | 'kanban' | 'members'} [activeTab='details']
 * @param {Function} [onOpenNewTask]
 * @param {Function} [onOpenEditProject]
 * @param {Function} [onOpenDeleteProject]
 * @param {Function} [onOpenLeaveProject]
 */
export default function ProjectHeader({
  project,
  activeTab = 'details',
  onOpenNewTask,
  onOpenEditProject,
  onOpenDeleteProject,
  onOpenLeaveProject,
}) {
  if (!project) return null;

  const projectId = project.id || project._id;
  const projectOverdue = isOverdue(project.deadline, project.status);
  const isAdmin = project.role === 'Admin' || project.role === 'admin';

  return (
    <div className="rounded-2xl bg-surface-container-lowest border border-surface-container p-6 shadow-card space-y-5">
      {/* Top Row: Title, Badges, and Action Group */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              {project.title}
            </h1>
            <Badge status={projectOverdue ? 'Overdue' : project.status || 'Active'} />
            <Badge role={project.role || 'Member'} size="sm" />
          </div>

          <p className="text-xs text-on-surface-variant max-w-2xl leading-relaxed">
            {project.description || 'No description provided for this project.'}
          </p>
        </div>

        {/* Action Controls Guarded by Role */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Admin-Only: New Task Action (FR-19) */}
          <ProjectAdminGuard project={project}>
            {onOpenNewTask && (
              <Button
                variant="primary"
                size="md"
                icon="add"
                onClick={onOpenNewTask}
              >
                New Task
              </Button>
            )}

            {onOpenEditProject && (
              <Button
                variant="outline"
                size="md"
                icon="edit"
                onClick={onOpenEditProject}
                title="Edit Project Details"
              >
                Edit
              </Button>
            )}

            {onOpenDeleteProject && (
              <button
                type="button"
                onClick={onOpenDeleteProject}
                className="p-2 rounded-xl text-outline hover:text-error hover:bg-error-container/20 transition-colors"
                title="Delete Project (Admin only)"
                aria-label="Delete project"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            )}
          </ProjectAdminGuard>

          {/* Collaborator-Only: Leave Project Action (FR-18, BR-04) */}
          {!isAdmin && onOpenLeaveProject && (
            <Button
              variant="outline"
              size="md"
              icon="logout"
              onClick={onOpenLeaveProject}
              className="border-error/30 text-error hover:bg-error-container/20"
            >
              Leave Project
            </Button>
          )}
        </div>
      </div>

      {/* Progress & Metadata Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-surface-container">
        <div>
          <ProgressBar
            progress={project.progress || 0}
            size="md"
            showLabel={true}
            label="Overall Progress"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container text-on-surface shrink-0">
            <span className="material-symbols-outlined text-lg">calendar_today</span>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-outline uppercase tracking-wider">
              Deadline
            </div>
            <div
              className={`text-xs font-semibold ${
                projectOverdue ? 'text-error' : 'text-on-surface'
              }`}
            >
              {project.deadline ? formatDate(project.deadline) : 'No deadline'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container text-on-surface shrink-0">
            <span className="material-symbols-outlined text-lg">checklist</span>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-outline uppercase tracking-wider">
              Task Workload
            </div>
            <div className="text-xs font-semibold text-on-surface">
              {project.taskCount || 0} Tasks ({project.completedTaskCount || 0} Done)
            </div>
          </div>
        </div>
      </div>

      {/* Navigation View Switcher Tabs (Shared Interface Principle) */}
      <div className="flex items-center gap-2 pt-2 border-t border-surface-container overflow-x-auto">
        <Link
          to={`/projects/${projectId}`}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'details'
              ? 'bg-primary-fixed text-on-primary-fixed font-bold'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-base">table_rows</span>
          Task Table
        </Link>

        <Link
          to={`/projects/${projectId}/kanban`}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'kanban'
              ? 'bg-primary-fixed text-on-primary-fixed font-bold'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-base">view_kanban</span>
          Kanban Board
        </Link>

        <Link
          to={`/projects/${projectId}/members`}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'members'
              ? 'bg-primary-fixed text-on-primary-fixed font-bold'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-base">group</span>
          Team Members
        </Link>
      </div>
    </div>
  );
}
