import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import BHIVNavbar from './BHIVNavbar.jsx';
import BHIVSidebar from './BHIVSidebar.jsx';
import CommandPalette from './CommandPalette.jsx';
import { MitraPanel } from '../mitra/index.js';
import Galaxy from '../Galaxy.jsx';
import './BHIVShell.css';

/**
 * Composite BHIV Application Shell
 * Wraps all operational screens with Navbar, Collapsible Navigation Rail, Command Palette, and background Galaxy layer.
 */
const BHIVShell = ({
  children,
  activeView = 'dashboard',
  onSelectView,
  user,
  onLogout,
  isOffline = false
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showMitraModal, setShowMitraModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleMitraClick = () => {
    handleCloseSidebar();
    setShowMitraModal(true);
  };

  const handleCloseMitraModal = () => {
    setShowMitraModal(false);
  };

  return (
    <div className="bhiv-shell">
      {/* Background Galaxy layer - subtle, calm atmospheric enterprise aesthetic */}
      <div className="bhiv-shell__galaxy-layer" aria-hidden="true">
        <Galaxy
          mouseInteraction
          density={0.5}
          glowIntensity={0.08}
          saturation={0}
          hueShift={210}
          twinkleIntensity={0.2}
          rotationSpeed={0.03}
          starSpeed={0.15}
          speed={0.4}
        />
      </div>

      {/* Top Navbar */}
      <BHIVNavbar
        user={user}
        onLogout={onLogout}
        onNavigateHome={() => onSelectView('dashboard')}
        isOffline={isOffline}
        onToggleSidebar={handleToggleSidebar}
        isSidebarOpen={isSidebarOpen}
        onMitraClick={handleMitraClick}
        isMitraOpen={showMitraModal}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
      />

      {/* Main Layout Body */}
      <div className="bhiv-shell__body">
        <BHIVSidebar
          activeView={activeView}
          onSelectView={onSelectView}
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          onMitraClick={handleMitraClick}
        />

        <div className="bhiv-shell__main">
          {children}
        </div>
      </div>

      {/* Modular MITRA Companion Panel */}
      <MitraPanel
        isOpen={showMitraModal}
        onClose={handleCloseMitraModal}
        user={user}
      />

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSelectView={onSelectView}
        onOpenMitra={() => setShowMitraModal(true)}
      />
    </div>
  );
};

BHIVShell.propTypes = {
  children: PropTypes.node,
  activeView: PropTypes.string,
  onSelectView: PropTypes.func.isRequired,
  user: PropTypes.object,
  onLogout: PropTypes.func,
  isOffline: PropTypes.bool
};

export default BHIVShell;
