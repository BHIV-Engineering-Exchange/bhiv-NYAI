import React from 'react'
import { Scale, ArrowRight } from 'lucide-react'
import GlassCard from './ui/GlassCard.jsx'
import BHIVButton from './ui/BHIVButton.jsx'
import StatusBadge from './ui/StatusBadge.jsx'
import DeveloperDetails from './ui/DeveloperDetails.jsx'
import WorkspaceHeader from './layout/WorkspaceHeader.jsx'

const LawAgentView = ({ responseData, onNavigateHome, onNavigateConsult }) => {
  if (!responseData) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <WorkspaceHeader
          breadcrumbs={[
            { label: 'NYAI', onClick: onNavigateHome },
            { label: 'Intelligence' },
            { label: 'Law Agent' }
          ]}
          title="Law Agent Multi-Agent Engine"
          description="Autonomous multi-agent evaluation, statutory verification, and reasoning trace."
          badge="AGENT ENGINE"
          onBack={onNavigateHome}
        />

        <GlassCard variant="primary" style={{ padding: 'var(--space-12) var(--space-8)', textAlign: 'center', marginTop: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
            <Scale size={48} strokeWidth={1.5} style={{ color: 'var(--bhiv-primary-hover, #818cf8)' }} />
          </div>
          <h2 style={{
            fontFamily: 'var(--font-family-heading)',
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--color-text)',
            marginBottom: 'var(--space-2)'
          }}>
            No Legal Analysis Yet
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '540px', margin: '0 auto var(--space-6) auto', lineHeight: '1.6' }}>
            Submit a legal query to generate a structured jurisdictional analysis, multi-agent evaluation, and actionable recommendation.
          </p>
          {onNavigateConsult && (
            <BHIVButton
              variant="primary"
              size="md"
              onClick={onNavigateConsult}
            >
              <span>Start Legal Query</span>
              <ArrowRight size={14} style={{ marginLeft: '6px' }} />
            </BHIVButton>
          )}
        </GlassCard>
      </div>
    )
  }

  const { 
    domain, 
    jurisdiction, 
    jurisdiction_detected,
    confidence, 
    statutes = [], 
    reasoning_trace = {},
    legal_route = [],
    trace_id,
    recommendation = {}
  } = responseData

  const { 
    legal_analysis = '', 
    procedural_steps = [], 
    remedies: _remedies = [],
    timeline = {}
  } = reasoning_trace

  const recType = recommendation.type || 'INFORM'
  const getBadgeVariant = (type) => {
    switch (type) {
      case 'INFORM':
        return 'success'
      case 'REVIEW':
        return 'warning'
      case 'ESCALATE':
        return 'error'
      case 'INSUFFICIENT_DATA':
      default:
        return 'neutral'
    }
  }

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-6)'
    }}>
      <WorkspaceHeader
        breadcrumbs={[
          { label: 'NYAI', onClick: onNavigateHome },
          { label: 'Intelligence' },
          { label: 'Law Agent' }
        ]}
        title="Law Agent Case Evaluation"
        description="Autonomous multi-agent evaluation brief, statutory verification, and reasoning trace."
        badge={jurisdiction || 'SOVEREIGN'}
        badgeVariant="info"
        onBack={onNavigateHome}
      />

      {/* Header Banner */}
      <GlassCard variant="primary" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <div style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--color-primary-light)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Autonomous Legal Agent
            </div>
            <h2 style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--color-text)',
              margin: 'var(--space-1) 0 0 0'
            }}>
              Case Evaluation Brief
            </h2>
          </div>
          <StatusBadge variant={getBadgeVariant(recType)} size="md">
            {recType}
          </StatusBadge>
        </div>
      </GlassCard>

      {/* SECTION 1 - Case Summary */}
      <GlassCard variant="secondary" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: 0
          }}>
            SECTION 1 — Case Summary
          </h3>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Overview</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
          <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Jurisdiction</span>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)', marginTop: '2px' }}>
              {jurisdiction_detected || jurisdiction || 'Unspecified'}
            </div>
          </div>

          <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Domain</span>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)', textTransform: 'capitalize', marginTop: '2px' }}>
              {domain || 'Unspecified'}
            </div>
          </div>

          <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Confidence</span>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)', marginTop: '2px' }}>
              {confidence?.overall ? `${Math.round(confidence.overall * 100)}%` : 'N/A'}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* SECTION 2 - Procedural Steps */}
      <GlassCard variant="secondary" style={{ padding: 'var(--space-6)' }}>
        <div style={{ marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: 0
          }}>
            SECTION 2 — Procedural Steps
          </h3>
        </div>

        {procedural_steps && procedural_steps.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {procedural_steps.map((step, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)'
              }}>
                <span style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-bold)',
                  color: 'var(--color-primary-light)',
                  background: 'var(--color-primary-transparent)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-xs)'
                }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{step}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>Not available</p>
        )}
      </GlassCard>

      {/* SECTION 3 - Timeline */}
      <GlassCard variant="secondary" style={{ padding: 'var(--space-6)' }}>
        <div style={{ marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: 0
          }}>
            SECTION 3 — Timeline Estimation
          </h3>
        </div>

        {timeline && (timeline.min_duration || timeline.max_duration) ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
            padding: 'var(--space-4)',
            background: 'var(--color-surface-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)'
          }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Estimated Duration:</span>
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)' }}>
              {timeline.min_duration || 'N/A'} – {timeline.max_duration || 'N/A'}
            </span>
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>Timeline data not available</p>
        )}
      </GlassCard>

      {/* SECTION 4 - Evidence & Statutes Required */}
      <GlassCard variant="secondary" style={{ padding: 'var(--space-6)' }}>
        <div style={{ marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: 0
          }}>
            SECTION 4 — Evidentiary Basis & Applicable Statutes
          </h3>
        </div>

        {statutes && statutes.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-3)' }}>
            {statutes.map((statute, idx) => (
              <div key={idx} style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)'
              }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-warning)' }}>
                  {statute.section ? `Section ${statute.section} - ${statute.act || ''}` : statute.section_id || 'Statute Reference'}
                </span>
                <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>
                  {statute.title || JSON.stringify(statute)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>Evidence requirements not specified</p>
        )}
      </GlassCard>

      {/* SECTION 5 - Advisory Recommendation */}
      <GlassCard variant="primary" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <span style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            SECTION 5 — Advisory Recommendation
          </span>
          <StatusBadge variant={getBadgeVariant(recType)} size="sm">
            {recType}
          </StatusBadge>
        </div>

        <div style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--color-text)',
          marginBottom: 'var(--space-3)',
          letterSpacing: '0.05em'
        }}>
          {recType}
        </div>

        {legal_analysis && (
          <p style={{
            fontSize: 'var(--text-sm)',
            lineHeight: 'var(--line-height-relaxed)',
            color: 'var(--color-text-secondary)',
            margin: 0,
            whiteSpace: 'pre-wrap'
          }}>
            {legal_analysis}
          </p>
        )}
      </GlassCard>

      {/* Developer Details */}
      <DeveloperDetails title="Law Agent Pipeline Details" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {trace_id && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Trace ID:</span>
              <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>{trace_id}</span>
            </div>
          )}
          {legal_route && legal_route.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Execution Route:</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-light)' }}>{legal_route.join(' → ')}</span>
            </div>
          )}
        </div>
      </DeveloperDetails>
    </div>
  )
}

export default LawAgentView
