import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast('Signed out successfully', 'info');
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">Settings & Profile</h1>
        <p className="text-sm text-on-surface-variant">
          Manage your account credentials and workspace preferences.
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container p-6 shadow-card space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-2xl shadow-subtle">
            {user?.name ? user.name.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-on-surface">{user?.name || user?.username}</h2>
            <p className="text-xs text-on-surface-variant">@{user?.username}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f4ea] px-2.5 py-0.5 text-[11px] font-semibold text-[#137333]">
                <span className="material-symbols-outlined text-xs">verified</span>
                Verified Account
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-surface-container text-xs">
          <div>
            <span className="font-semibold text-outline uppercase block mb-1">Full Name</span>
            <div className="rounded-xl bg-surface-container-low px-3 py-2 text-on-surface font-medium">
              {user?.name || 'Not provided'}
            </div>
          </div>

          <div>
            <span className="font-semibold text-outline uppercase block mb-1">Username</span>
            <div className="rounded-xl bg-surface-container-low px-3 py-2 text-on-surface font-medium font-mono">
              @{user?.username}
            </div>
          </div>

          <div className="md:col-span-2">
            <span className="font-semibold text-outline uppercase block mb-1">Email Address</span>
            <div className="rounded-xl bg-surface-container-low px-3 py-2 text-on-surface font-medium">
              {user?.email}
            </div>
          </div>
        </div>
      </div>

      {/* System Preferences Card */}
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container p-6 shadow-card space-y-4">
        <h3 className="text-base font-bold text-on-surface">Application System</h3>
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-surface-container">
            <div>
              <div className="font-semibold text-on-surface">Google Stitch Design System</div>
              <div className="text-on-surface-variant text-[11px]">Tokenized CSS variables and Material Symbols</div>
            </div>
            <span className="rounded-full bg-primary-fixed px-2.5 py-0.5 font-semibold text-on-primary-fixed text-[11px]">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-semibold text-on-surface">Session Security</div>
              <div className="text-on-surface-variant text-[11px]">JWT 24-hour expiration with automatic purge</div>
            </div>
            <span className="rounded-full bg-tertiary-fixed px-2.5 py-0.5 font-semibold text-on-tertiary-fixed text-[11px]">
              Enforced
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl bg-surface-container-lowest border border-error/20 p-6 shadow-card">
        <h3 className="text-base font-bold text-error mb-1">Account Session</h3>
        <p className="text-xs text-on-surface-variant mb-4">
          Terminate your current authentication session on this device.
        </p>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-xl bg-error px-4 py-2 text-xs font-semibold text-on-error hover:bg-error/90 transition-colors shadow-subtle"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          Sign Out of Sylo
        </button>
      </div>
    </div>
  );
}
