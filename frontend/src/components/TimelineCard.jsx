import React from 'react';
import PropTypes from 'prop-types';
import GlassCard from './ui/GlassCard.jsx';
import StatusBadge from './ui/StatusBadge.jsx';
import SkeletonLoader from './SkeletonLoader.jsx';
import ApiErrorState from './ApiErrorState.jsx';

/**
 * BHIV Timeline Card
 * Clean vertical procedural timeline with status badges and accessible semantics.
 */
const TimelineCard = ({
  events,
  jurisdiction,
  caseId,
  traceId,
  loading,
  error,
  onRetry
}) => {
  if (loading) return <SkeletonLoader type="card" count={4} />;

  if (error || !events || !Array.isArray(events) || events.length === 0 || !jurisdiction) {
    return (
      <ApiErrorState
        title="Timeline Unavailable"
        message={error || 'The backend returned an incomplete timeline response.'}
        traceId={traceId}
        onRetry={onRetry}
      />
    );
  }

  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
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
        marginBottom: '24px',
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
            Case Timeline {caseId ? `· ${caseId}` : ''}
          </div>
          <h2 style={{
            fontFamily: 'var(--bhiv-font-heading)',
            fontSize: 'var(--bhiv-text-xl, 1.25rem)',
            fontWeight: 'var(--bhiv-weight-bold, 700)',
            color: 'var(--bhiv-text-primary, #f9fafb)',
            margin: 0
          }}>
            Procedural Milestones
          </h2>
        </div>

        <StatusBadge variant="info" size="md">
          {jurisdiction}
        </StatusBadge>
      </div>

      {/* Vertical Timeline */}
      <div style={{
        position: 'relative',
        paddingLeft: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Timeline Connecting Line */}
        <div style={{
          position: 'absolute',
          left: '11px',
          top: '16px',
          bottom: '16px',
          width: '2px',
          backgroundColor: 'var(--bhiv-border, rgba(255, 255, 255, 0.12))'
        }} aria-hidden="true" />

        {sortedEvents.map((event, index) => {
          const statusVariant = getStatusVariant(event.status);

          return (
            <div
              key={event.id || index}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {/* Timeline Bullet Node */}
              <div
                style={{
                  position: 'absolute',
                  left: '-32px',
                  top: '2px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bhiv-surface, #111827)',
                  border: '2px solid var(--bhiv-primary, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'var(--bhiv-primary-hover, #818cf8)',
                  zIndex: 1
                }}
                aria-hidden="true"
              >
                {index + 1}
              </div>

              {/* Event Content Container */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--bhiv-border-subtle, rgba(255, 255, 255, 0.06))',
                  borderRadius: 'var(--bhiv-radius-md, 12px)',
                  padding: '16px'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <div>
                    <h3 style={{
                      fontFamily: 'var(--bhiv-font-heading)',
                      fontSize: 'var(--bhiv-text-md, 1rem)',
                      fontWeight: 'var(--bhiv-weight-semibold, 600)',
                      color: 'var(--bhiv-text-primary, #f9fafb)',
                      margin: '0 0 4px 0'
                    }}>
                      {event.title}
                    </h3>
                    <div style={{
                      fontFamily: 'var(--bhiv-font-body)',
                      fontSize: 'var(--bhiv-text-xs, 0.75rem)',
                      color: 'var(--bhiv-text-muted, #6b7280)'
                    }}>
                      {formatDate(event.date)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {event.type && (
                      <StatusBadge variant="neutral" size="sm">
                        {event.type}
                      </StatusBadge>
                    )}
                    {event.status && (
                      <StatusBadge variant={statusVariant} size="sm">
                        {event.status}
                      </StatusBadge>
                    )}
                  </div>
                </div>

                <p style={{
                  fontFamily: 'var(--bhiv-font-body)',
                  fontSize: 'var(--bhiv-text-sm, 0.875rem)',
                  lineHeight: 'var(--bhiv-leading-normal, 1.5)',
                  color: 'var(--bhiv-text-secondary, #9ca3af)',
                  margin: 0
                }}>
                  {event.description}
                </p>

                {(event.documents && event.documents.length > 0) && (
                  <div style={{
                    marginTop: '10px',
                    fontSize: 'var(--bhiv-text-xs, 0.75rem)',
                    color: 'var(--bhiv-text-muted, #6b7280)'
                  }}>
                    <strong>Documents: </strong>
                    <span style={{ color: 'var(--bhiv-text-secondary, #9ca3af)' }}>
                      {event.documents.join(', ')}
                    </span>
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

TimelineCard.propTypes = {
  events: PropTypes.array,
  jurisdiction: PropTypes.string,
  caseId: PropTypes.string,
  traceId: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func
};

export default TimelineCard;