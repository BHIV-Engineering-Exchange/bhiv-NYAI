import React from 'react';
import PropTypes from 'prop-types';
import './BHIVButton.css';

/**
 * Reusable BHIV Button primitive
 * Supports variants: primary, secondary, ghost, danger
 * Supports states: default, hover, active, disabled, loading
 */
const BHIVButton = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  type = 'button',
  icon,
  className = '',
  onClick,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  const classes = [
    'bhiv-btn',
    `bhiv-btn--${variant}`,
    `bhiv-btn--${size}`,
    fullWidth ? 'bhiv-btn--full-width' : '',
    isDisabled ? 'bhiv-btn--disabled' : '',
    loading ? 'bhiv-btn--loading' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      onClick={isDisabled ? undefined : onClick}
      {...rest}
    >
      {loading ? (
        <svg
          className="bhiv-btn__spinner"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="31.415, 31.415"
            strokeDashoffset="10"
          />
        </svg>
      ) : icon ? (
        <span className="bhiv-btn__icon" aria-hidden="true">{icon}</span>
      ) : null}
      <span className="bhiv-btn__label">{children}</span>
    </button>
  );
};

BHIVButton.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  icon: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func
};

export default BHIVButton;
