import React, { useState, useEffect } from 'react'
import FeedbackButtons from './FeedbackButtons.jsx'
import { legalQueryService } from '../services/nyayaApi.js'

const LegalQueryCard = ({ onResponseReceived, isOffline: _isOffline }) => {
  const [query, setQuery] = useState('')
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('India')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [response, setResponse] = useState(null)
  const [traceId, setTraceId] = useState(null)
  const [backendStatus, setBackendStatus] = useState('checking') // 'checking', 'ready', 'waking', 'processing'
  const [isFirstRequest, setIsFirstRequest] = useState(true)
  const [showTechDetails, setShowTechDetails] = useState(false)

  useEffect(() => {
    setBackendStatus('ready')
  }, [])

  const jurisdictionMap = {
    'India': 'India',
    'UK': 'UK',
    'UAE': 'UAE'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    if (isFirstRequest) {
      setBackendStatus('processing')
      setIsFirstRequest(false)
    }
    
    setIsSubmitting(true)
    setResponse(null)
    
    try {
      const result = await legalQueryService.submitQuery({
        query: query,
        jurisdiction_hint: jurisdictionMap[selectedJurisdiction]
      })
      if (result.success) {
        setBackendStatus('ready')
        setTraceId(result.trace_id)
        
        const backendData = result.data
        console.log('=== FRONTEND DEBUG ===')
        console.log('Requested Jurisdiction:', jurisdictionMap[selectedJurisdiction])
        console.log('Backend Response:', backendData)
        console.log('Returned Jurisdiction:', backendData.jurisdiction_detected || backendData.jurisdiction)
        console.log('Recommendation (root):', backendData.recommendation)
        console.log('======================')
        
        setResponse(backendData)
        if (onResponseReceived) {
          onResponseReceived(backendData)
        }
      } else {
        alert(`Error: ${result.error || 'Failed to get response from backend'}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert(`Error: ${error.message || 'Failed to connect to backend'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {(backendStatus === 'checking' || backendStatus === 'processing') && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '60px 32px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🌅</div>
          <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '12px' }}>Backend is Waking up</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '16px' }}>Wait for sometime...</p>
        </div>
      )}


      {backendStatus === 'ready' && (
        <>
          <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '32px'
      }}>
        <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '24px' }}>Case Intake</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Jurisdiction</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            {['India', 'UK', 'UAE'].map(jurisdiction => (
              <button
                key={jurisdiction}
                type="button"
                onClick={() => setSelectedJurisdiction(jurisdiction)}
                style={{
                  padding: '10px 20px',
                  border: selectedJurisdiction === jurisdiction ? '2px solid #3b82f6' : '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  background: selectedJurisdiction === jurisdiction ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {jurisdiction}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter case facts, circumstances, and relief sought..."
            style={{
              width: '100%',
              minHeight: '150px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              resize: 'vertical',
              marginBottom: '16px'
            }}
          />
          <button
            type="submit"
            disabled={isSubmitting || !query.trim()}
            style={{
              padding: '12px 32px',
              background: isSubmitting || !query.trim() ? 'rgba(59, 130, 246, 0.5)' : '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isSubmitting || !query.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? 'Processing Decision...' : 'Generate Legal Decision'}
          </button>
        </form>
      </div>

      {response && (
        <div style={{ 
          marginTop: '25px', 
          padding: '32px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px'
        }}>
          <h3 style={{
            fontSize: '24px',
            color: '#fff',
            marginBottom: '24px',
            borderBottom: '2px solid rgba(59, 130, 246, 0.5)',
            paddingBottom: '12px'
          }}>
            📋 Legal Decision Document
          </h3>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              padding: '16px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px'
            }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>Jurisdiction</div>
              <div style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>
                {response.jurisdiction_detected || response.jurisdiction}
              </div>
            </div>
            <div style={{
              padding: '16px',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '12px'
            }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>Domain</div>
              <div style={{ color: '#fff', fontSize: '18px', fontWeight: '600', textTransform: 'capitalize' }}>
                {response.domain}
              </div>
            </div>
            <div style={{
              padding: '16px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px'
            }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>Overall Confidence</div>
              <div style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>
                {Math.round((response.confidence?.overall || 0) * 100)}%
              </div>
            </div>
          </div>

          {response.recommendation?.type && (
            <div style={{ marginBottom: '24px' }} data-testid="recommendation-status">
              <h5 style={{
                color: response.recommendation.type === 'INFORM' ? '#10b981' :
                      response.recommendation.type === 'REVIEW' ? '#f59e0b' :
                      response.recommendation.type === 'ESCALATE' ? '#f97316' : '#6c757d',
                fontSize: '16px',
                marginBottom: '12px',
                fontWeight: '600'
              }}>
                ℹ️ Advisory Recommendation
              </h5>
              <div style={{
                padding: '20px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '2px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '8px'
              }}>
                <div
                  data-testid="recommendation-type"
                  style={{
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: '700',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {response.recommendation.type}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                  {response.recommendation.rationale || 'Advisory recommendation — not a binding decision'}
                </div>
              </div>
            </div>
          )}

          {response.reasoning_trace?.legal_analysis && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ 
                color: '#fff', 
                fontSize: '18px', 
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📋 Legal Analysis
              </h4>
              <div style={{
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px'
              }}>
                <pre style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
                  lineHeight: '1.8',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  fontFamily: 'inherit'
                }}>
                  {response.reasoning_trace.legal_analysis}
                </pre>
              </div>

              {response.reasoning_trace?.remedies && response.reasoning_trace.remedies.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h5 style={{ 
                    color: '#10b981', 
                    fontSize: '16px', 
                    marginBottom: '12px',
                    fontWeight: '600'
                  }}>
                    💊 Available Remedies
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {response.reasoning_trace.remedies.map((remedy, idx) => (
                      <div key={idx} style={{
                        padding: '16px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        display: 'flex',
                        gap: '12px'
                      }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: '700',
                          color: '#fff',
                          flexShrink: 0
                        }}>
                          {idx + 1}
                        </div>
                        <div style={{ 
                          color: 'rgba(255, 255, 255, 0.9)', 
                          fontSize: '14px', 
                          lineHeight: '1.6',
                          flex: 1
                        }}>
                          {remedy}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {response.statutes && response.statutes.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ 
                color: '#fff', 
                fontSize: '18px', 
                marginBottom: '12px'
              }}>
                ⚖️ Applicable Statutes ({response.statutes.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {response.statutes.map((statute, idx) => (
                  <div key={idx} style={{
                    padding: '16px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ color: '#f59e0b', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                      Section {statute.section} - {statute.act} {statute.year > 0 ? `(${statute.year})` : ''}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', lineHeight: '1.6' }}>
                      {statute.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {response.reasoning_trace?.procedural_steps && response.reasoning_trace.procedural_steps.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ 
                color: '#fff', 
                fontSize: '18px', 
                marginBottom: '12px'
              }}>
                📝 Procedural Steps
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {response.reasoning_trace.procedural_steps.map((step, idx) => (
                  <div key={idx} style={{
                    padding: '16px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#fff',
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', textTransform: 'capitalize' }}>
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* User-Friendly Toggle for Developer/Technical Details */}
          <div style={{ marginTop: '20px', marginBottom: '20px', textAlign: 'center' }}>
            <button 
              onClick={() => setShowTechDetails(!showTechDetails)}
              style={{
                padding: '8px 18px',
                background: showTechDetails ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '20px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {showTechDetails ? '🙈 Hide Developer Details' : '🛠️ Show Developer / Pipeline Details'}
            </button>
          </div>

          {showTechDetails && (
            <div style={{
              padding: '20px',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px dashed rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
          {response.legal_route && response.legal_route.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ 
                color: '#fff', 
                fontSize: '18px', 
                marginBottom: '12px'
              }}>
                🔄 Processing Route
              </h4>
              <div style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                alignItems: 'center'
              }}>
                {response.legal_route.map((agent, idx) => (
                  <React.Fragment key={idx}>
                    <span style={{
                      padding: '6px 12px',
                      background: 'rgba(139, 92, 246, 0.2)',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      borderRadius: '6px',
                      color: '#a78bfa',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {agent.replace(/_/g, ' ')}
                    </span>
                    {idx < response.legal_route.length - 1 && (
                      <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {response.confidence && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ 
                color: '#fff', 
                fontSize: '18px', 
                marginBottom: '12px'
              }}>
                📊 Confidence Breakdown
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                {Object.entries(response.confidence).map(([key, value]) => (
                  <div key={key} style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '11px', marginBottom: '4px', textTransform: 'capitalize' }}>
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>
                      {Math.round(value * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>Trace ID: </span>
            <span data-testid="trace-id" style={{ color: '#fff', fontSize: '13px', fontFamily: 'monospace' }}>{traceId}</span>
          </div>

          </div>
          )}

          <FeedbackButtons traceId={traceId} context="Legal Query Response" />
        </div>
      )}
        </>
      )}
    </>
  )
}

export default LegalQueryCard
