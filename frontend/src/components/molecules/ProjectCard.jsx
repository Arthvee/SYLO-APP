import React from 'react';
import { Link } from 'react-router-dom';
import Badge from '../common/Badge';
import ProgressBar from '../common/ProgressBar';
import { AvatarGroup } from '../common/Avatar';
import { formatDate, isOverdue } from '../../utils/formatters';

/**
 * ProjectCard molecule displaying project status, progress, collaborators, and metadata.
 *
 * @param {object} project
 * @param {Function} [onEdit]
 * @param {Function} [onDelete]
 */
export default function ProjectCard({
  project,
  onEdit,
  onDelete,
  className = '',
}) {
  if (!project) return null;

  const projectId = project.id || project._id;
  const projectOverdue = isOverdue(project.deadline, project.status);
  const isAdmin = project.role === 'Admin' || project.role === 'admin';

  // Gather project collaborators for avatar stack
  const members = [
    ...(project.owner ? [project.owner] : []),
    ...(project.collaborators || []).map((c) => c.user || c),
  ];

  return (
    <div
      className={`flex flex-col justify-between rounded-2xl bg-surface-container-lowest border border-surface-container p-5 hover:border-primary/40 hover:shadow-card transition-all duration-200 group ${className}`}
    >
      <div>
        {/* Top Badges & Actions */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge status={projectOverdue ? 'Overdue' : project.status || 'Active'} />
            <Badge role={project.role || 'Member'} size="sm" />
          </div>

          {(onEdit || onDelete) && isAdmin && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(project)}
                  className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                  title="Edit Project"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(project)}
                  className="p-1 rounded-lg text-outline hover:text-error hover:bg-error-container/20 transition-colors"
                  title="Delete Project"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Project Title & Description */}
        <Link to={`/projects/${projectId}`}>
          <h3 className="text-base font-bold text-on-surface hover:text-primary transition-colors line-clamp-1 mb-1.5">
            {project.title}
          </h3>
        </Link>
        <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed mb-4">
          {project.description || 'No description provided.'}
        </p>
      </div>

      <div className="space-y-3.5">
        {/* Progress Bar Component */}
        <ProgressBar
          progress={project.progress || 0}
          size="md"
          showLabel={true}
          label="Progress"
        />

        {/* Footer Meta: Collaborators, Tasks, Links */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-container text-xs text-on-surface-variant">
          <div className="flex items-center gap-2">
            <AvatarGroup users={members} max={3} size="xs" />
            <span className="text-[11px] font-medium text-outline">
              {project.taskCount || 0} tasks
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {project.deadline && (
              <span
                className={`flex items-center gap-1 text-[11px] ${
                  projectOverdue ? 'text-error font-semibold' : 'text-outline'
                }`}
                title={`Deadline: ${formatDate(project.deadline)}`}
              >
                <span className="material-symbols-outlined text-xs">
                  {projectOverdue ? 'event_busy' : 'calendar_today'}
                </span>
                {formatDate(project.deadline)}
              </span>
            )}

            <Link
              to={`/projects/${projectId}/kanban`}
              className="p-1 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface transition-colors"
              title="Open Kanban Board"
            >
              <span className="material-symbols-outlined text-base">view_kanban</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
