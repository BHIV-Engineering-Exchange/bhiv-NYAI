import React from 'react';
import PropTypes from 'prop-types';
import './GlassCard.css';

/**
 * Reusable BHIV GlassCard primitive
 * Operational frosted glass surface compliant with BHIV Design System tokens.
 */
const GlassCard = ({
  children,
  className = '',
  interactive = false,
  padding = 'normal',
  as: Component = 'div',
  onClick,
  style = {},
  ...rest
}) => {
  const isInteractive = interactive || Boolean(onClick);

  const classes = [
    'bhiv-glass-card',
    `bhiv-glass-card--padding-${padding}`,
    isInteractive ? 'bhiv-glass-card--interactive' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  const handleKeyDown = (e) => {
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.(e);
    }
  };

  return (
    <Component
      className={classes}
      onClick={onClick}
      onKeyDown={isInteractive && !rest.tabIndex ? handleKeyDown : undefined}
      tabIndex={isInteractive && rest.tabIndex === undefined ? 0 : rest.tabIndex}
      role={isInteractive && Component === 'div' ? 'button' : undefined}
      style={style}
      {...rest}
    >
      {children}
    </Component>
  );
};

GlassCard.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  interactive: PropTypes.bool,
  padding: PropTypes.oneOf(['none', 'compact', 'normal', 'spacious']),
  as: PropTypes.elementType,
  onClick: PropTypes.func,
  style: PropTypes.object
};

export default GlassCard;
