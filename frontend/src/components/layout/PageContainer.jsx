import React from 'react';
import PropTypes from 'prop-types';
import './PageContainer.css';

/**
 * Standard content container for BHIV pages
 * Provides responsive width boundaries and consistent tokenized spacing.
 */
const PageContainer = ({
  children,
  width = 'default',
  className = '',
  style = {},
  ...rest
}) => {
  const classes = [
    'bhiv-page-container',
    width !== 'default' ? `bhiv-page-container--${width}` : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <main className={classes} style={style} {...rest}>
      {children}
    </main>
  );
};

PageContainer.propTypes = {
  children: PropTypes.node,
  width: PropTypes.oneOf(['default', 'narrow', 'full']),
  className: PropTypes.string,
  style: PropTypes.object
};

export default PageContainer;
