import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProject } from '../hooks/useProject';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export default function TeamMembersPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    activeProject,
    fetchProjectDetails,
    addCollaborator,
    removeCollaborator,
    leaveProject,
    isLoadingDetails,
  } = useProject();
  const { showToast } = useToast();

  const [usernameInput, setUsernameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProjectDetails(id);
    }
  }, [id, fetchProjectDetails]);

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      showToast('Please enter a username to invite', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await addCollaborator(id, usernameInput.trim());
      showToast(`Added @${usernameInput.trim()} to project`, 'success');
      setUsernameInput('');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to add collaborator';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCollaborator = async (userId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this project?`)) return;

    try {
      await removeCollaborator(id, userId);
      showToast('Collaborator removed from project', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to remove collaborator';
      showToast(msg, 'error');
    }
  };

  const handleLeaveProject = async () => {
    if (!window.confirm('Are you sure you want to leave this project? You will lose access until invited again.')) return;

    try {
      await leaveProject(id);
      showToast('You have left the project', 'success');
      navigate('/projects');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to leave project';
      showToast(msg, 'error');
    }
  };

  if (isLoadingDetails && !activeProject) {
    return (
      <div className="py-20 text-center text-sm text-on-surface-variant">
        Loading members...
      </div>
    );
  }

  const isAdmin = activeProject?.role === 'Admin' || activeProject?.role === 'admin';
  const owner = activeProject?.owner;
  const collaborators = activeProject?.collaborators || [];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
        <Link to="/projects" className="hover:text-primary transition-colors">
          Projects
        </Link>
        <span>/</span>
        <Link to={`/projects/${id}`} className="hover:text-primary transition-colors">
          {activeProject?.title || 'Project'}
        </Link>
        <span>/</span>
        <span className="font-semibold text-on-surface">Team Members</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            Team & Collaborators
          </h1>
          <p className="text-sm text-on-surface-variant">
            Manage who has access to {activeProject?.title}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isAdmin && (
            <button
              onClick={handleLeaveProject}
              className="inline-flex items-center gap-1.5 rounded-xl border border-error/30 bg-surface px-3 py-2 text-xs font-semibold text-error hover:bg-error-container/20 transition-colors"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              Leave Project
            </button>
          )}
          <Link
            to={`/projects/${id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-surface-container bg-surface px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors shadow-subtle"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Project
          </Link>
        </div>
      </div>

      {/* Invite Collaborator (Admin only) */}
      {isAdmin && (
        <div className="rounded-2xl bg-surface-container-lowest border border-surface-container p-6 shadow-card">
          <h2 className="text-sm font-bold text-on-surface mb-1">Add Collaborator</h2>
          <p className="text-xs text-on-surface-variant mb-4">
            Invite registered users by entering their unique username (FR-15).
          </p>

          <form onSubmit={handleAddCollaborator} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-outline">@</span>
              <input
                type="text"
                placeholder="username"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full rounded-xl bg-surface-container-low pl-8 pr-4 py-2 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-container px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary transition-colors disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              {isSubmitting ? 'Adding...' : 'Add Member'}
            </button>
          </form>
        </div>
      )}

      {/* Members List */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container p-6 shadow-card space-y-4">
        <h2 className="text-sm font-bold text-on-surface">Project Members</h2>

        <div className="divide-y divide-surface-container">
          {/* Owner Entry */}
          {owner && (
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-on-primary font-bold text-sm">
                  {owner.name ? owner.name.charAt(0).toUpperCase() : owner.username?.charAt(0).toUpperCase() || 'O'}
                </div>
                <div>
                  <div className="text-xs font-bold text-on-surface">{owner.name || owner.username}</div>
                  <div className="text-[11px] text-on-surface-variant">@{owner.username} &bull; {owner.email}</div>
                </div>
              </div>
              <span className="rounded-full bg-primary-fixed px-2.5 py-0.5 text-[11px] font-semibold text-on-primary-fixed">
                Owner / Admin
              </span>
            </div>
          )}

          {/* Collaborator Entries */}
          {collaborators.map((collab) => {
            const collabUser = collab.user || collab;
            const cId = collabUser.id || collabUser._id;
            const isCurrentUser = user && (user.id === cId || user._id === cId);

            return (
              <div key={cId} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-on-surface font-bold text-sm">
                    {collabUser.name
                      ? collabUser.name.charAt(0).toUpperCase()
                      : collabUser.username?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-on-surface">
                      {collabUser.name || collabUser.username}
                      {isCurrentUser && (
                        <span className="ml-2 text-[10px] text-primary font-semibold">(You)</span>
                      )}
                    </div>
                    <div className="text-[11px] text-on-surface-variant">
                      @{collabUser.username} &bull; {collabUser.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-[11px] font-semibold text-outline capitalize">
                    {collab.role || 'Collaborator'}
                  </span>

                  {isAdmin && (
                    <button
                      onClick={() =>
                        handleRemoveCollaborator(cId, collabUser.name || collabUser.username)
                      }
                      className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container/20 transition-colors"
                      title="Remove Collaborator"
                    >
                      <span className="material-symbols-outlined text-base">person_remove</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
