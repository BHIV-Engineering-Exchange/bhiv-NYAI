import React from 'react';
import PropTypes from 'prop-types';

/**
 * BHIV Confidence Indicator
 * Displays calibrated confidence level with an accessible bar and percentage.
 */
const ConfidenceIndicator = ({ confidence, label = 'Confidence Level' }) => {
  const percentage = Math.round((confidence || 0) * 100);

  const getColor = () => {
    if (percentage >= 80) return 'var(--bhiv-success, #10b981)';
    if (percentage >= 60) return 'var(--bhiv-warning, #f59e0b)';
    return 'var(--bhiv-error, #ef4444)';
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        alignItems: 'flex-start',
        fontFamily: 'var(--bhiv-font-body)',
        width: '100%'
      }}
      role="meter"
      aria-valuenow={percentage}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label={`${label}: ${percentage}%`}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '220px',
          fontSize: 'var(--bhiv-text-xs, 0.75rem)',
          fontWeight: 'var(--bhiv-weight-medium, 500)',
          color: 'var(--bhiv-text-secondary, #9ca3af)'
        }}
      >
        <span>{label}</span>
        <span style={{ color: 'var(--bhiv-text-primary, #f9fafb)', fontWeight: 'var(--bhiv-weight-semibold, 600)' }}>
          {percentage}%
        </span>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '220px',
          height: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--bhiv-radius-pill, 9999px)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: getColor(),
            borderRadius: 'var(--bhiv-radius-pill, 9999px)',
            transition: 'width var(--bhiv-transition-smooth, 300ms)'
          }}
        />
      </div>
    </div>
  );
};

ConfidenceIndicator.propTypes = {
  confidence: PropTypes.number,
  label: PropTypes.string
};

export default ConfidenceIndicator;