import { generatePrintablePdfReport } from '../utils/pdfExporter.js'
import React, { useState, useEffect } from 'react'
import './GravitasDecisionPanel.css'
import ConfidenceIndicator from './ConfidenceIndicator.jsx'
import JurisdictionInfoBar from './JurisdictionInfoBar.jsx'
import RecommendationStatusCard from './RecommendationStatusCard.jsx'
import SkeletonLoader from './SkeletonLoader.jsx'

/**
 * GravitasDecisionPanel
 * 
 * Production-ready component for rendering legal decisions from Nyaya AI backend.
 * Displays a comprehensive legal decision screen combining:
 * - Domain and Jurisdiction information
 * - Confidence metrics
 * - Advisory recommendation (if applicable)
 * - Constitutional references
 * - Recommended legal routes
 * - Provenance chain and reasoning
 * 
 * @param {Object} props
 * @param {Object} props.decision - NyayaResponse object from backend
 * @param {string} props.decision.domain - Legal domain (criminal, civil, constitutional)
 * @param {string} props.decision.jurisdiction - Jurisdiction (India, UK, UAE)
 * @param {number} props.decision.confidence - Confidence score (0.0-1.0)
 * @param {Array<string>} props.decision.legal_route - Agent route taken
 * @param {Array<string>} props.decision.constitutional_articles - Relevant articles
 * @param {Array<Object>} props.decision.provenance_chain - Decision provenance
 * @param {Object} props.decision.reasoning_trace - Detailed reasoning
 * @param {string} props.decision.trace_id - Unique trace identifier
 * @param {Object} props.decision.recommendation - Advisory recommendation
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onExplainClick - Callback for explain reasoning
 * @param {Function} props.onFeedbackClick - Callback for feedback submission
 */
const GravitasDecisionPanel = ({
  decision,
  loading = false,
  onExplainClick,
  onFeedbackClick
}) => {
  const [expandedSections, setExpandedSections] = useState({
    reasoning: false,
    provenance: false,
    constitutional: false
  })

  if (loading) {
    return <SkeletonLoader />
  }

  if (!decision) {
    return (
      <div className="gravitas-panel gravitas-empty-state">
        <div className="empty-state-content">
          <h2>No Decision Available</h2>
          <p>Submit a legal query to generate a decision.</p>
        </div>
      </div>
    )
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Dynamically set color scheme based on confidence
  const getConfidenceTheme = (confidence) => {
    if (confidence >= 0.85) return 'high-confidence'
    if (confidence >= 0.65) return 'medium-confidence'
    return 'low-confidence'
  }

  const confidenceTheme = getConfidenceTheme(decision.confidence)

  return (
    <div className={`gravitas-panel ${confidenceTheme}`}>
      {/* Header Section */}
      <div className="gravitas-header">
        <div className="header-top">
          <div className="header-titles">
            <h1 className="gravitas-title">Legal Decision</h1>
            <p className="gravitas-subtitle">
              {decision.domain} • {decision.jurisdiction} • Trace: {decision.trace_id.substring(0, 8)}...
            </p>
          </div>
          <div className="confidence-widget">
            <ConfidenceIndicator confidence={decision.confidence} />
          </div>
        </div>
      </div>

      {/* Advisory Recommendation - if applicable */}
      {decision.recommendation && (
        <div className="gravitas-recommendation-section">
          <RecommendationStatusCard
            recommendation={decision.recommendation}
            traceId={decision.trace_id}
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="gravitas-content">
        
        {/* Left Column: Primary Information */}
        <div className="gravitas-column-primary">
          
          {/* Domain & Jurisdiction Card */}
          <div className="gravitas-card jurisdiction-card">
            <h3 className="card-title">
              <span className="card-icon">🏛️</span>
              Jurisdiction Context
            </h3>
            <div className="card-content jurisdiction-grid">
              <div className="jurisdiction-item">
                <div className="item-label">Domain</div>
                <div className="item-value domain-badge">{decision.domain.toUpperCase()}</div>
              </div>
              <div className="jurisdiction-item">
                <div className="item-label">Jurisdiction</div>
                <div className="item-value">{decision.jurisdiction}</div>
              </div>
              <div className="jurisdiction-item">
                <div className="item-label">Confidence</div>
                <div className="item-value confidence-badge">
                  {Math.round(decision.confidence * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Legal Route Card */}
          <div className="gravitas-card route-card">
            <h3 className="card-title">
              <span className="card-icon">🛣️</span>
              Legal Route
            </h3>
            <div className="card-content">
              <div className="route-path">
                {decision.legal_route && decision.legal_route.map((agent, index) => (
                  <React.Fragment key={index}>
                    <div className="route-step">
                      <div className="route-step-label">{agent}</div>
                    </div>
                    {index < decision.legal_route.length - 1 && (
                      <div className="route-arrow">→</div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Constitutional Articles Section */}
          {decision.constitutional_articles && decision.constitutional_articles.length > 0 && (
            <div className="gravitas-card constitutional-card">
              <button
                className="card-title-button"
                onClick={() => toggleSection('constitutional')}
              >
                <span className="card-icon">⚖️</span>
                <span className="card-title">Constitutional References</span>
                <span className={`expand-icon ${expandedSections.constitutional ? 'expanded' : ''}`}>
                  ▼
                </span>
              </button>
              {expandedSections.constitutional && (
                <div className="card-content">
                  <div className="articles-list">
                    {decision.constitutional_articles.map((article, index) => (
                      <div key={index} className="article-item">
                        <div className="article-icon">📄</div>
                        <div className="article-text">{article}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Evidence & Reasoning */}
        <div className="gravitas-column-secondary">
          
          {/* Provenance Chain Section */}
          {decision.provenance_chain && decision.provenance_chain.length > 0 && (
            <div className="gravitas-card provenance-card">
              <button
                className="card-title-button"
                onClick={() => toggleSection('provenance')}
              >
                <span className="card-icon">🔗</span>
                <span className="card-title">Decision Provenance</span>
                <span className={`expand-icon ${expandedSections.provenance ? 'expanded' : ''}`}>
                  ▼
                </span>
              </button>
              {expandedSections.provenance && (
                <div className="card-content">
                  <div className="provenance-chain">
                    {decision.provenance_chain.map((item, index) => (
                      <div key={index} className="provenance-item">
                        <div className="provenance-step-number">{index + 1}</div>
                        <div className="provenance-content">
                          <div className="provenance-source">
                            {item.source || 'Processing Step'}
                          </div>
                          {item.description && (
                            <div className="provenance-description">
                              {item.description}
                            </div>
                          )}
                          {item.timestamp && (
                            <div className="provenance-timestamp">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                        {index < decision.provenance_chain.length - 1 && (
                          <div className="provenance-chain-line"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reasoning Trace Section */}
          {decision.reasoning_trace && Object.keys(decision.reasoning_trace).length > 0 && (
            <div className="gravitas-card reasoning-card">
              <button
                className="card-title-button"
                onClick={() => toggleSection('reasoning')}
              >
                <span className="card-icon">🧠</span>
                <span className="card-title">Reasoning Details</span>
                <span className={`expand-icon ${expandedSections.reasoning ? 'expanded' : ''}`}>
                  ▼
                </span>
              </button>
              {expandedSections.reasoning && (
                <div className="card-content">
                  <div className="reasoning-trace">
                    {Object.entries(decision.reasoning_trace).map(([key, value]) => (
                      <div key={key} className="reasoning-entry">
                        <div className="reasoning-key">{key}</div>
                        <div className="reasoning-value">
                          {typeof value === 'object' 
                            ? JSON.stringify(value, null, 2)
                            : String(value)
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="gravitas-footer">
        <div className="footer-actions">
          {onExplainClick && (
            <button
              className="action-button primary"
              onClick={() => onExplainClick(decision.trace_id)}
            >
              <span className="button-icon">💬</span>
              Explain Reasoning
            </button>
          )}
          {onFeedbackClick && (
            <button
              className="action-button secondary"
              onClick={() => onFeedbackClick(decision.trace_id)}
            >
              <span className="button-icon">⭐</span>
              Provide Feedback
            </button>
          )}
          <button
            className="action-button tertiary"
            onClick={() => generatePrintablePdfReport(decision)}
          >
            <span className="button-icon">📥</span>
            Export Decision
          </button>
        </div>
        <div className="footer-metadata">
          <span className="trace-id">UUID: {decision.trace_id}</span>
        </div>
      </div>
    </div>
  )
}

export default GravitasDecisionPanel
