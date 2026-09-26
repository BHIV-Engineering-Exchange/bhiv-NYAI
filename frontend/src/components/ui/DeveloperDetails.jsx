import React, { useState, useId } from 'react';
import PropTypes from 'prop-types';
import { Terminal } from 'lucide-react';
import './DeveloperDetails.css';

/**
 * Reusable BHIV DeveloperDetails primitive
 * Collapsible section for developer, pipeline, and trace metadata.
 * Hidden by default to keep the operational interface clean.
 */
const DeveloperDetails = ({
  children,
  title = 'Show Developer / Pipeline Details',
  expandedTitle = 'Hide Developer / Pipeline Details',
  defaultExpanded = false,
  badge,
  className = '',
  ...rest
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentId = useId();
  const summaryId = useId();

  const toggleExpand = () => {
    setIsExpanded(prev => !prev);
  };

  const containerClasses = [
    'bhiv-dev-details',
    isExpanded ? 'bhiv-dev-details--expanded' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  const currentTitle = isExpanded ? expandedTitle : title;

  return (
    <div className={containerClasses} {...rest}>
      <button
        type="button"
        id={summaryId}
        className="bhiv-dev-details__summary"
        onClick={toggleExpand}
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        <div className="bhiv-dev-details__title-group">
          <Terminal size={15} className="bhiv-dev-details__icon" aria-hidden="true" />
          <span className="bhiv-dev-details__title">{currentTitle}</span>
        </div>
        <div className="bhiv-dev-details__meta">
          {badge}
          <svg
            className="bhiv-dev-details__chevron"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div
          id={contentId}
          role="region"
          aria-labelledby={summaryId}
          className="bhiv-dev-details__content"
        >
          {children}
        </div>
      )}
    </div>
  );
};

DeveloperDetails.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  expandedTitle: PropTypes.string,
  defaultExpanded: PropTypes.bool,
  badge: PropTypes.node,
  className: PropTypes.string
};

export default DeveloperDetails;
