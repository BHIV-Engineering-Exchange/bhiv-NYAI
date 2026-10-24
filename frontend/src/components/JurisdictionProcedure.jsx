import React, { useState, useEffect } from 'react'
import { Globe, Clock, Landmark, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { procedureService } from '../services/nyayaApi.js'
import GlassCard from './ui/GlassCard.jsx'
import BHIVButton from './ui/BHIVButton.jsx'
import StatusBadge from './ui/StatusBadge.jsx'
import WorkspaceHeader from './layout/WorkspaceHeader.jsx'

const JurisdictionProcedure = ({ onBack, onNavigateHome }) => {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('India')
  const [selectedDomain, setSelectedDomain] = useState('civil')
  const [procedures, setProcedures] = useState(null)
  const [loading, setLoading] = useState(false)

  const jurisdictionMap = {
    'India': 'IN',
    'UK': 'UK',
    'UAE': 'UAE'
  }

  const domains = ['civil', 'criminal', 'family', 'constitutional']

  useEffect(() => {
    fetchProcedures()
  }, [selectedJurisdiction, selectedDomain])

  const fetchProcedures = async () => {
    setLoading(true)
    const country = jurisdictionMap[selectedJurisdiction]
    const result = await procedureService.getProcedureSummary(country, selectedDomain)
    
    if (result.success && result.data) {
      setProcedures(result.data)
    } else {
      setProcedures(null)
    }
    setLoading(false)
  }

  const handleHomeClick = onNavigateHome || onBack

  // Extract steps from any schema structure
  const stepsList = procedures?.key_steps || procedures?.steps || (Array.isArray(procedures) ? procedures : [])
  const authorities = procedures?.authorities || []
  const timelines = procedures?.timelines || null

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Contextual Workspace Header */}
      <WorkspaceHeader
        breadcrumbs={[
          { label: 'NYAI', onClick: handleHomeClick },
          { label: 'Procedural' },
          { label: 'Jurisdiction' }
        ]}
        title="Jurisdiction Procedure Navigator"
        description="Canonical procedural pathways, statutory timelines, and court hierarchy requirements across jurisdictions."
        badge={selectedJurisdiction.toUpperCase()}
        badgeVariant="info"
        onBack={handleHomeClick}
      />

      {/* Control Card */}
      <GlassCard variant="primary" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Jurisdiction Selector */}
          <div>
            <span style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
              Select Jurisdiction
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {['India', 'UK', 'UAE'].map(jur => (
                <BHIVButton
                  key={jur}
                  variant={selectedJurisdiction === jur ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedJurisdiction(jur)}
                >
                  <Globe size={14} style={{ marginRight: '6px' }} />
                  {jur}
                </BHIVButton>
              ))}
            </div>
          </div>

          {/* Domain Selector */}
          <div>
            <span style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
              Legal Domain
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {domains.map(dom => (
                <BHIVButton
                  key={dom}
                  variant={selectedDomain === dom ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedDomain(dom)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {dom}
                </BHIVButton>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Content Display */}
      {loading ? (
        <GlassCard variant="secondary" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
          <div style={{
            width: '36px',
            height: '36px',
            border: '3px solid var(--color-surface-muted)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto var(--space-4)'
          }} />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
            Querying sovereign procedure rules for {selectedJurisdiction} ({selectedDomain})...
          </p>
        </GlassCard>
      ) : procedures ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          
          {/* Header Card */}
          <GlassCard variant="secondary" style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <h3 style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--color-text)',
                  margin: 0
                }}>
                  {selectedJurisdiction} — {selectedDomain.toUpperCase()} Procedural Code
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  Total Steps: {procedures.total_steps || stepsList.length} • Verified Canonical Taxonomy
                </span>
              </div>
              <StatusBadge variant="info" size="sm">
                VERIFIED JURISDICTION
              </StatusBadge>
            </div>

            {/* Timelines and Authorities Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              {timelines && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-primary-light)', marginBottom: 'var(--space-2)' }}>
                    <Clock size={14} /> EXPECTED TIMELINES
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: 'var(--text-xs)' }}>
                    <div><span style={{ color: 'var(--color-text-muted)' }}>Best Case:</span> <strong style={{ color: '#34d399' }}>{timelines.best_case || 'N/A'}</strong></div>
                    <div><span style={{ color: 'var(--color-text-muted)' }}>Average:</span> <strong style={{ color: '#fbbf24' }}>{timelines.average || 'N/A'}</strong></div>
                    <div><span style={{ color: 'var(--color-text-muted)' }}>Worst Case:</span> <strong style={{ color: '#f87171' }}>{timelines.worst_case || 'N/A'}</strong></div>
                  </div>
                </div>
              )}

              {authorities.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-primary-light)', marginBottom: 'var(--space-2)' }}>
                    <Landmark size={14} /> COMPETENT AUTHORITIES
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {authorities.map((auth, idx) => (
                      <span key={idx} style={{ fontSize: '11px', padding: '3px 8px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '4px', color: '#e0e7ff' }}>
                        {auth}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Procedural Roadmap Steps */}
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-text)', margin: 'var(--space-4) 0 var(--space-3) 0' }}>
              Procedural Stages & Court Roadmap
            </h4>

            {stepsList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {stepsList.map((step, idx) => {
                  const stepNum = step.step || idx + 1
                  const stepTitle = step.title || step.name || step.stage || (typeof step === 'string' ? step : 'Step')
                  const canonical = step.canonical_step || step.canonical_stage || null
                  const description = step.description || null
                  const authority = step.authority || null
                  const timeline = step.timeline || null

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 'var(--space-3)',
                        padding: 'var(--space-3) var(--space-4)',
                        background: 'var(--color-surface-subtle)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <span style={{
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--font-bold)',
                        color: 'var(--color-primary-light)',
                        background: 'rgba(99, 102, 241, 0.15)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-xs)',
                        minWidth: '28px',
                        textAlign: 'center'
                      }}>
                        {String(stepNum).padStart(2, '0')}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)' }}>
                            {stepTitle}
                          </span>
                          {canonical && (
                            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                              STAGE: {canonical}
                            </span>
                          )}
                        </div>

                        {description && (
                          <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-normal)' }}>
                            {description}
                          </p>
                        )}

                        <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {authority && <span><strong>Authority:</strong> {authority}</span>}
                          {timeline && <span><strong>Timeline:</strong> {timeline}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>No detailed steps registered for this domain.</p>
            )}
          </GlassCard>
        </div>
      ) : (
        <GlassCard variant="secondary" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>
            No procedure records found for {selectedJurisdiction} in the {selectedDomain} category.
          </p>
        </GlassCard>
      )}
    </div>
  )
}

export default JurisdictionProcedure
