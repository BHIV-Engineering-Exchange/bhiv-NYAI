import React, { useState } from 'react'
import ApiErrorState from './ApiErrorState.jsx'
import SkeletonLoader from './SkeletonLoader.jsx'
import GlassCard from './ui/GlassCard.jsx'
import StatusBadge from './ui/StatusBadge.jsx'

const GlossaryCard = ({ terms, jurisdiction, caseType, traceId, loading, error, onRetry }) => {
  const [expandedTerms, setExpandedTerms] = useState(new Set())

  if (loading) return <SkeletonLoader type="card" count={3} />

  if (error || !terms || !Array.isArray(terms) || terms.length === 0 || !jurisdiction) {
    return (
      <ApiErrorState
        title="Glossary Unavailable"
        message={error || 'The backend returned an incomplete glossary response.'}
        traceId={traceId}
        onRetry={onRetry}
      />
    )
  }

  const toggleTerm = (term) => {
    const newExpanded = new Set(expandedTerms)
    if (newExpanded.has(term)) {
      newExpanded.delete(term)
    } else {
      newExpanded.add(term)
    }
    setExpandedTerms(newExpanded)
  }

  return (
    <GlassCard variant="primary" style={{ padding: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-primary-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Reference Intelligence
          </span>
          <h3 style={{
            fontFamily: 'var(--font-family-heading)',
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--color-text)',
            margin: 'var(--space-1) 0 0 0'
          }}>
            Legal Glossary
            {caseType && (
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 'normal', marginLeft: 'var(--space-2)' }}>
                ({caseType})
              </span>
            )}
          </h3>
        </div>
        <StatusBadge variant="info" size="sm">
          {jurisdiction}
        </StatusBadge>
      </div>

      {/* Terms List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {terms?.map((termData, index) => {
          const isExpanded = expandedTerms.has(termData?.term)
          const hasConfidence = termData?.confidence !== undefined

          return (
            <div
              key={index}
              style={{
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden'
              }}
            >
              {/* Term Header */}
              <div
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: isExpanded ? 'var(--color-surface-muted)' : 'transparent'
                }}
                onClick={() => toggleTerm(termData?.term)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ color: 'var(--color-primary-light)', fontSize: 'var(--text-xs)' }}>
                    {isExpanded ? '▼' : '▶'}
                  </span>
                  <span style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text)',
                    fontWeight: 'var(--font-semibold)'
                  }}>
                    {termData?.term}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  {hasConfidence && (
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      fontFamily: 'var(--font-family-mono)'
                    }}>
                      {(termData.confidence * 100).toFixed(0)}% conf
                    </span>
                  )}
                </div>
              </div>

              {/* Expandable Content */}
              {isExpanded && (
                <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {/* Definition */}
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Definition
                    </span>
                    <p style={{
                      color: 'var(--color-text)',
                      lineHeight: 'var(--line-height-normal)',
                      fontSize: 'var(--text-sm)',
                      margin: 'var(--space-1) 0 0 0'
                    }}>
                      {termData.definition}
                    </p>
                  </div>

                  {/* Context */}
                  {termData.context && (
                    <div>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                        Context in Current Scenario
                      </span>
                      <p style={{
                        color: 'var(--color-text-secondary)',
                        lineHeight: 'var(--line-height-normal)',
                        fontSize: 'var(--text-sm)',
                        margin: 'var(--space-1) 0 0 0'
                      }}>
                        {termData.context}
                      </p>
                    </div>
                  )}

                  {/* Related Terms */}
                  {termData.relatedTerms && termData.relatedTerms.length > 0 && (
                    <div>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                        Related Terms
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
                        {termData.relatedTerms.map((related, idx) => (
                          <span
                            key={idx}
                            style={{
                              backgroundColor: 'var(--color-surface-muted)',
                              color: 'var(--color-text-secondary)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-xs)',
                              fontSize: 'var(--text-xs)'
                            }}
                          >
                            {related}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}

export default GlossaryCard