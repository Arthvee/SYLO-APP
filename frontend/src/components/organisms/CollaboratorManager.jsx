import React, { useState } from 'react';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Input from '../common/Input';
import ConfirmDialog from '../common/ConfirmDialog';
import ProjectAdminGuard from '../guards/ProjectAdminGuard';
import { useAuth } from '../../hooks/useAuth';

/**
 * CollaboratorManager organism for managing team rosters, username invitations, and removals.
 * Restricts administrative collaboration features to the project owner (FR-14, FR-15).
 *
 * @param {object} project
 * @param {Function} onAddCollaborator - (username) => Promise<void>
 * @param {Function} onRemoveCollaborator - (userId) => Promise<void>
 * @param {Function} onLeaveProject - () => Promise<void>
 * @param {boolean} [isLoading=false]
 */
export default function CollaboratorManager({
  project,
  onAddCollaborator,
  onRemoveCollaborator,
  onLeaveProject,
  isLoading = false,
}) {
  const { user } = useAuth();
  const [usernameInput, setUsernameInput] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: null, // 'remove' | 'leave'
    targetUser: null,
    isLoading: false,
  });

  if (!project) return null;

  const currentUserId = (user?.id || user?._id)?.toString();
  const owner = project.owner;
  const collaborators = project.collaborators || [];
  const isAdmin = project.role === 'Admin' || project.role === 'admin';

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    const trimmed = usernameInput.trim().replace(/^@/, '');
    if (!trimmed) {
      setInviteError('Please enter a username to invite');
      return;
    }

    try {
      setIsInviting(true);
      setInviteError('');
      await onAddCollaborator(trimmed);
      setUsernameInput('');
    } catch (err) {
      setInviteError(err.response?.data?.message || err.message || 'Failed to add collaborator');
    } finally {
      setIsInviting(false);
    }
  };

  const handleConfirmAction = async () => {
    setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      if (confirmDialog.type === 'remove' && confirmDialog.targetUser) {
        await onRemoveCollaborator(confirmDialog.targetUser.id || confirmDialog.targetUser._id);
      } else if (confirmDialog.type === 'leave') {
        await onLeaveProject();
      }
      setConfirmDialog({ isOpen: false, type: null, targetUser: null, isLoading: false });
    } catch (err) {
      setConfirmDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin-Only: Add Collaborator Box (FR-14) */}
      <ProjectAdminGuard project={project}>
        <div className="rounded-2xl bg-surface-container-lowest border border-surface-container p-6 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-xl">person_add</span>
            <h3 className="text-sm font-bold text-on-surface">Invite Collaborator</h3>
          </div>
          <p className="text-xs text-on-surface-variant mb-4">
            Invite registered users to this project by entering their unique username (FR-14).
          </p>

          <form onSubmit={handleInviteSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="username"
                icon="alternate_email"
                value={usernameInput}
                error={inviteError}
                disabled={isInviting || isLoading}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  if (inviteError) setInviteError('');
                }}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon="add"
              isLoading={isInviting}
              disabled={isLoading}
              className="self-start sm:self-auto sm:h-[42px]"
            >
              Add Member
            </Button>
          </form>
        </div>
      </ProjectAdminGuard>

      {/* Team Roster Card */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-container">
          <div>
            <h3 className="text-sm font-bold text-on-surface">Project Roster</h3>
            <p className="text-xs text-on-surface-variant">
              {1 + collaborators.length} members with access to this workspace
            </p>
          </div>

          {/* Collaborator Self-Action: Leave Project (FR-18, BR-04) */}
          {!isAdmin && onLeaveProject && (
            <Button
              variant="outline"
              size="sm"
              icon="logout"
              onClick={() =>
                setConfirmDialog({
                  isOpen: true,
                  type: 'leave',
                  targetUser: null,
                  isLoading: false,
                })
              }
              className="border-error/30 text-error hover:bg-error-container/20"
            >
              Leave Project
            </Button>
          )}
        </div>

        {/* Member List Table / Rows */}
        <div className="divide-y divide-surface-container">
          {/* Owner Entry */}
          {owner && (
            <div className="flex items-center justify-between py-3.5 px-1">
              <div className="flex items-center gap-3">
                <Avatar user={owner} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface">
                      {owner.name || owner.username}
                    </span>
                    <Badge variant="Owner" size="sm" />
                  </div>
                  <div className="text-[11px] text-on-surface-variant">
                    @{owner.username} &bull; {owner.email}
                  </div>
                </div>
              </div>

              <span className="text-xs font-semibold text-outline">Project Creator</span>
            </div>
          )}

          {/* Collaborators List */}
          {collaborators.map((item) => {
            const memberUser = item.user || item;
            const mId = (memberUser.id || memberUser._id)?.toString();
            const isCurrentUser = mId === currentUserId;

            return (
              <div
                key={mId}
                className="flex items-center justify-between py-3.5 px-1 hover:bg-surface-container-low/40 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar user={memberUser} size="md" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-on-surface">
                        {memberUser.name || memberUser.username}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[10px] font-bold text-primary">(You)</span>
                      )}
                    </div>
                    <div className="text-[11px] text-on-surface-variant">
                      @{memberUser.username} &bull; {memberUser.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="Collaborator" size="sm" />

                  {/* Admin-Only: Remove Collaborator (FR-15) */}
                  <ProjectAdminGuard project={project}>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmDialog({
                          isOpen: true,
                          type: 'remove',
                          targetUser: memberUser,
                          isLoading: false,
                        })
                      }
                      className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container/20 transition-colors"
                      title="Remove Collaborator"
                      aria-label={`Remove ${memberUser.name || memberUser.username}`}
                    >
                      <span className="material-symbols-outlined text-base">person_remove</span>
                    </button>
                  </ProjectAdminGuard>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() =>
          setConfirmDialog({ isOpen: false, type: null, targetUser: null, isLoading: false })
        }
        onConfirm={handleConfirmAction}
        isLoading={confirmDialog.isLoading}
        title={
          confirmDialog.type === 'remove'
            ? 'Remove Collaborator'
            : 'Leave Project'
        }
        message={
          confirmDialog.type === 'remove'
            ? `Are you sure you want to remove @${
                confirmDialog.targetUser?.username
              } from this project? They will also be removed from any assigned tasks (FR-16).`
            : `Are you sure you want to leave ${project.title}? You will no longer have access to this project or its tasks.`
        }
        confirmText={confirmDialog.type === 'remove' ? 'Remove Member' : 'Leave'}
      />
    </div>
  );
}
