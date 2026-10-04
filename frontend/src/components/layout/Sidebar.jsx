import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Projects', path: '/projects', icon: 'folder' },
    { label: 'Settings', path: '/settings', icon: 'settings' },
  ];

  const getNavLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary-fixed text-on-primary-fixed font-semibold'
        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
    }`;

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-surface-container-lowest border-r border-surface-container p-4">
      {/* Brand & Nav */}
      <div>
        <div className="flex items-center justify-between px-2 mb-6 h-12">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-container text-on-primary">
              <span className="material-symbols-outlined text-xl">hub</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-on-surface">Sylo</span>
          </div>
          {isMobileOpen && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-outline hover:text-on-surface lg:hidden"
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>

        <nav className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={onCloseMobile}
              className={getNavLinkClass}
            >
              <span className="material-symbols-outlined text-xl">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Card & Logout */}
      <div className="border-t border-surface-container pt-4">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-sm shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-on-surface truncate">
              {user?.name || user?.username}
            </div>
            <div className="text-xs text-on-surface-variant truncate">
              @{user?.username}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-error hover:bg-error-container/40 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-on-surface/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-full shadow-modal">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
