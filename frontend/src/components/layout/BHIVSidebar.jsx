import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  LayoutDashboard,
  MessageSquare,
  Scale,
  FileText,
  Bot,
  Clock3,
  Globe2,
  BookOpen,
  Library,
  Shield,
  Pin,
  PinOff
} from 'lucide-react';
import StatusBadge from '../ui/StatusBadge.jsx';
import './BHIVSidebar.css';

/**
 * BHIV Enterprise Collapsible Navigation Rail
 * Features:
 * - Desktop compact rail (68px) with hover & focus expansion to 268px
 * - Pin/Unpin toggle for persistent expanded workspace mode
 * - Mobile full-height slide-over drawer with backdrop and Escape dismissal
 * - Smooth tokenized transitions and Lucide vector iconography
 */
const BHIVSidebar = ({
  activeView = 'dashboard',
  onSelectView,
  isOpen = false,
  onClose,
  onMitraClick
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPinned, setIsPinned] = useState(() => {
    try {
      return localStorage.getItem('bhiv_sidebar_pinned') === 'true';
    } catch {
      return false;
    }
  });

  const sidebarRef = useRef(null);

  const primaryNavItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'consult', label: 'Ask Legal', icon: MessageSquare },
    { id: 'decision', label: 'Decisions', icon: Scale },
    { id: 'decision-draft', label: 'Decision Draft', icon: FileText },
    { id: 'law-agent', label: 'Law Agent', icon: Bot },
    { id: 'timeline', label: 'Case Timeline', icon: Clock3 },
    { id: 'procedure', label: 'Jurisdiction', icon: Globe2 },
    { id: 'glossary', label: 'Legal Glossary', icon: BookOpen },
    { id: 'docs', label: 'Documentation', icon: Library }
  ];

  // Toggle Pin state
  const handleTogglePin = () => {
    setIsPinned(prev => {
      const next = !prev;
      try {
        localStorage.setItem('bhiv_sidebar_pinned', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Close sidebar on Escape key when open on mobile
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleNavClick = (viewId) => {
    onSelectView(viewId);
    if (onClose) {
      onClose();
    }
  };

  const isExpanded = isPinned || isHovered || isFocused || isOpen;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`bhiv-sidebar-backdrop ${isOpen ? 'bhiv-sidebar-backdrop--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        ref={sidebarRef}
        className={[
          'bhiv-sidebar',
          isExpanded ? 'bhiv-sidebar--expanded' : 'bhiv-sidebar--collapsed',
          isPinned ? 'bhiv-sidebar--pinned' : '',
          isOpen ? 'bhiv-sidebar--open' : ''
        ].filter(Boolean).join(' ')}
        aria-label="Application Navigation"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocusCapture={() => setIsFocused(true)}
        onBlurCapture={(e) => {
          if (!sidebarRef.current?.contains(e.relatedTarget)) {
            setIsFocused(false);
          }
        }}
      >
        <div className="bhiv-sidebar__content">
          {/* Primary Navigation Section */}
          <div className="bhiv-sidebar__section">
            <div className="bhiv-sidebar__section-title">
              {isExpanded ? 'Legal Operations' : 'Ops'}
            </div>
            <ul className="bhiv-sidebar__nav-list" role="list">
              {primaryNavItems.map((item) => {
                const isActive = activeView === item.id;
                const IconComponent = item.icon;
                return (
                  <li key={item.id} className="bhiv-sidebar__nav-item">
                    <button
                      type="button"
                      className={`bhiv-sidebar__nav-btn ${isActive ? 'bhiv-sidebar__nav-btn--active' : ''}`}
                      onClick={() => handleNavClick(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      title={!isExpanded ? item.label : undefined}
                    >
                      <span className="bhiv-sidebar__nav-icon" aria-hidden="true">
                        <IconComponent size={18} strokeWidth={1.75} />
                      </span>
                      <span className="bhiv-sidebar__nav-label">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* BHIV Ecosystem Section */}
          <div className="bhiv-sidebar__section">
            <div className="bhiv-sidebar__section-title">
              {isExpanded ? 'BHIV Ecosystem' : 'Eco'}
            </div>

            {/* Active Product: NYAI */}
            <div
              className="bhiv-sidebar__ecosystem-item bhiv-sidebar__ecosystem-item--active"
              role="button"
              tabIndex={0}
              onClick={() => handleNavClick('dashboard')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleNavClick('dashboard');
                }
              }}
              title={!isExpanded ? 'NYAI Legal Intelligence OS' : undefined}
            >
              <div className="bhiv-sidebar__ecosystem-info">
                <div className="bhiv-sidebar__ecosystem-name">
                  <span className="bhiv-sidebar__nav-icon" aria-hidden="true">
                    <Scale size={16} strokeWidth={1.75} />
                  </span>
                  <span className="bhiv-sidebar__ecosystem-text">NYAI</span>
                </div>
                <div className="bhiv-sidebar__ecosystem-desc">Legal Intelligence OS</div>
              </div>
              <div className="bhiv-sidebar__badge">
                <StatusBadge variant="info" size="sm">
                  ACTIVE
                </StatusBadge>
              </div>
            </div>

            {/* Partner/Companion Product: MITRA */}
            <div
              className="bhiv-sidebar__ecosystem-item"
              role="button"
              tabIndex={0}
              onClick={onMitraClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onMitraClick?.();
                }
              }}
              title={!isExpanded ? 'MITRA Platform Companion' : 'MITRA Platform Companion - Ecosystem Integration'}
            >
              <div className="bhiv-sidebar__ecosystem-info">
                <div className="bhiv-sidebar__ecosystem-name">
                  <span className="bhiv-sidebar__nav-icon" aria-hidden="true">
                    <Shield size={16} strokeWidth={1.75} />
                  </span>
                  <span className="bhiv-sidebar__ecosystem-text">MITRA</span>
                </div>
                <div className="bhiv-sidebar__ecosystem-desc">BHIV Companion</div>
              </div>
              <div className="bhiv-sidebar__badge">
                <StatusBadge variant="info" size="sm">
                  COMPANION
                </StatusBadge>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Pin/Unpin Toggle */}
        <div className="bhiv-sidebar__footer">
          <button
            type="button"
            className="bhiv-sidebar__pin-btn"
            onClick={handleTogglePin}
            aria-label={isPinned ? 'Unpin navigation rail' : 'Pin navigation rail expanded'}
            title={isPinned ? 'Unpin navigation rail (auto-collapse)' : 'Pin navigation rail (stay expanded)'}
          >
            {isPinned ? (
              <>
                <PinOff size={15} aria-hidden="true" />
                <span className="bhiv-sidebar__pin-label">Unpin Rail</span>
              </>
            ) : (
              <>
                <Pin size={15} aria-hidden="true" />
                <span className="bhiv-sidebar__pin-label">Pin Rail</span>
              </>
            )}
          </button>
          <div className="bhiv-sidebar__version">
            {isExpanded ? 'BHIV NYAI v1.0.0 · Unified Platform' : 'v1.0'}
          </div>
        </div>
      </aside>
    </>
  );
};

BHIVSidebar.propTypes = {
  activeView: PropTypes.string,
  onSelectView: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  onMitraClick: PropTypes.func
};

export default BHIVSidebar;
