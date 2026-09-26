import React from 'react';
import PropTypes from 'prop-types';
import { Search } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge.jsx';
import BHIVButton from '../ui/BHIVButton.jsx';
import { MitraLauncher } from '../mitra/index.js';
import './BHIVNavbar.css';

/**
 * BHIV Application Navbar
 * Compact top navigation with BHIV identity, product context, and system operational state.
 */
const BHIVNavbar = ({
  user,
  onLogout,
  onNavigateHome,
  isOffline = false,
  onToggleSidebar,
  isSidebarOpen = false,
  onMitraClick,
  isMitraOpen = false,
  onOpenCommandPalette
}) => {
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="bhiv-navbar" role="banner">
      <div className="bhiv-navbar__left">
        <button
          type="button"
          className="bhiv-navbar__toggle-btn"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Close navigation sidebar' : 'Open navigation sidebar'}
          aria-expanded={isSidebarOpen}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {isSidebarOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>

        <div
          className="bhiv-navbar__brand"
          onClick={onNavigateHome}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateHome?.();
            }
          }}
          aria-label="NYAI Dashboard Home"
        >
          <img src="/03.svg" alt="NYAI Logo" className="bhiv-navbar__logo" />
          <div className="bhiv-navbar__brand-text">
            <span className="bhiv-navbar__brand-ecosystem">BHIV</span>
            <span className="bhiv-navbar__brand-separator">/</span>
            <span className="bhiv-navbar__brand-product">NYAI</span>
          </div>
        </div>

        <div className="bhiv-navbar__product-badge">
          <StatusBadge variant="neutral" size="sm">
            LEGAL INTELLIGENCE
          </StatusBadge>
        </div>
      </div>

      {/* Center Search trigger */}
      {onOpenCommandPalette && (
        <button
          type="button"
          className="bhiv-navbar__search-trigger"
          onClick={onOpenCommandPalette}
          aria-label="Open command palette search (Ctrl+K)"
          title="Search workspace modules, procedures & statutes (Ctrl+K)"
        >
          <Search size={14} className="bhiv-navbar__search-icon" aria-hidden="true" />
          <span className="bhiv-navbar__search-text">Search modules, statutes, procedures...</span>
          <kbd className="bhiv-navbar__search-kbd">⌘K</kbd>
        </button>
      )}

      <div className="bhiv-navbar__right">
        {onMitraClick && (
          <MitraLauncher
            variant="navbar"
            onClick={onMitraClick}
            isOpen={isMitraOpen}
          />
        )}

        <div className="bhiv-navbar__status">
          <StatusBadge
            variant={isOffline ? 'warning' : 'success'}
            size="sm"
            pulse={!isOffline}
          >
            {isOffline ? 'Offline Mode' : 'System Operational'}
          </StatusBadge>
        </div>

        {user && (
          <div className="bhiv-navbar__user-group">
            <div className="bhiv-navbar__avatar" title={user.name || user.email}>
              {getInitials(user.name || user.email)}
            </div>
            <span className="bhiv-navbar__username" title={user.name || user.email}>
              {user.name || user.email}
            </span>
            <BHIVButton
              variant="ghost"
              size="sm"
              onClick={onLogout}
              aria-label="Logout of NYAI"
            >
              Logout
            </BHIVButton>
          </div>
        )}
      </div>
    </header>
  );
};

BHIVNavbar.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string
  }),
  onLogout: PropTypes.func,
  onNavigateHome: PropTypes.func,
  isOffline: PropTypes.bool,
  onToggleSidebar: PropTypes.func,
  isSidebarOpen: PropTypes.bool,
  onMitraClick: PropTypes.func,
  isMitraOpen: PropTypes.bool
};

export default BHIVNavbar;
