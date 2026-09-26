/**
 * EscalationNotice.jsx
 * Rendered when recommendation.type is 'ESCALATE'.
 *
 * Renders: DecisionHeader, CaseContext, ProceduralSteps, DecisionTimeline.
 * Overlays a sticky banner indicating professional consultation is advised.
 */
import React from 'react'
import { Scale, TrendingUp } from 'lucide-react'
import DecisionHeader from './DecisionHeader.jsx'
import CaseContext from './CaseContext.jsx'
import ProceduralSteps from './ProceduralSteps.jsx'
import DecisionTimeline from './DecisionTimeline.jsx'

const EscalationNotice = ({
  traceId,
  recommendation,
  jurisdiction,
  caseSummary,
  legalRoute,
  proceduralSteps,
  timeline
}) => (
  <article style={{
    backgroundColor: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  }}>
    <DecisionHeader
      traceId={traceId}
      recommendation={recommendation}
      jurisdiction={jurisdiction}
    />

    <div style={{
      backgroundColor: '#fff7ed',
      borderBottom: '2px solid #f97316',
      padding: '16px 40px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '14px'
    }}>
      <Scale size={22} color="#c2410c" style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '11px', fontWeight: '700', letterSpacing: '2px',
          textTransform: 'uppercase', color: '#c2410c', marginBottom: '4px'
        }}>
          Escalation Advised — Consult Legal Professional
        </div>
        <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#7c2d12', lineHeight: '1.6' }}>
          {recommendation?.rationale || 'This matter warrants consultation with a qualified legal professional before acting on automated guidance.'}
        </p>
      </div>
      <code style={{
        flexShrink: 0, fontSize: '10px', fontFamily: '"Courier New", monospace',
        color: '#9ca3af', backgroundColor: '#f3f4f6',
        padding: '4px 8px', borderRadius: '4px', alignSelf: 'center'
      }}>
        {traceId}
      </code>
    </div>

    <CaseContext caseSummary={caseSummary} legalRoute={legalRoute} />
    <ProceduralSteps proceduralSteps={proceduralSteps} />
    <DecisionTimeline timeline={timeline} />

    <section style={{
      padding: '32px 40px',
      borderTop: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{
        padding: '28px 32px',
        border: '2px dashed #d1d5db',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <TrendingUp size={28} color="#c2410c" />
        </div>
        <p style={{
          margin: 0, fontSize: '14px', color: '#6b7280',
          fontStyle: 'italic', lineHeight: '1.6'
        }}>
          Automated determination is advisory only for this matter.<br />
          Professional review is recommended before relying on this guidance.
        </p>
      </div>
    </section>
  </article>
)

export default EscalationNotice
