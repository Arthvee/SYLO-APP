import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProject } from '../../hooks/useProject';

/**
 * Declarative UI Permission Guard enforcing task status mutations (FR-27, BR-10).
 * A user can mutate a task's status strictly if they are:
 * 1. The Project Admin/Owner, OR
 * 2. An assigned member on that specific task.
 *
 * @param {object} task - Task object containing assignees
 * @param {object} [project] - Explicit project object, or falls back to activeProject
 * @param {React.ReactNode} children - Interactive status controls
 * @param {React.ReactNode} [fallback=null] - Read-only status indicator
 */
export default function TaskAssigneeGuard({
  task,
  project,
  children,
  fallback = null,
}) {
  const { user } = useAuth();
  const { activeProject } = useProject();

  const targetProject = project || activeProject;

  if (!task || !user) {
    return fallback;
  }

  const userId = (user.id || user._id)?.toString();

  // Check if user is Project Admin / Owner
  const ownerId = targetProject?.owner
    ? (typeof targetProject.owner === 'object'
        ? targetProject.owner.id || targetProject.owner._id
        : targetProject.owner
      )?.toString()
    : null;

  const isAdmin =
    Boolean(ownerId && userId && ownerId === userId) ||
    targetProject?.role === 'Admin' ||
    targetProject?.role === 'admin';

  if (isAdmin) {
    return <>{children}</>;
  }

  // Check if current user is an assignee of this task
  const isAssignee = Array.isArray(task.assignees) && task.assignees.some((a) => {
    const assigneeId = (typeof a === 'object' ? a.id || a._id : a)?.toString();
    return assigneeId === userId;
  });

  if (isAssignee) {
    return <>{children}</>;
  }

  return fallback;
}
