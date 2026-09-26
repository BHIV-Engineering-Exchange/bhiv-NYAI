import React, { useState, useEffect } from 'react'
import { BookOpen, Shield, Scale, ListOrdered, Sparkles, Send } from 'lucide-react'
import FeedbackButtons from './FeedbackButtons.jsx'
import { legalQueryService } from '../services/nyayaApi.js'
import GlassCard from './ui/GlassCard.jsx'
import BHIVButton from './ui/BHIVButton.jsx'
import StatusBadge from './ui/StatusBadge.jsx'
import DeveloperDetails from './ui/DeveloperDetails.jsx'
import WorkspaceHeader from './layout/WorkspaceHeader.jsx'
import './LegalQueryCard.css'

const LegalQueryCard = ({ onResponseReceived, isOffline: _isOffline, onNavigateHome }) => {
  const [query, setQuery] = useState('')
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('India')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [response, setResponse] = useState(null)
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [traceId, setTraceId] = useState(null)
  const [backendStatus, setBackendStatus] = useState('ready') // 'ready', 'checking', 'processing'
  const [errorMsg, setErrorMsg] = useState(null)

  const jurisdictionMap = {
    'India': 'India',
    'UK': 'UK',
    'UAE': 'UAE'
  }

  const jurisdictionOptions = ['India', 'UK', 'UAE']

  const getRecommendationBadgeVariant = (recType) => {
    switch (recType) {
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim() || isSubmitting) return

    setIsSubmitting(true)
    setBackendStatus('processing')
    setErrorMsg(null)
    setResponse(null)
    setSubmittedQuery(query)

    try {
      const result = await legalQueryService.submitQuery({
        query: query.trim(),
        jurisdiction_hint: jurisdictionMap[selectedJurisdiction]
      })

      if (result.success) {
        setBackendStatus('ready')
        setTraceId(result.trace_id)
        const backendData = result.data

        setResponse(backendData)
        if (onResponseReceived) {
          onResponseReceived(backendData)
        }
      } else {
        setBackendStatus('ready')
        setErrorMsg(result.error || 'Failed to obtain legal intelligence response.')
      }
    } catch (err) {
      setBackendStatus('ready')
      setErrorMsg(err.message || 'Connection failure encountered while communicating with the engine.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="legal-query-container">
      {/* Contextual Workspace Header */}
      <WorkspaceHeader
        breadcrumbs={[
          { label: 'NYAI', onClick: onNavigateHome },
          { label: 'Legal Operations' },
          { label: 'Ask Legal' }
        ]}
        title="Ask NYAI"
        description="Structured legal consultation across supported jurisdictions."
        badge="SOVEREIGN ANALYSIS"
        badgeVariant="info"
        onBack={onNavigateHome}
      />

      {/* Case Intake Workspace Card */}
      <GlassCard variant="primary" className="query-intake-card">
        <div className="query-intake-header">
          <span className="query-eyebrow">NEW LEGAL CONSULTATION</span>
          <p className="query-description">
            Provide the facts, relevant dates, and legal questions for multi-statutory jurisdictional analysis.
          </p>
        </div>

        {/* Jurisdiction Selector */}
        <div className="jurisdiction-control">
          <label className="jurisdiction-label" id="jurisdiction-selector-label">
            Select Jurisdiction
          </label>
          <div className="jurisdiction-pills" role="group" aria-labelledby="jurisdiction-selector-label">
            {jurisdictionOptions.map((jur) => (
              <button
                key={jur}
                type="button"
                className={`jurisdiction-pill ${selectedJurisdiction === jur ? 'active' : ''}`}
                onClick={() => setSelectedJurisdiction(jur)}
                disabled={isSubmitting}
                aria-pressed={selectedJurisdiction === jur}
              >
                {jur}
              </button>
            ))}
          </div>
        </div>

        {/* Query Input Form */}
        <form onSubmit={handleSubmit} className="query-form">
          <div className="query-input-wrapper">
            <label htmlFor="legal-query-input" className="query-input-label">
              Legal Question & Statement of Facts
            </label>
            <textarea
              id="legal-query-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe the legal matter, contract provisions, parties involved, or factual scenario in detail..."
              disabled={isSubmitting}
              className="query-textarea"
              rows={6}
            />
          </div>

          <div className="query-actions">
            <BHIVButton
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting || !query.trim()}
              loading={isSubmitting}
            >
              <Send size={14} style={{ marginRight: '8px' }} />
              {isSubmitting ? 'Analyzing Scenario...' : 'Analyze with NYAI →'}
            </BHIVButton>
          </div>
        </form>
      </GlassCard>

      {/* Operational Processing State */}
      {isSubmitting && (
        <GlassCard variant="secondary" className="processing-card">
          <div className="processing-spinner" aria-hidden="true" />
          <div>
            <h3 className="processing-title">NYAI is analyzing your query</h3>
            <p className="processing-subtitle">
              Evaluating applicable statutes, procedural routes, and precedents.
            </p>
          </div>
          <div className="processing-stages">
            <div className="processing-stage-item active">
              <span>●</span>
              <span>Retrieving relevant legal information</span>
            </div>
            <div className="processing-stage-item">
              <span>○</span>
              <span>Analyzing jurisdictional criteria</span>
            </div>
            <div className="processing-stage-item">
              <span>○</span>
              <span>Formulating advisory recommendation</span>
            </div>
          </div>

          {/* Structured Legal Analysis Skeleton */}
          <div className="skeleton-container" aria-hidden="true">
            <div className="skeleton-section">
              <span className="skeleton-label">LEGAL ANALYSIS</span>
              <div className="skeleton-bar skeleton-bar--full" />
              <div className="skeleton-bar skeleton-bar--three-quarters" />
            </div>
            <div className="skeleton-section">
              <span className="skeleton-label">RECOMMENDATION</span>
              <div className="skeleton-bar skeleton-bar--half" />
            </div>
            <div className="skeleton-section">
              <span className="skeleton-label">STATUTES & PROCEDURAL ROUTE</span>
              <div className="skeleton-bar skeleton-bar--full" />
              <div className="skeleton-bar skeleton-bar--two-thirds" />
            </div>
          </div>
        </GlassCard>
      )}

      {/* Error Presentation */}
      {errorMsg && (
        <GlassCard
          variant="secondary"
          style={{
            borderColor: 'var(--color-error)',
            background: 'rgba(239, 68, 68, 0.08)',
            padding: 'var(--space-5)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <StatusBadge variant="error">ERROR</StatusBadge>
            <span style={{ color: 'var(--color-text)', fontSize: 'var(--text-sm)' }}>
              {errorMsg}
            </span>
          </div>
        </GlassCard>
      )}

      {/* Answer Experience */}
      {response && !isSubmitting && (
        <div className="response-container">
          {/* Header & Overview Card */}
          <GlassCard variant="primary" className="response-header-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <div>
                <span className="query-eyebrow">NYAI RESPONSE</span>
                <h3 style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--text-xl)', color: 'var(--color-text)' }}>
                  Legal Intelligence Evaluation
                </h3>
              </div>
              {response.recommendation?.type && (
                <div data-testid="recommendation-status">
                  <StatusBadge
                    variant={getRecommendationBadgeVariant(response.recommendation.type)}
                    size="md"
                  >
                    <span data-testid="recommendation-type">
                      {response.recommendation.type}
                    </span>
                  </StatusBadge>
                </div>
              )}
            </div>

            {submittedQuery && (
              <div style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--color-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                borderLeft: '3px solid var(--color-primary)'
              }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Submitted Query
                </span>
                <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {submittedQuery}
                </p>
              </div>
            )}

            <div className="response-meta-bar">
              <div className="response-meta-item">
                <span className="response-meta-label">Jurisdiction</span>
                <span className="response-meta-value">
                  {response.jurisdiction_detected || response.jurisdiction || selectedJurisdiction}
                </span>
              </div>
              <div className="response-meta-item">
                <span className="response-meta-label">Domain</span>
                <span className="response-meta-value" style={{ textTransform: 'capitalize' }}>
                  {response.domain || 'General Legal'}
                </span>
              </div>
              <div className="response-meta-item">
                <span className="response-meta-label">Engine Confidence</span>
                <span className="response-meta-value">
                  {Math.round((response.confidence?.overall || 0) * 100)}%
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Primary Legal Analysis */}
          {response.reasoning_trace?.legal_analysis && (
            <GlassCard variant="secondary" className="analysis-section">
              <div className="section-title-wrap">
                <h4 className="section-title">
                  <BookOpen size={16} color="var(--bhiv-primary-hover, #818cf8)" />
                  <span>Legal Analysis</span>
                </h4>
                <StatusBadge variant="neutral" size="sm">Primary Opinion</StatusBadge>
              </div>
              <pre className="analysis-content">
                {response.reasoning_trace.legal_analysis}
              </pre>
            </GlassCard>
          )}

          {/* Available Remedies */}
          {response.reasoning_trace?.remedies && response.reasoning_trace.remedies.length > 0 && (
            <GlassCard variant="secondary" className="analysis-section">
              <h4 className="section-title">
                <Shield size={16} color="var(--bhiv-primary-hover, #818cf8)" />
                <span>Available Remedies</span>
              </h4>
              <div className="remedies-list">
                {response.reasoning_trace.remedies.map((remedy, idx) => (
                  <div key={idx} className="remedy-item">
                    <div className="remedy-badge">{idx + 1}</div>
                    <p className="remedy-text">{remedy}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Applicable Statutes */}
          {response.statutes && response.statutes.length > 0 && (
            <GlassCard variant="secondary" className="analysis-section">
              <div className="section-title-wrap">
                <h4 className="section-title">
                  <Scale size={16} color="var(--bhiv-primary-hover, #818cf8)" />
                  <span>Applicable Statutes ({response.statutes.length})</span>
                </h4>
              </div>
              <div className="statutes-grid">
                {response.statutes.map((statute, idx) => (
                  <div key={idx} className="statute-card">
                    <span className="statute-section">
                      Section {statute.section} — {statute.act} {statute.year > 0 ? `(${statute.year})` : ''}
                    </span>
                    <span className="statute-title">
                      {statute.title}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Procedural Steps */}
          {response.reasoning_trace?.procedural_steps && response.reasoning_trace.procedural_steps.length > 0 && (
            <GlassCard variant="secondary" className="analysis-section">
              <h4 className="section-title">
                <ListOrdered size={16} color="var(--bhiv-primary-hover, #818cf8)" />
                <span>Procedural Steps</span>
              </h4>
              <div className="procedural-steps-list">
                {response.reasoning_trace.procedural_steps.map((step, idx) => (
                  <div key={idx} className="procedural-step-item">
                    <span className="procedural-step-num">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="procedural-step-text">{step}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Collapsible Technical / Pipeline Details via DeveloperDetails */}
          <DeveloperDetails title="Developer & Pipeline Details" defaultOpen={false}>
            <div className="dev-details-grid">
              {/* Trace ID */}
              <div className="dev-meta-row">
                <span className="dev-meta-label">Trace Identifier:</span>
                <span className="dev-meta-val" data-testid="trace-id">
                  {traceId || response.trace_id || 'N/A'}
                </span>
              </div>

              {/* Processing Route */}
              {response.legal_route && response.legal_route.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <span className="dev-meta-label">Agent Execution Route:</span>
                  <div className="route-badges">
                    {response.legal_route.map((agent, idx) => (
                      <React.Fragment key={idx}>
                        <span className="route-badge">
                          {agent.replace(/_/g, ' ')}
                        </span>
                        {idx < response.legal_route.length - 1 && (
                          <span className="route-arrow">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Confidence Breakdown */}
              {response.confidence && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <span className="dev-meta-label">Confidence Breakdown:</span>
                  <div className="confidence-grid">
                    {Object.entries(response.confidence).map(([k, val]) => (
                      <div key={k} className="confidence-cell">
                        <span className="confidence-cell-label">{k.replace(/_/g, ' ')}</span>
                        <span className="confidence-cell-value">
                          {typeof val === 'number' ? `${Math.round(val * 100)}%` : val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DeveloperDetails>

          {/* Verification & Feedback */}
          <FeedbackButtons traceId={traceId || response.trace_id} context="Legal Query Response" />
        </div>
      )}
    </div>
  )
}

export default LegalQueryCard
