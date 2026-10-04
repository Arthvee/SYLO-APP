import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const handleConfirmLogout = () => {
    logout();
    showToast('Signed out successfully', 'info');
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
          Settings & Profile
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
          Manage your account profile, verification credentials, and system settings.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container p-6 sm:p-7 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar user={user} size="xl" className="shadow-subtle" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-on-surface">
                {user?.name || user?.username}
              </h2>
              {user?.isVerified && (
                <Badge variant="Completed" size="sm" icon="verified">
                  Verified Member
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              @{user?.username}
            </p>
            <p className="text-xs text-outline mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Read-only Credentials Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-surface-container text-xs">
          <div>
            <span className="font-semibold text-outline uppercase tracking-wider block mb-1">
              Display Name
            </span>
            <div className="rounded-xl bg-surface-container-low px-3.5 py-2.5 text-on-surface font-medium">
              {user?.name || 'Not provided'}
            </div>
          </div>

          <div>
            <span className="font-semibold text-outline uppercase tracking-wider block mb-1">
              Username Handle
            </span>
            <div className="rounded-xl bg-surface-container-low px-3.5 py-2.5 text-on-surface font-medium font-mono">
              @{user?.username}
            </div>
          </div>

          <div className="sm:col-span-2">
            <span className="font-semibold text-outline uppercase tracking-wider block mb-1">
              Email Address
            </span>
            <div className="rounded-xl bg-surface-container-low px-3.5 py-2.5 text-on-surface font-medium">
              {user?.email}
            </div>
          </div>
        </div>
      </div>

      {/* Application Tokens & Architecture */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container p-6 sm:p-7 shadow-card space-y-4">
        <h3 className="text-base font-bold text-on-surface">Design Architecture</h3>
        <p className="text-xs text-on-surface-variant">
          Sylo operates on Google Stitch Design System tokens (Project 17067369580908098964).
        </p>

        <div className="space-y-3 pt-2 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-surface-container">
            <div>
              <div className="font-semibold text-on-surface">Typography Engine</div>
              <div className="text-[11px] text-on-surface-variant">Inter (Sans) & JetBrains Mono (Code)</div>
            </div>
            <Badge variant="Active" size="sm">Active</Badge>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-surface-container">
            <div>
              <div className="font-semibold text-on-surface">Session Security</div>
              <div className="text-[11px] text-on-surface-variant">JWT 24-hour expiration with automatic purge</div>
            </div>
            <Badge variant="Almost Done" size="sm">Enforced</Badge>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-semibold text-on-surface">Shared-Interface Principle</div>
              <div className="text-[11px] text-on-surface-variant">Role-based UI rendering without view bifurcation</div>
            </div>
            <Badge variant="Completed" size="sm">Compliant</Badge>
          </div>
        </div>
      </div>

      {/* Danger Zone: Logout */}
      <div className="rounded-2xl bg-surface-container-lowest border border-error/20 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-error">Session Termination</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Sign out of your active Sylo workspace on this browser.
          </p>
        </div>

        <Button
          variant="danger"
          size="md"
          icon="logout"
          onClick={() => setIsLogoutDialogOpen(true)}
          className="self-start sm:self-auto shrink-0"
        >
          Sign Out
        </Button>
      </div>

      {/* Sign Out Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Sign Out of Sylo"
        message="Are you sure you want to end your current session? You will need to log back in to access your projects."
        confirmText="Sign Out"
      />
    </div>
  );
}
