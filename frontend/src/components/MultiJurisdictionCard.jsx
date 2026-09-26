import React, { useState } from 'react'
import ProceduralTimeline from './ProceduralTimeline.jsx'
import FeedbackButtons from './FeedbackButtons.jsx'
import GlassCard from './ui/GlassCard.jsx'
import BHIVButton from './ui/BHIVButton.jsx'
import StatusBadge from './ui/StatusBadge.jsx'
import DeveloperDetails from './ui/DeveloperDetails.jsx'
import { legalQueryService } from '../services/nyayaApi.js'

const MultiJurisdictionCard = () => {
  const [query, setQuery] = useState('')
  const [selectedJurisdictions, setSelectedJurisdictions] = useState(['India'])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [comparativeAnalysis, setComparativeAnalysis] = useState(null)
  const [traceId, setTraceId] = useState(null)
  const [error, setError] = useState(null)

  const availableJurisdictions = [
    { id: 'India', name: 'India', description: 'Common law framework with codified statutory provisions' },
    { id: 'UK', name: 'United Kingdom', description: 'Common law precedents and parliamentary legislation' },
    { id: 'UAE', name: 'United Arab Emirates', description: 'Civil law codes with Sharia and commercial regulations' }
  ]

  const toggleJurisdiction = (jurisdiction) => {
    setSelectedJurisdictions(prev => 
      prev.includes(jurisdiction) 
        ? prev.filter(j => j !== jurisdiction)
        : [...prev, jurisdiction]
    )
  }

  const handleAnalyze = async () => {
    if (!query.trim() || selectedJurisdictions.length === 0) return

    setIsAnalyzing(true)
    setError(null)
    
    try {
      const result = await legalQueryService.submitMultiJurisdictionQuery({
        query: query,
        jurisdictions: selectedJurisdictions
      })
      
      if (result.success) {
        setTraceId(result.trace_id)
        setComparativeAnalysis(result.data)
      } else {
        setError(result.error || 'Failed to obtain multi-jurisdiction analysis.')
      }
    } catch (err) {
      console.error('Error:', err)
      setError(err.message || 'Connection failure while contacting multi-jurisdiction engine.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      {/* Overview Card */}
      <GlassCard variant="primary" style={{ padding: 'var(--space-6)' }}>
        <div style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--color-primary-light)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em'
        }}>
          Cross-Border Intelligence
        </div>
        <h2 style={{
          fontFamily: 'var(--font-family-heading)',
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--color-text)',
          margin: 'var(--space-1) 0 0 0'
        }}>
          Multi-Jurisdictional Comparative Evaluation
        </h2>
        <p style={{ margin: 'var(--space-2) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Compare legal standards, procedural burdens, and statutory remedies across multiple legal frameworks.
        </p>

        {/* Input */}
        <div style={{ marginTop: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Legal Inquiry / Cross-Border Dispute Facts
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe the cross-border matter, supply dispute, or jurisdictional conflict..."
            rows={4}
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--color-bg-base)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-sm)',
              boxSizing: 'border-box',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Jurisdiction Selection */}
        <div style={{ marginTop: 'var(--space-4)' }}>
          <span style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
            Select Comparative Legal Systems
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-2)' }}>
            {availableJurisdictions.map((jurisdiction) => {
              const isSelected = selectedJurisdictions.includes(jurisdiction.id)
              return (
                <div
                  key={jurisdiction.id}
                  onClick={() => toggleJurisdiction(jurisdiction.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3)',
                    background: isSelected ? 'var(--color-primary-transparent)' : 'var(--color-surface-subtle)',
                    border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)' }}>
                      {jurisdiction.name}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {jurisdiction.description}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-5)', display: 'flex', justifyContent: 'flex-end' }}>
          <BHIVButton
            variant="primary"
            size="lg"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !query.trim() || selectedJurisdictions.length === 0}
            loading={isAnalyzing}
          >
            {isAnalyzing ? 'Evaluating Frameworks...' : 'Conduct Comparative Analysis →'}
          </BHIVButton>
        </div>
      </GlassCard>

      {/* Jurisdiction-Specific Guidance Panels */}
      {selectedJurisdictions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {selectedJurisdictions.map((jurisdiction) => {
            const guidance = {
              India: {
                courtSystem: 'Indian Judicial Hierarchy (Supreme Court, High Courts, District Judiciary)',
                authorityTone: 'Codified common law, emphasizing formal pleadings and evidentiary compliance',
                emergencyGuidance: 'File FIR at local Police Station, apply for interim injunctive relief before Civil Judge'
              },
              UK: {
                courtSystem: 'UK Courts and Tribunals (Supreme Court, Court of Appeal, High Court)',
                authorityTone: 'Common law precedent system with extensive judicial discretion',
                emergencyGuidance: 'Contact Police or Crown Prosecution Service; apply for without-notice injunction'
              },
              UAE: {
                courtSystem: 'UAE Federal Judiciary & Emirate Courts (Cassation, Appeal, First Instance)',
                authorityTone: 'Civil law codified system with commercial reconciliation emphasis',
                emergencyGuidance: 'Submit petition to Public Prosecution or urgent matters summary judge'
              }
            }[jurisdiction] || {}

            return (
              <GlassCard key={jurisdiction} variant="secondary" style={{ padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)', margin: 0 }}>
                    {jurisdiction} Sovereign Framework
                  </h3>
                  <StatusBadge variant="info" size="sm">
                    {jurisdiction}
                  </StatusBadge>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                  <div>
                    <strong style={{ color: 'var(--color-text)' }}>Judicial System: </strong>
                    {guidance.courtSystem}
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-text)' }}>Procedural Tone: </strong>
                    {guidance.authorityTone}
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-text)' }}>Urgent Action Protocol: </strong>
                    {guidance.emergencyGuidance}
                  </div>
                </div>

                <ProceduralTimeline jurisdiction={jurisdiction} />
              </GlassCard>
            )
          })}
        </div>
      )}

      {/* Comparative Analysis Results */}
      {comparativeAnalysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <GlassCard variant="primary" style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontFamily: 'var(--font-family-heading)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)', margin: '0 0 var(--space-3) 0' }}>
              Comparative Legal Findings
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {comparativeAnalysis.results?.map((result) => (
                <div 
                  key={result.jurisdiction}
                  style={{
                    padding: 'var(--space-4)',
                    background: 'var(--color-surface-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', color: 'var(--color-text)' }}>
                      {result.jurisdiction} Evaluation
                    </span>
                    <StatusBadge variant="info" size="sm">{result.jurisdiction}</StatusBadge>
                  </div>
                  
                  <p style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-normal)' }}>
                    {result.analysis}
                  </p>

                  {result.keyDifferences && result.keyDifferences.length > 0 && (
                    <div style={{ marginBottom: 'var(--space-3)' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-warning)' }}>
                        Key Distinctive Provisions:
                      </span>
                      <ul style={{ margin: 'var(--space-1) 0 0 0', paddingLeft: 'var(--space-5)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                        {result.keyDifferences.map((diff, i) => (
                          <li key={i}>{diff}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.recommendations && result.recommendations.length > 0 && (
                    <div>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-success)' }}>
                        Advisory Considerations:
                      </span>
                      <ul style={{ margin: 'var(--space-1) 0 0 0', paddingLeft: 'var(--space-5)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                        {result.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {traceId && (
              <div style={{ marginTop: 'var(--space-4)' }}>
                <DeveloperDetails title="Comparative Pipeline Details" defaultOpen={false}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Trace ID:</span>
                    <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>{traceId}</span>
                  </div>
                </DeveloperDetails>
              </div>
            )}
          </GlassCard>

          <FeedbackButtons traceId={traceId} context="Multi-Jurisdiction Analysis" />
        </div>
      )}
    </div>
  )
}

export default MultiJurisdictionCard