/**
 * DecisionHeader.jsx
 * Fields consumed: trace_id, recommendation, jurisdiction
 */
import React from 'react'
import { Info, Clock, TrendingUp, HelpCircle } from 'lucide-react'

const RECOMMENDATION_CONFIG = {
  INFORM: {
    color: '#1a7f4b', bg: '#d1fae5', border: '#6ee7b7',
    Icon: Info, label: 'Informational Guidance'
  },
  REVIEW: {
    color: '#92400e', bg: '#fef3c7', border: '#fcd34d',
    Icon: Clock, label: 'Review Recommended'
  },
  ESCALATE: {
    color: '#991b1b', bg: '#fee2e2', border: '#fca5a5',
    Icon: TrendingUp, label: 'Escalation Advised'
  },
  INSUFFICIENT_DATA: {
    color: '#4338ca', bg: '#e0e7ff', border: '#a5b4fc',
    Icon: HelpCircle, label: 'Insufficient Data'
  }
}

const DecisionHeader = ({ traceId, recommendation, jurisdiction }) => {
  const recType = recommendation?.type ?? 'REVIEW'
  const cfg = RECOMMENDATION_CONFIG[recType] ?? RECOMMENDATION_CONFIG.REVIEW
  const IconComp = cfg.Icon

  return (
    <header style={{
      borderBottom: `3px solid ${cfg.border}`,
      backgroundColor: cfg.bg,
      padding: '28px 40px 20px'
    }}>
      <div style={{
        fontSize: '11px', fontWeight: '700', letterSpacing: '2px',
        textTransform: 'uppercase', color: '#6b7280', marginBottom: '8px'
      }}>
        Legal Decision Document
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{
            margin: '0 0 10px 0', fontSize: '1.75rem', fontWeight: '700',
            color: '#111827', fontFamily: 'Georgia, "Times New Roman", serif'
          }}>
            {jurisdiction}
          </h1>

          <div
            data-testid="recommendation-type"
            style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', backgroundColor: 'white',
            border: `1.5px solid ${cfg.border}`, borderRadius: '20px',
            fontSize: '13px', fontWeight: '600', color: cfg.color
          }}>
            {IconComp && <IconComp size={15} />}
            <span>{recType}</span>
          </div>

          {recommendation?.rationale && (
            <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: cfg.color, maxWidth: '520px', lineHeight: '1.5' }}>
              {recommendation.rationale}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <span style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Reference ID
          </span>
          <code
            data-testid="trace-id"
            style={{
            fontSize: '11px', fontFamily: '"Courier New", monospace',
            color: '#374151', backgroundColor: 'rgba(0,0,0,0.05)',
            padding: '4px 10px', borderRadius: '4px'
          }}>
            {traceId}
          </code>
        </div>
      </div>

      {recType === 'ESCALATE' && recommendation?.urgency_flag && (
        <div style={{
          marginTop: '16px', padding: '12px 16px',
          backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#991b1b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Urgent Advisory
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#7f1d1d', lineHeight: '1.6' }}>
            Consider consulting a qualified legal professional promptly.
          </p>
        </div>
      )}
    </header>
  )
}

export default DecisionHeader
