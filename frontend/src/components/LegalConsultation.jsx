import { useState } from 'react'
import { Paperclip, CheckCircle } from 'lucide-react'
import { legalQueryService } from '../services/nyayaApi'

const legalIssueTypes = [
  'Employment Law',
  'Family Law',
  'Property Dispute',
  'Consumer Complaint',
  'Criminal Matter',
  'Corporate / Compliance',
  'Other'
]

const countries = ['India', 'United Kingdom', 'United Arab Emirates']
const jurisdictionMap = {
  'India': 'India',
  'United Kingdom': 'UK',
  'United Arab Emirates': 'UAE'
}
const states = {
  'India': ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'West Bengal', 'Rajasthan', 'Uttar Pradesh'],
  'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  'United Arab Emirates': ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Fujairah', 'Ras Al Khaimah', 'Umm Al Quwain']
}

export default function LegalConsultation({ onBack }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [backendResponse, setBackendResponse] = useState(null)
  const [formData, setFormData] = useState({
    issueType: '',
    description: '',
    files: [],
    country: '',
    state: ''
  })

  const handleNext = async () => {
    if (step === 4 && canProceed()) {
      setLoading(true)
      setError(null)
      
      try {
        const jurisdiction = jurisdictionMap[formData.country] || 'India'
        
        // Log the payload for debugging
        console.log('Submitting payload:', {
          query: formData.description,
          jurisdiction_hint: jurisdiction,
          user_context: {
            role: 'citizen',
            confidence_required: true
          }
        })
        
        const result = await legalQueryService.submitQuery({
          query: formData.description,
          jurisdiction_hint: jurisdiction
        })
        
        if (result.success) {
          setBackendResponse(result.data)
          setStep(5)
        } else {
          // Show error to user - NO mock data allowed
          console.error('Backend error:', result.error)
          setError(result.error || 'Failed to get response from backend. Please try again.')
        }
      } catch (err) {
        // Show error to user - NO mock data allowed
        console.error('Exception occurred:', err.message)
        setError(err.message || 'Failed to connect to backend. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const canProceed = () => {
    switch (step) {
      case 1: return formData.issueType !== ''
      case 2: return formData.description.trim() !== ''
      case 3: return true
      case 4: return formData.country !== '' && formData.state !== ''
      default: return false
    }
  }

  const handleFileUpload = (e) => {
    setFormData({ ...formData, files: Array.from(e.target.files) })
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.5s ease-in' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <button onClick={onBack} style={{
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        padding: '10px 20px',
        color: '#fff',
        cursor: 'pointer',
        marginBottom: '20px',
        fontSize: '14px'
      }}>
        ← Back to Dashboard
      </button>

      {/* Progress Indicator */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '32px',
        justifyContent: 'center'
      }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            width: i === step ? '40px' : '12px',
            height: '12px',
            borderRadius: '6px',
            background: i <= step ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255, 255, 255, 0.2)',
            transition: 'all 0.3s ease'
          }} />
        ))}
      </div>

      {/* Main Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '40px',
        minHeight: '400px'
      }}>
        {/* Step 1 */}
        {step === 1 && (
          <div>
            <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '8px', fontFamily: 'Merriweather, serif' }}>Select Legal Issue Type</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '32px', fontSize: '14px' }}>Choose the category that best describes your legal concern</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {legalIssueTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setFormData({ ...formData, issueType: type })}
                  style={{
                    background: formData.issueType === type ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${formData.issueType === type ? '#667eea' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '12px',
                    padding: '16px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '8px', fontFamily: 'Merriweather, serif' }}>Describe Your Situation</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '32px', fontSize: '14px' }}>Provide details about your legal concern</p>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Briefly describe your legal concern or issue"
              style={{
                width: '100%',
                minHeight: '200px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                color: '#fff',
                fontSize: '14px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                resize: 'vertical'
              }}
            />
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '8px', fontFamily: 'Merriweather, serif' }}>Upload Supporting Documents</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '32px', fontSize: '14px' }}>Upload contracts, notices, agreements, etc. (Optional)</p>
            <label style={{
              display: 'block',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '2px dashed rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '48px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                {formData.files.length > 0 ? (
                  <div>
                    <div style={{ color: '#10b981', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <CheckCircle size={16} />
                      <span>{formData.files.length} file(s) selected</span>
                    </div>
                    {formData.files.map((f, i) => (
                      <div key={i} style={{ fontSize: '12px', marginTop: '4px' }}>{f.name}</div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                      <Paperclip size={32} color="var(--bhiv-primary-hover, #818cf8)" />
                    </div>
                    <div>Click to upload or drag and drop</div>
                    <div style={{ fontSize: '12px', marginTop: '8px' }}>PDF, DOCX, or Images</div>
                  </>
                )}
              </div>
            </label>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div>
            <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '8px', fontFamily: 'Merriweather, serif' }}>Select Jurisdiction</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '32px', fontSize: '14px' }}>Choose your country and state/region</p>
            
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <div style={{ color: '#ef4444', fontSize: '14px' }}>
                  <strong>Error:</strong> {error}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ color: '#fff', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Country</label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value, state: '' })}
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '16px',
                    color: '#fff',
                    fontSize: '14px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1
                  }}
                >
                  <option value="" style={{ background: '#1a1a1a', color: '#fff' }}>Select Country</option>
                  {countries.map(c => <option key={c} value={c} style={{ background: '#1a1a1a', color: '#fff' }}>{c}</option>)}
                </select>
              </div>
              {formData.country && (
                <div>
                  <label style={{ color: '#fff', fontSize: '14px', marginBottom: '8px', display: 'block' }}>State / Region</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    disabled={loading}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '16px',
                      color: '#fff',
                      fontSize: '14px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1
                    }}
                  >
                    <option value="" style={{ background: '#1a1a1a', color: '#fff' }}>Select State / Region</option>
                    {states[formData.country]?.map(s => <option key={s} value={s} style={{ background: '#1a1a1a', color: '#fff' }}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5 - Analysis Summary */}
        {step === 5 && (
          <div>
            <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '32px', fontFamily: 'Merriweather, serif' }}>AI Analysis Summary</h2>
            
            {!backendResponse ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Information will appear here once available
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Basic Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>Identified Legal Issue</div>
                    <div style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>{formData.issueType}</div>
                  </div>
                  
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>Jurisdiction</div>
                    <div style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>{backendResponse.jurisdiction || formData.country}</div>
                  </div>
                  
                  {backendResponse.confidence !== undefined && (
                    <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '20px' }}>
                      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>Confidence Score</div>
                      <div style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>{(backendResponse.confidence * 100).toFixed(0)}%</div>
                    </div>
                  )}
                </div>

                {/* Legal Procedure */}
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '24px' }}>
                  <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '16px', fontFamily: 'Merriweather, serif' }}>Recommended Legal Procedure</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', marginTop: '6px', flexShrink: 0 }} />
                      <div>
                        <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>Initial Consultation</div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>Consult with a licensed attorney specializing in {formData.issueType}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6', marginTop: '6px', flexShrink: 0 }} />
                      <div>
                        <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>Document Preparation</div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>Gather all relevant evidence and supporting documents</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', marginTop: '6px', flexShrink: 0 }} />
                      <div>
                        <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>Legal Filing</div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>File appropriate legal documents with relevant authority</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', marginTop: '6px', flexShrink: 0 }} />
                      <div>
                        <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>Resolution</div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>Proceed through mediation, arbitration, or litigation as appropriate</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '24px' }}>
                  <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '16px', fontFamily: 'Merriweather, serif' }}>Estimated Timeline</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>Initial Phase</div>
                      <div style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>1-2 weeks</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>Preparation</div>
                      <div style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>2-4 weeks</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>Legal Process</div>
                      <div style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>3-6 months</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>Resolution</div>
                      <div style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>6-12 months</div>
                    </div>
                  </div>
                </div>

                {/* Legal Glossary */}
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '24px' }}>
                  <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '16px', fontFamily: 'Merriweather, serif' }}>Key Legal Terms</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Jurisdiction</div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', lineHeight: '1.6' }}>The official power to make legal decisions and judgments. In this case, {formData.state}, {formData.country}.</div>
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Legal Standing</div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', lineHeight: '1.6' }}>The right to bring a lawsuit or legal action. You must demonstrate direct harm or interest in the matter.</div>
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Statute of Limitations</div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', lineHeight: '1.6' }}>The time limit within which legal action must be initiated. Varies by case type and jurisdiction.</div>
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Due Process</div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', lineHeight: '1.6' }}>Fair treatment through the normal judicial system, ensuring all legal rights are respected.</div>
                    </div>
                  </div>
                </div>

                {backendResponse.constitutional_articles && backendResponse.constitutional_articles.length > 0 && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '8px' }}>Constitutional References</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {backendResponse.constitutional_articles.map((article, idx) => (
                        <span key={idx} style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '6px',
                          padding: '4px 12px',
                          color: '#3b82f6',
                          fontSize: '12px'
                        }}>
                          {article}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {backendResponse.trace_id && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>Trace ID</div>
                    <div style={{ color: '#fff', fontSize: '12px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{backendResponse.trace_id}</div>
                  </div>
                )}
                
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginTop: '12px'
                }}>
                  <div style={{ color: '#ef4444', fontSize: '12px', lineHeight: '1.6' }}>
                    <strong>Disclaimer:</strong> This AI-assisted analysis is for informational purposes only and should not replace advice from a licensed attorney.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '40px', justifyContent: 'space-between' }}>
          {step > 1 && step < 5 && (
            <button onClick={handleBack} disabled={loading} style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '12px 24px',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: loading ? 0.5 : 1
            }}>
              Back
            </button>
          )}
          {step < 5 && (
            <button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              style={{
                background: (canProceed() && !loading) ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                color: '#fff',
                cursor: (canProceed() && !loading) ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                marginLeft: 'auto',
                opacity: (canProceed() && !loading) ? 1 : 0.5
              }}
            >
              {loading ? 'Processing...' : (step === 4 ? 'Submit' : 'Next')}
            </button>
          )}
          {step === 5 && (
            <button onClick={onBack} style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              marginLeft: 'auto'
            }}>
              Return to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
