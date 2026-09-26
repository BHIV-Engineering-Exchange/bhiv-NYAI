import React from 'react';
import PropTypes from 'prop-types';
import GlassCard from './ui/GlassCard.jsx';
import StatusBadge from './ui/StatusBadge.jsx';
import ConfidenceIndicator from './ConfidenceIndicator.jsx';
import SkeletonLoader from './SkeletonLoader.jsx';
import ApiErrorState from './ApiErrorState.jsx';

/**
 * BHIV Legal Route Card
 * Presents procedural pathways and strategic legal routes in clear sequential order.
 */
const LegalRouteCard = ({
  routes,
  jurisdiction,
  caseType,
  traceId,
  loading,
  error,
  onRetry
}) => {
  if (loading) return <SkeletonLoader type="card" count={3} />;

  if (error || !routes || !Array.isArray(routes) || routes.length === 0 || !jurisdiction) {
    return (
      <ApiErrorState
        title="Legal Routes Unavailable"
        message={error || 'The backend returned an incomplete legal routes response.'}
        traceId={traceId}
        onRetry={onRetry}
      />
    );
  }

  const getSuitabilityVariant = (score) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'neutral';
  };

  return (
    <GlassCard padding="spacious" style={{ marginBottom: '24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--bhiv-border-subtle, rgba(255, 255, 255, 0.08))'
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--bhiv-font-body)',
            fontSize: 'var(--bhiv-text-xs, 0.75rem)',
            fontWeight: 'var(--bhiv-weight-semibold, 600)',
            color: 'var(--bhiv-primary-hover, #818cf8)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '4px'
          }}>
            Procedural Pathways {caseType ? `· ${caseType}` : ''}
          </div>
          <h2 style={{
            fontFamily: 'var(--bhiv-font-heading)',
            fontSize: 'var(--bhiv-text-xl, 1.25rem)',
            fontWeight: 'var(--bhiv-weight-bold, 700)',
            color: 'var(--bhiv-text-primary, #f9fafb)',
            margin: 0
          }}>
            Available Legal Routes
          </h2>
        </div>

        <StatusBadge variant="info" size="md">
          {jurisdiction}
        </StatusBadge>
      </div>

      {/* Routes List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {routes.map((route, index) => {
          const stepNum = String(index + 1).padStart(2, '0');
          const variant = getSuitabilityVariant(route.suitability);

          return (
            <div
              key={index}
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--bhiv-border-subtle, rgba(255, 255, 255, 0.06))',
                borderRadius: 'var(--bhiv-radius-md, 12px)',
                padding: '20px',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start'
              }}
            >
              {/* Sequential Number */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--bhiv-radius-sm, 8px)',
                  background: 'var(--bhiv-primary-muted, rgba(99, 102, 241, 0.15))',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: 'var(--bhiv-primary-hover, #818cf8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--bhiv-font-mono, monospace)',
                  fontSize: 'var(--bhiv-text-sm, 0.875rem)',
                  fontWeight: 'var(--bhiv-weight-bold, 700)',
                  flexShrink: 0
                }}
              >
                {stepNum}
              </div>

              {/* Route Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <h3 style={{
                    fontFamily: 'var(--bhiv-font-heading)',
                    fontSize: 'var(--bhiv-text-md, 1rem)',
                    fontWeight: 'var(--bhiv-weight-semibold, 600)',
                    color: 'var(--bhiv-text-primary, #f9fafb)',
                    margin: 0
                  }}>
                    {route.name}
                  </h3>

                  {typeof route.suitability === 'number' && (
                    <StatusBadge variant={variant} size="sm">
                      Suitability: {Math.round(route.suitability * 100)}%
                    </StatusBadge>
                  )}
                </div>

                <p style={{
                  fontFamily: 'var(--bhiv-font-body)',
                  fontSize: 'var(--bhiv-text-sm, 0.875rem)',
                  lineHeight: 'var(--bhiv-leading-relaxed, 1.625)',
                  color: 'var(--bhiv-text-secondary, #9ca3af)',
                  margin: '0 0 12px 0'
                }}>
                  {route.description}
                </p>

                {route.recommendation && (
                  <div style={{
                    padding: '10px 12px',
                    background: 'rgba(99, 102, 241, 0.08)',
                    borderRadius: 'var(--bhiv-radius-sm, 8px)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    fontSize: 'var(--bhiv-text-xs, 0.75rem)',
                    color: 'var(--bhiv-text-primary, #f9fafb)',
                    marginBottom: '12px'
                  }}>
                    <strong>Recommendation: </strong>
                    <span>{route.recommendation}</span>
                  </div>
                )}

                {/* Duration & Cost */}
                {(route.estimatedDuration || route.estimatedCost) && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    fontSize: 'var(--bhiv-text-xs, 0.75rem)',
                    color: 'var(--bhiv-text-muted, #6b7280)',
                    marginBottom: '12px'
                  }}>
                    {route.estimatedDuration && (
                      <div>
                        <span>Est. Duration: </span>
                        <strong style={{ color: 'var(--bhiv-text-primary, #f9fafb)' }}>{route.estimatedDuration}</strong>
                      </div>
                    )}
                    {route.estimatedCost && (
                      <div>
                        <span>Est. Cost: </span>
                        <strong style={{ color: 'var(--bhiv-text-primary, #f9fafb)' }}>{route.estimatedCost}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Pros & Cons */}
                {(route.pros || route.cons) && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: route.pros && route.cons ? 'repeat(auto-fit, minmax(200px, 1fr))' : '1fr',
                    gap: '12px',
                    fontSize: 'var(--bhiv-text-xs, 0.75rem)'
                  }}>
                    {route.pros && route.pros.length > 0 && (
                      <div style={{ color: 'var(--bhiv-success, #10b981)' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>Advantages:</div>
                        <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--bhiv-text-secondary, #9ca3af)' }}>
                          {route.pros.map((pro, pIdx) => (
                            <li key={pIdx}>{pro}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {route.cons && route.cons.length > 0 && (
                      <div style={{ color: 'var(--bhiv-warning, #f59e0b)' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>Considerations:</div>
                        <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--bhiv-text-secondary, #9ca3af)' }}>
                          {route.cons.map((con, cIdx) => (
                            <li key={cIdx}>{con}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};

LegalRouteCard.propTypes = {
  routes: PropTypes.array,
  jurisdiction: PropTypes.string,
  caseType: PropTypes.string,
  traceId: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func
};

export default LegalRouteCard;