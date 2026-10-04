import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProject } from '../../hooks/useProject';

/**
 * Declarative UI Permission Guard enforcing Admin-only actions (FR-12, FR-13, FR-14, FR-15, FR-19).
 * Renders children strictly if the current authenticated user is the Admin/Owner of the project.
 *
 * @param {object} [project] - Explicit project object, or falls back to activeProject from context
 * @param {React.ReactNode} children - Admin-only elements (e.g. Delete Project, New Task, Add Collaborator)
 * @param {React.ReactNode} [fallback=null] - Rendered if user is a standard Collaborator
 */
export default function ProjectAdminGuard({
  project,
  children,
  fallback = null,
}) {
  const { user } = useAuth();
  const { activeProject } = useProject();

  const targetProject = project || activeProject;

  if (!targetProject || !user) {
    return fallback;
  }

  const userId = user.id || user._id;
  const ownerId = targetProject.owner
    ? typeof targetProject.owner === 'object'
      ? targetProject.owner.id || targetProject.owner._id
      : targetProject.owner
    : null;

  const isOwner = Boolean(ownerId && userId && ownerId.toString() === userId.toString());
  const isAdminRole = targetProject.role === 'Admin' || targetProject.role === 'admin';

  if (isOwner || isAdminRole) {
    return <>{children}</>;
  }

  return fallback;
}
