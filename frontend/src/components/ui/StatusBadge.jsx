import React from 'react';
import PropTypes from 'prop-types';
import './StatusBadge.css';

/**
 * Reusable BHIV StatusBadge primitive
 * Supports variants: success, warning, error, info, neutral
 * Accessibility: includes textual labels and semantic indicators, doesn't rely solely on color.
 */
const StatusBadge = ({
  children,
  variant = 'neutral',
  size = 'md',
  showDot = true,
  pulse = false,
  icon,
  className = '',
  ...rest
}) => {
  const classes = [
    'bhiv-status-badge',
    `bhiv-status-badge--${variant}`,
    `bhiv-status-badge--${size}`,
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} role="status" {...rest}>
      {icon ? (
        <span className="bhiv-status-badge__icon" aria-hidden="true">{icon}</span>
      ) : showDot ? (
        <span
          className={`bhiv-status-badge__dot ${pulse ? 'bhiv-status-badge__dot--pulse' : ''}`}
          aria-hidden="true"
        />
      ) : null}
      <span className="bhiv-status-badge__label">{children}</span>
    </span>
  );
};

StatusBadge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['success', 'warning', 'error', 'info', 'neutral']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showDot: PropTypes.bool,
  pulse: PropTypes.bool,
  icon: PropTypes.node,
  className: PropTypes.string
};

export default StatusBadge;
