import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

/**
 * Main application layout shell for authenticated workspace pages (FR-39).
 * Features fixed desktop sidebar, sticky header, and responsive content area.
 */
const AppLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar (Desktop persistent, Mobile drawer) */}
      <Sidebar
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Pane */}
      <div className="flex flex-1 flex-col lg:pl-64 min-w-0">
        <Header onOpenMobile={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
