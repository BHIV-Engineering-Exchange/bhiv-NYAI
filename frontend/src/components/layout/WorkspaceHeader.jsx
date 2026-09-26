import React from 'react';
import PropTypes from 'prop-types';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge.jsx';
import BHIVButton from '../ui/BHIVButton.jsx';
import './WorkspaceHeader.css';

/**
 * Enterprise Workspace Header with Contextual Breadcrumbs
 * Standardizes page hierarchy, titles, descriptions, and action slots across NYAI.
 */
const WorkspaceHeader = ({
  breadcrumbs = [],
  title,
  description,
  badge,
  badgeVariant = 'neutral',
  action,
  onBack,
  backLabel = 'Overview',
  className = ''
}) => {
  return (
    <header className={`bhiv-workspace-header ${className}`}>
      {/* Contextual Breadcrumb Trail */}
      <nav className="bhiv-workspace-header__nav" aria-label="Breadcrumb">
        <ol className="bhiv-workspace-header__breadcrumbs" role="list">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <li key={crumb.id || idx} className="bhiv-workspace-header__crumb-item">
                {idx > 0 && (
                  <ChevronRight
                    size={13}
                    className="bhiv-workspace-header__crumb-separator"
                    aria-hidden="true"
                  />
                )}
                {crumb.onClick && !isLast ? (
                  <button
                    type="button"
                    className="bhiv-workspace-header__crumb-link"
                    onClick={crumb.onClick}
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span
                    className={`bhiv-workspace-header__crumb-text ${isLast ? 'bhiv-workspace-header__crumb-text--current' : ''}`}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        {onBack && (
          <BHIVButton
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="bhiv-workspace-header__back-btn"
          >
            <ArrowLeft size={14} style={{ marginRight: '6px' }} />
            {backLabel}
          </BHIVButton>
        )}
      </nav>

      {/* Main Title & Description Strip */}
      <div className="bhiv-workspace-header__main">
        <div className="bhiv-workspace-header__title-group">
          <div className="bhiv-workspace-header__title-row">
            <h1 className="bhiv-workspace-header__title">{title}</h1>
            {badge && (
              <StatusBadge variant={badgeVariant} size="sm">
                {badge}
              </StatusBadge>
            )}
          </div>
          {description && (
            <p className="bhiv-workspace-header__description">{description}</p>
          )}
        </div>

        {action && (
          <div className="bhiv-workspace-header__actions">
            {action}
          </div>
        )}
      </div>
    </header>
  );
};

WorkspaceHeader.propTypes = {
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func,
      id: PropTypes.string
    })
  ),
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  badge: PropTypes.string,
  badgeVariant: PropTypes.string,
  action: PropTypes.node,
  onBack: PropTypes.func,
  backLabel: PropTypes.string,
  className: PropTypes.string
};

export default WorkspaceHeader;
