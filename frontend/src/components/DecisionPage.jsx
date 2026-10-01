import { generatePrintablePdfReport } from '../utils/pdfExporter.js'
import React, { useState } from 'react'
import { legalQueryService } from '../services/nyayaApi.js'
import WorkspaceHeader from './layout/WorkspaceHeader.jsx'
import './DecisionPage.css'

/**
 * DecisionPage - Standalone Legal Decision Display
 * 
 * This is a standalone page that queries the real Nyaya backend
 * and displays structured legal decisions as authority, not chat.
 * 
 * Debug Mode: Press 'Ctrl+Shift+D' to toggle debug information
 */
function DecisionPage({ onNavigateHome }) {
  const [query, setQuery] = useState('')
  const [decision, setDecision] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedSections, setExpandedSections] = useState({})
  const [debugMode, setDebugMode] = useState(false)

  // Debug mode keyboard shortcut - Ctrl+Shift+D
  React.useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        setDebugMode(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

    const handleDownloadPdf = () => {
    if (!decision) return;
    const exportData = {
      query: query || decision.query || 'Legal Query',
      jurisdiction: decision.jurisdiction_detected || decision.jurisdiction || 'IN',
      domain: decision.domain || 'General',
      legal_analysis: decision.reasoning_trace?.legal_analysis || '',
      statutes: decision.relevant_sections || decision.statutes || [],
      remedies: decision.remedies || [],
      procedural_steps: decision.procedural_steps || []
    };

    fetch('http://localhost:8000/nyaya/export-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exportData)
    })
      .then(res => res.text())
      .then(htmlContent => {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(htmlContent);
          win.document.close();
        }
      })
      .catch(err => console.error('PDF export failed:', err));
  };

  const handleSubmitQuery = async (e) => {
    e.preventDefault()
    
    if (!query.trim()) {
      setError('Please enter a legal query')
      return
    }

    setLoading(true)
    setError(null)
    setDecision(null)
    setExpandedSections({})

    try {
      const result = await legalQueryService.submitQuery({ query: query.trim(), jurisdiction_hint: 'India' })
      
      if (!result.success) {
        throw new Error(result.error)
      }

      // ─── TANTRA: Frontend Formatter Gate ───
      // Reject responses that haven't passed the backend formatter gate
      if (!result.data?.metadata?.formatted) {
        throw new Error('Response rejected: metadata.formatted missing — unverified response from backend')
      }

      setDecision(result.data)
      console.log('Decision received:', result.data.trace_id, '| formatted:', result.data.metadata?.formatted)
    } catch (err) {
      setError(err.message || 'Failed to fetch decision. Please try again.')
      console.error('Query error:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getRecommendationColor = (type) => {
    switch (type) {
      case 'INFORM':
        return '#28a745'
      case 'REVIEW':
        return '#ffc107'
      case 'ESCALATE':
        return '#fd7e14'
      case 'INSUFFICIENT_DATA':
        return '#6c757d'
      default:
        return '#6c757d'
    }
  }

  const getRecommendationLabel = (type) => {
    switch (type) {
      case 'INFORM':
        return 'INFORMATIONAL'
      case 'REVIEW':
        return 'REVIEW RECOMMENDED'
      case 'ESCALATE':
        return 'ESCALATION ADVISED'
      case 'INSUFFICIENT_DATA':
        return 'INSUFFICIENT DATA'
      default:
        return 'PENDING'
    }
  }

  const normalizeProceduralSteps = (steps) => {
    if (!steps) return []
    if (Array.isArray(steps)) return steps.map((step) => String(step).trim()).filter(Boolean)
    return String(steps).split('|').map((step) => step.trim()).filter(Boolean)
  }

  return (
    <div className="decision-page">
      {/* Contextual Workspace Header */}
      <WorkspaceHeader
        breadcrumbs={[
          { label: 'NYAI', onClick: onNavigateHome },
          { label: 'Legal Operations' },
          { label: 'Decisions' }
        ]}
        title="Legal Determinations & Decisions"
        description="Real-time structured legal advisory with TANTRA-canonical recommendations."
        badge="DETERMINATION OS"
        onBack={onNavigateHome}
      />

      {/* Query Section */}
      <div className="decision-query-section">
        <div className="query-container">
          <form onSubmit={handleSubmitQuery}>
            <div className="form-group">
              <label htmlFor="query">Enter Your Legal Query</label>
              <textarea
                id="query"
                className="query-textarea"
                placeholder="Example: What are the procedures for filing a civil suit in India?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
                rows={4}
              />
            </div>

            <button
              type="submit"
              className="query-button"
              disabled={loading || !query.trim()}
            >
              {loading ? 'Processing Decision...' : 'Get Legal Decision'}
            </button>
          </form>

          {error && (
            <div className="error-message" data-testid="error-message">
              <span>!</span>
              <p>{error}</p>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}
        </div>
      </div>

      {/* Decision Display */}
      {decision && (
        <div className="decision-display">
          {/* Advisory Recommendation Banner */}
          <div 
            className="recommendation-banner"
            style={{ borderLeftColor: getRecommendationColor(decision.recommendation?.type) }}
          >
            <div className="recommendation-content">
              <h2 style={{ color: getRecommendationColor(decision.recommendation?.type) }}>
                {getRecommendationLabel(decision.recommendation?.type)}
              </h2>
              <p className="recommendation-type" data-testid="recommendation-type">{decision.recommendation?.type}</p>
              {decision.recommendation?.rationale && (
                <p className="recommendation-rationale">{decision.recommendation.rationale}</p>
              )}
            </div>
          </div>

          {/* PDF Export Banner Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button
              onClick={handleDownloadPdf}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.9rem',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              className="pdf-download-btn"
            >
              ?? Download PDF Legal Report
            </button>
          </div>

          {/* Decision Summary */}
          <div className="decision-section header-section">
            <div className="section-info">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Domain</div>
                  <div className="info-value">{decision.domain.toUpperCase()}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Jurisdiction</div>
                  <div className="info-value">{decision.jurisdiction_detected || decision.jurisdiction}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Confidence</div>
                  <div className="info-value">
                    {Math.round(decision.confidence.overall * 100)}%
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">Trace ID</div>
                  <div className="info-value trace-id" data-testid="trace-id">{decision.trace_id}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Analysis */}
          <div className="decision-section">
            <h3 className="section-title">Legal Analysis</h3>
            <div className="section-content">
              <p>{decision.reasoning_trace?.legal_analysis || 'No analysis available'}</p>
            </div>
          </div>

          {/* Procedural Steps */}
          <div className="decision-section">
            <button
              className="section-toggle"
              onClick={() => toggleSection('procedural')}
            >
              <h3 className="section-title">Procedural Steps</h3>
              <span className={`toggle-icon ${expandedSections.procedural ? 'open' : ''}`}>▼</span>
            </button>
            {expandedSections.procedural && (
              <div className="section-content">
                <ol className="procedural-list">
                  {normalizeProceduralSteps(decision.reasoning_trace?.procedural_steps).map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Timeline */}
          {decision.timeline && decision.timeline.length > 0 && (
            <div className="decision-section">
              <button
                className="section-toggle"
                onClick={() => toggleSection('timeline')}
              >
                <h3 className="section-title">Timeline</h3>
                <span className={`toggle-icon ${expandedSections.timeline ? 'open' : ''}`}>▼</span>
              </button>
              {expandedSections.timeline && (
                <div className="section-content">
                  <div className="timeline">
                    {decision.timeline.map((event, idx) => (
                      <div key={idx} className="timeline-item">
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                          <h4>{event.step}</h4>
                          <p>{event.eta}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Evidence Requirements */}
          {decision.evidence_requirements && decision.evidence_requirements.length > 0 && (
            <div className="decision-section">
              <button
                className="section-toggle"
                onClick={() => toggleSection('evidence')}
              >
                <h3 className="section-title">Evidence Requirements</h3>
                <span className={`toggle-icon ${expandedSections.evidence ? 'open' : ''}`}>▼</span>
              </button>
              {expandedSections.evidence && (
                <div className="section-content">
                  <ul className="evidence-list">
                    {decision.evidence_requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Remedies Available */}
          {decision.reasoning_trace?.remedies && decision.reasoning_trace.remedies.length > 0 && (
            <div className="decision-section">
              <button
                className="section-toggle"
                onClick={() => toggleSection('remedies')}
              >
                <h3 className="section-title">Available Remedies</h3>
                <span className={`toggle-icon ${expandedSections.remedies ? 'open' : ''}`}>▼</span>
              </button>
              {expandedSections.remedies && (
                <div className="section-content">
                  <ul className="remedies-list">
                    {decision.reasoning_trace.remedies.map((remedy, idx) => (
                      <li key={idx}>{remedy}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Legal Route */}
          {decision.legal_route && decision.legal_route.length > 0 && (
            <div className="decision-section">
              <button
                className="section-toggle"
                onClick={() => toggleSection('route')}
              >
                <h3 className="section-title">Legal Route</h3>
                <span className={`toggle-icon ${expandedSections.route ? 'open' : ''}`}>▼</span>
              </button>
              {expandedSections.route && (
                <div className="section-content">
                  <div className="legal-route">
                    {decision.legal_route.map((agent, idx) => (
                      <React.Fragment key={idx}>
                        <div className="route-step">{agent}</div>
                        {idx < decision.legal_route.length - 1 && (
                          <div className="route-arrow">→</div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Provenance Chain */}
          {decision.provenance_chain && decision.provenance_chain.length > 0 && (
            <div className="decision-section">
              <button
                className="section-toggle"
                onClick={() => toggleSection('provenance')}
              >
                <h3 className="section-title">Decision Provenance</h3>
                <span className={`toggle-icon ${expandedSections.provenance ? 'open' : ''}`}>▼</span>
              </button>
              {expandedSections.provenance && (
                <div className="section-content">
                  <div className="provenance-chain">
                    {decision.provenance_chain.map((event, idx) => (
                      <div key={idx} className="provenance-item">
                        <div className="provenance-time">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                        <div className="provenance-event">
                          <p><strong>{event.event}</strong></p>
                          <p>Agent: {event.agent}</p>
                          {event.domains && <p>Domains: {event.domains.join(', ')}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Confidence Breakdown */}
          {decision.confidence && (
            <div className="decision-section">
              <button
                className="section-toggle"
                onClick={() => toggleSection('confidence')}
              >
                <h3 className="section-title">Confidence Analysis</h3>
                <span className={`toggle-icon ${expandedSections.confidence ? 'open' : ''}`}>▼</span>
              </button>
              {expandedSections.confidence && (
                <div className="section-content">
                  <div className="confidence-breakdown">
                    <div className="confidence-item">
                      <div className="confidence-label">Overall</div>
                      <div className="confidence-bar">
                        <div 
                          className="confidence-fill"
                          style={{ width: `${decision.confidence.overall * 100}%` }}
                        ></div>
                      </div>
                      <span>{Math.round(decision.confidence.overall * 100)}%</span>
                    </div>
                    {Object.entries(decision.confidence).map(([key, value]) => 
                      key !== 'overall' ? (
                        <div key={key} className="confidence-item">
                          <div className="confidence-label">{key.replace(/_/g, ' ')}</div>
                          <div className="confidence-bar">
                            <div 
                              className="confidence-fill"
                              style={{ width: `${value * 100}%` }}
                            ></div>
                          </div>
                          <span>{Math.round(value * 100)}%</span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="decision-footer">
            <button 
              className="action-button"
              onClick={() => generatePrintablePdfReport(decision, query)}
            >
              Export Decision
            </button>
            <button 
              className="action-button secondary"
              onClick={() => {
                setDecision(null)
                setQuery('')
                setError(null)
              }}
            >
              New Query
            </button>
          </div>

          {/* Debug Mode - Development Only */}
          {debugMode && (
            <div style={{
              marginTop: '30px',
              padding: '16px',
              background: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontFamily: 'monospace',
              color: '#666'
            }}>
              <strong>DEBUG INFO:</strong><br/>
              Recommendation: <strong>{decision.recommendation?.type}</strong><br/>
              Trace ID: <strong>{decision.trace_id}</strong><br/>
              Confidence: <strong>{Math.round(decision.confidence?.overall * 100)}%</strong><br/>
              Fields: <strong>{Object.keys(decision).length}/12</strong><br/>
              Timestamp: {new Date().toISOString()}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="decision-loading">
          <div className="spinner"></div>
          <p>Analyzing legal decision...</p>
        </div>
      )}

      {/* Empty State */}
      {!decision && !loading && !error && (
        <div className="decision-empty">
          <p>Submit a legal query to receive a structured legal decision</p>
        </div>
      )}
    </div>
  )
}

export default DecisionPage
