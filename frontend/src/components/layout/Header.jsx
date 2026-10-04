import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const Header = ({ onOpenMobile }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-surface-container bg-surface-container-lowest/80 px-4 md:px-8 backdrop-blur-md">
      {/* Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low lg:hidden"
          aria-label="Open navigation menu"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
        <span className="text-sm font-medium text-on-surface-variant hidden sm:inline">
          Workspace
        </span>
      </div>

      {/* Right User Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-on-surface">
              {user?.name || user?.username}
            </div>
            <div className="text-[11px] text-on-surface-variant">
              {user?.email}
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold">
            {user?.name ? user.name.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
