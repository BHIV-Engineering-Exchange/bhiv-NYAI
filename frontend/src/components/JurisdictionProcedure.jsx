import React, { useState, useEffect } from 'react'
import { Globe } from 'lucide-react'
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

  const domains = ['civil', 'criminal', 'constitutional']

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

  const handleHomeClick = onNavigateHome || onBack;

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

        {/* Controls Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-5)' }}>
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
                {selectedJurisdiction} — {selectedDomain.toUpperCase()} Rules
              </h3>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                Official procedural guidelines
              </span>
            </div>
            <StatusBadge variant="info" size="sm">
              VERIFIED JURISDICTION
            </StatusBadge>
          </div>

          {procedures.steps || Array.isArray(procedures) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {(procedures.steps || procedures).map((step, idx) => (
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
                    background: 'var(--color-primary-transparent)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-xs)'
                  }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)' }}>
                      {typeof step === 'string' ? step : step.name || step.stage || step.title}
                    </div>
                    {step.description && (
                      <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-normal)' }}>
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <pre style={{
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-xs)',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              margin: 0
            }}>
              {JSON.stringify(procedures, null, 2)}
            </pre>
          )}
        </GlassCard>
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
