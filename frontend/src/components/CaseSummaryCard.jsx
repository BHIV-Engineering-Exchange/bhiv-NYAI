import React from 'react';
import PropTypes from 'prop-types';
import GlassCard from './ui/GlassCard.jsx';
import StatusBadge from './ui/StatusBadge.jsx';
import ConfidenceIndicator from './ConfidenceIndicator.jsx';
import DeveloperDetails from './ui/DeveloperDetails.jsx';
import SkeletonLoader from './SkeletonLoader.jsx';
import ApiErrorState from './ApiErrorState.jsx';

/**
 * BHIV Case Summary Card
 * Presents structured legal issue, jurisdiction context, facts, and analysis.
 */
const CaseSummaryCard = ({
  caseId,
  title,
  overview,
  keyFacts = [],
  jurisdiction,
  confidence,
  summaryAnalysis,
  dateFiled,
  status,
  parties,
  traceId,
  loading,
  error,
  onRetry
}) => {
  if (loading) return <SkeletonLoader type="card" count={4} />;

  if (error || !title || !overview || !jurisdiction || confidence == null || !summaryAnalysis) {
    return (
      <ApiErrorState
        title="Case Summary Unavailable"
        message={error || 'The backend returned an incomplete case summary response.'}
        traceId={traceId}
        onRetry={onRetry}
      />
    );
  }

  return (
    <GlassCard padding="spacious" style={{ marginBottom: '24px' }}>
      {/* Header with Title and Jurisdiction */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
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
            marginBottom: '6px'
          }}>
            Case Summary {caseId ? `· ${caseId}` : ''}
          </div>
          <h2 style={{
            fontFamily: 'var(--bhiv-font-heading)',
            fontSize: 'var(--bhiv-text-xl, 1.25rem)',
            fontWeight: 'var(--bhiv-weight-bold, 700)',
            color: 'var(--bhiv-text-primary, #f9fafb)',
            margin: 0
          }}>
            {title}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge variant="info" size="md">
            {jurisdiction}
          </StatusBadge>
          {status && (
            <StatusBadge variant="neutral" size="md">
              {status}
            </StatusBadge>
          )}
        </div>
      </div>

      {/* Case Overview */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontFamily: 'var(--bhiv-font-body)',
          fontSize: 'var(--bhiv-text-xs, 0.75rem)',
          fontWeight: 'var(--bhiv-weight-semibold, 600)',
          color: 'var(--bhiv-text-secondary, #9ca3af)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '8px'
        }}>
          Case Overview
        </div>
        <p style={{
          fontFamily: 'var(--bhiv-font-body)',
          fontSize: 'var(--bhiv-text-sm, 0.875rem)',
          lineHeight: 'var(--bhiv-leading-relaxed, 1.625)',
          color: 'var(--bhiv-text-primary, #f9fafb)',
          margin: 0
        }}>
          {overview}
        </p>
      </div>

      {/* Key Facts */}
      {keyFacts && keyFacts.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontFamily: 'var(--bhiv-font-body)',
            fontSize: 'var(--bhiv-text-xs, 0.75rem)',
            fontWeight: 'var(--bhiv-weight-semibold, 600)',
            color: 'var(--bhiv-text-secondary, #9ca3af)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '8px'
          }}>
            Key Facts
          </div>
          <ul style={{
            margin: 0,
            paddingLeft: '20px',
            fontFamily: 'var(--bhiv-font-body)',
            fontSize: 'var(--bhiv-text-sm, 0.875rem)',
            lineHeight: 'var(--bhiv-leading-relaxed, 1.625)',
            color: 'var(--bhiv-text-secondary, #9ca3af)'
          }}>
            {keyFacts.map((fact, index) => (
              <li key={index} style={{ marginBottom: '6px' }}>
                <span style={{ color: 'var(--bhiv-text-primary, #f9fafb)' }}>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Legal Analysis */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontFamily: 'var(--bhiv-font-body)',
          fontSize: 'var(--bhiv-text-xs, 0.75rem)',
          fontWeight: 'var(--bhiv-weight-semibold, 600)',
          color: 'var(--bhiv-text-secondary, #9ca3af)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '8px'
        }}>
          Legal Analysis
        </div>
        <div style={{
          padding: '16px',
          background: 'rgba(0, 0, 0, 0.25)',
          borderRadius: 'var(--bhiv-radius-md, 12px)',
          border: '1px solid var(--bhiv-border-subtle, rgba(255, 255, 255, 0.06))'
        }}>
          <p style={{
            fontFamily: 'var(--bhiv-font-body)',
            fontSize: 'var(--bhiv-text-sm, 0.875rem)',
            lineHeight: 'var(--bhiv-leading-relaxed, 1.625)',
            color: 'var(--bhiv-text-primary, #f9fafb)',
            margin: 0
          }}>
            <em>Based on available evidence: </em>{summaryAnalysis}
          </p>
        </div>
      </div>

      {/* Jurisdiction & Confidence Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        paddingTop: '16px',
        borderTop: '1px solid var(--bhiv-border-subtle, rgba(255, 255, 255, 0.06))'
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--bhiv-font-body)',
            fontSize: 'var(--bhiv-text-xs, 0.75rem)',
            color: 'var(--bhiv-text-muted, #6b7280)',
            marginBottom: '4px'
          }}>
            Jurisdiction Region
          </div>
          <div style={{
            fontFamily: 'var(--bhiv-font-body)',
            fontSize: 'var(--bhiv-text-sm, 0.875rem)',
            fontWeight: 'var(--bhiv-weight-semibold, 600)',
            color: 'var(--bhiv-text-primary, #f9fafb)'
          }}>
            {jurisdiction}
          </div>
        </div>

        {typeof confidence === 'number' && (
          <div>
            <ConfidenceIndicator confidence={confidence} label="Analysis Confidence" />
          </div>
        )}
      </div>

      {/* Optional Metadata */}
      {(dateFiled || parties || traceId) && (
        <DeveloperDetails
          title="Show Case Metadata & Filing Details"
          expandedTitle="Hide Case Metadata & Filing Details"
        >
          <div style={{ display: 'grid', gap: '8px', fontSize: 'var(--bhiv-text-xs, 0.75rem)' }}>
            {traceId && <div><strong>Trace ID:</strong> {traceId}</div>}
            {dateFiled && <div><strong>Date Filed:</strong> {dateFiled}</div>}
            {parties && (
              <div>
                <strong>Parties:</strong>
                {parties.plaintiff && <div>Plaintiff: {parties.plaintiff}</div>}
                {parties.defendant && <div>Defendant: {parties.defendant}</div>}
              </div>
            )}
          </div>
        </DeveloperDetails>
      )}
    </GlassCard>
  );
};

CaseSummaryCard.propTypes = {
  caseId: PropTypes.string,
  title: PropTypes.string,
  overview: PropTypes.string,
  keyFacts: PropTypes.array,
  jurisdiction: PropTypes.string,
  confidence: PropTypes.number,
  summaryAnalysis: PropTypes.string,
  dateFiled: PropTypes.string,
  status: PropTypes.string,
  parties: PropTypes.object,
  traceId: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func
};

export default CaseSummaryCard;