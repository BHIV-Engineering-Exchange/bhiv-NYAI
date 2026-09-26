import React from 'react';
import PropTypes from 'prop-types';
import GlassCard from './ui/GlassCard.jsx';
import StatusBadge from './ui/StatusBadge.jsx';
import ConfidenceIndicator from './ConfidenceIndicator.jsx';

/**
 * BHIV Recommendation Status Card
 * Communicates advisory recommendation state with exact backend semantics.
 * Semantic mapping:
 * INFORM -> info
 * REVIEW -> warning
 * ESCALATE -> error
 * INSUFFICIENT_DATA -> neutral
 */
const RecommendationStatusCard = ({ recommendation, traceId }) => {
  if (!recommendation || !recommendation.type) {
    return null;
  }

  const { type, rationale, confidence } = recommendation;

  const getSemanticVariant = (recType) => {
    switch (recType) {
      case 'ESCALATE':
        return 'error';
      case 'REVIEW':
        return 'warning';
      case 'INFORM':
        return 'info';
      case 'INSUFFICIENT_DATA':
      default:
        return 'neutral';
    }
  };

  const getSeverityLabel = (recType) => {
    switch (recType) {
      case 'ESCALATE':
        return 'Escalation Advised';
      case 'REVIEW':
        return 'Review Recommended';
      case 'INFORM':
        return 'Informational Advisory';
      case 'INSUFFICIENT_DATA':
      default:
        return 'Insufficient Data';
    }
  };

  const variant = getSemanticVariant(type);

  return (
    <GlassCard
      padding="normal"
      style={{
        marginBottom: '20px',
        borderLeft: `4px solid var(--bhiv-${variant}, #6366f1)`
      }}
      data-testid="recommendation-status"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--bhiv-border-subtle, rgba(255, 255, 255, 0.06))'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <StatusBadge variant={variant} size="md" pulse={variant === 'warning' || variant === 'error'}>
            <span data-testid="recommendation-type">{type}</span>
          </StatusBadge>
          <span style={{
            fontFamily: 'var(--bhiv-font-heading)',
            fontSize: 'var(--bhiv-text-md, 1rem)',
            fontWeight: 'var(--bhiv-weight-semibold, 600)',
            color: 'var(--bhiv-text-primary, #f9fafb)'
          }}>
            {getSeverityLabel(type)}
          </span>
        </div>

        <span style={{
          fontFamily: 'var(--bhiv-font-body)',
          fontSize: 'var(--bhiv-text-xs, 0.75rem)',
          color: 'var(--bhiv-text-muted, #6b7280)'
        }}>
          Advisory Recommendation · Non-binding
        </span>
      </div>

      {rationale && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontFamily: 'var(--bhiv-font-body)',
            fontSize: 'var(--bhiv-text-xs, 0.75rem)',
            fontWeight: 'var(--bhiv-weight-semibold, 600)',
            color: 'var(--bhiv-text-secondary, #9ca3af)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '6px'
          }}>
            Rationale
          </div>
          <p style={{
            fontFamily: 'var(--bhiv-font-body)',
            fontSize: 'var(--bhiv-text-sm, 0.875rem)',
            lineHeight: 'var(--bhiv-leading-relaxed, 1.625)',
            color: 'var(--bhiv-text-primary, #f9fafb)',
            margin: 0
          }}>
            {rationale}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        {typeof confidence === 'number' && (
          <div style={{ minWidth: '180px' }}>
            <ConfidenceIndicator confidence={confidence} label="Recommendation Confidence" />
          </div>
        )}

        {traceId && (
          <div style={{
            fontFamily: 'var(--bhiv-font-mono, monospace)',
            fontSize: 'var(--bhiv-text-xs, 0.75rem)',
            color: 'var(--bhiv-text-muted, #6b7280)',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '4px 10px',
            borderRadius: 'var(--bhiv-radius-sm, 8px)',
            border: '1px solid var(--bhiv-border-subtle, rgba(255, 255, 255, 0.06))'
          }}>
            <span>Trace: </span>
            <span style={{ color: 'var(--bhiv-text-secondary, #9ca3af)' }}>{traceId}</span>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

RecommendationStatusCard.propTypes = {
  recommendation: PropTypes.shape({
    type: PropTypes.string,
    rationale: PropTypes.string,
    confidence: PropTypes.number
  }),
  traceId: PropTypes.string
};

export default RecommendationStatusCard;
