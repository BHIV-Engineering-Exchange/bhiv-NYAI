import React, { useState } from 'react'
import { legalQueryService } from '../services/nyayaApi.js'
import GlassCard from './ui/GlassCard.jsx'
import BHIVButton from './ui/BHIVButton.jsx'
import StatusBadge from './ui/StatusBadge.jsx'
import DeveloperDetails from './ui/DeveloperDetails.jsx'
import WorkspaceHeader from './layout/WorkspaceHeader.jsx'

const EVIDENCE_REQUIREMENTS = {
  personal_injury: [
    { item: 'Medical records and treatment history', required: true },
    { item: 'Hospital bills and expense receipts', required: true },
    { item: 'Police incident report (FIR)', required: true },
    { item: "Doctor's fitness certificate", required: false },
    { item: 'Witness statements', required: false },
    { item: 'Photographs of injuries', required: false },
    { item: 'Employment records for loss of income', required: false }
  ],
  contract_dispute: [
    { item: 'Signed contract agreement', required: true },
    { item: 'Correspondence records', required: true },
    { item: 'Payment receipts/invoices', required: true },
    { item: 'Breach notification letters', required: false },
    { item: 'Expert assessment of damages', required: false }
  ],
  property_dispute: [
    { item: 'Property title deeds', required: true },
    { item: 'Survey records', required: true },
    { item: 'Property tax receipts', required: true },
    { item: 'Encumbrance certificate', required: false },
    { item: 'Mutation records', required: false }
  ],
  criminal: [
    { item: 'First Information Report (FIR)', required: true },
    { item: 'Chargesheet', required: true },
    { item: 'Witness depositions', required: true },
    { item: 'Forensic laboratory reports', required: false },
    { item: 'Case diary notes', required: false }
  ],
  family: [
    { item: 'Marriage certificate', required: true },
    { item: 'Birth certificates of children', required: false },
    { item: 'Income proof documents', required: true },
    { item: 'Property valuation documents', required: false }
  ],
  default: [
    { item: 'Identity proof of parties', required: true },
    { item: 'Address proof', required: true },
    { item: 'Relevant supporting documents', required: true }
  ]
}

const PROCEDURAL_TIMELINES = {
  India: {
    civil: {
      simple: [
        { stage: 'Filing of Plaint', deadline: 'Day 0', duration: null },
        { stage: 'Service of Summons', deadline: '7 days', duration: 7 },
        { stage: 'Written Statement', deadline: '30 days', duration: 30 },
        { stage: 'Replication', deadline: '15 days', duration: 15 },
        { stage: 'Framing of Issues', deadline: '7 days', duration: 7 },
        { stage: 'Evidence (Plaintiff)', deadline: '30 days', duration: 30 },
        { stage: 'Evidence (Defendant)', deadline: '30 days', duration: 30 },
        { stage: 'Final Arguments', deadline: '15 days', duration: 15 },
        { stage: 'Judgment', deadline: '30 days', duration: 30 }
      ],
      complex: [
        { stage: 'Filing of Plaint', deadline: 'Day 0', duration: null },
        { stage: 'Service of Summons', deadline: '14 days', duration: 14 },
        { stage: 'Written Statement', deadline: '60 days', duration: 60 },
        { stage: 'Replication', deadline: '30 days', duration: 30 },
        { stage: 'Framing of Issues', deadline: '14 days', duration: 14 },
        { stage: 'Discovery & Interrogatories', deadline: '60 days', duration: 60 },
        { stage: 'Evidence (Plaintiff)', deadline: '60 days', duration: 60 },
        { stage: 'Evidence (Defendant)', deadline: '60 days', duration: 60 },
        { stage: 'Cross-Examination', deadline: '30 days', duration: 30 },
        { stage: 'Final Arguments', deadline: '30 days', duration: 30 },
        { stage: 'Judgment', deadline: '60 days', duration: 60 }
      ]
    },
    criminal: {
      summary: [
        { stage: 'FIR Registration', deadline: 'Day 0', duration: null },
        { stage: 'Investigation Completion', deadline: '60 days', duration: 60 },
        { stage: 'Chargesheet Filing', deadline: '90 days', duration: 90 },
        { stage: 'Framing of Charges', deadline: '14 days', duration: 14 },
        { stage: 'Evidence Stage', deadline: '30 days', duration: 30 },
        { stage: 'Arguments', deadline: '14 days', duration: 14 },
        { stage: 'Judgment', deadline: '30 days', duration: 30 }
      ],
      cognizable: [
        { stage: 'FIR Registration', deadline: 'Day 0', duration: null },
        { stage: 'Investigation', deadline: '90 days', duration: 90 },
        { stage: 'Chargesheet/Closure Report', deadline: '180 days', duration: 180 },
        { stage: 'Commencement of Trial', deadline: '30 days', duration: 30 },
        { stage: 'Prosecution Evidence', deadline: '120 days', duration: 120 },
        { stage: 'Defense Evidence', deadline: '60 days', duration: 60 },
        { stage: 'Final Arguments', deadline: '30 days', duration: 30 },
        { stage: 'Judgment', deadline: '60 days', duration: 60 }
      ]
    }
  },
  UK: {
    civil: {
      small_claims: [
        { stage: 'Issue Claim Form', deadline: 'Day 0', duration: null },
        { stage: 'Response (Admission/Defence)', deadline: '14 days', duration: 14 },
        { stage: 'Directions Questionnaire', deadline: '14 days', duration: 14 },
        { stage: 'Listing for Hearing', deadline: '30 days', duration: 30 },
        { stage: 'Hearing', deadline: 'Variable', duration: null }
      ],
      fast_track: [
        { stage: 'Issue Claim Form', deadline: 'Day 0', duration: null },
        { stage: 'Acknowledgment of Service', deadline: '14 days', duration: 14 },
        { stage: 'Defence', deadline: '28 days', duration: 28 },
        { stage: 'Case Management Conference', deadline: '14 days', duration: 14 },
        { stage: 'Disclosure', deadline: '14 days', duration: 14 },
        { stage: 'Exchange of Expert Reports', deadline: '28 days', duration: 28 },
        { stage: 'Trial', deadline: '30 weeks', duration: 210 }
      ]
    }
  },
  UAE: {
    civil: {
      summary: [
        { stage: 'Filing of Claim', deadline: 'Day 0', duration: null },
        { stage: 'Service of Claim', deadline: '7 days', duration: 7 },
        { stage: 'Response', deadline: '15 days', duration: 15 },
        { stage: 'Judgment', deadline: '30 days', duration: 30 }
      ],
      ordinary: [
        { stage: 'Filing of Claim', deadline: 'Day 0', duration: null },
        { stage: 'Service of Claim', deadline: '14 days', duration: 14 },
        { stage: 'Written Response', deadline: '30 days', duration: 30 },
        { stage: 'Reply/Rejoinder', deadline: '15 days', duration: 15 },
        { stage: 'First Hearing', deadline: '30 days', duration: 30 },
        { stage: 'Evidentiary Stage', deadline: '60 days', duration: 60 },
        { stage: 'Judgment', deadline: '30 days', duration: 30 }
      ]
    }
  }
}

const classifyCaseType = (description, domainHint) => {
  const desc = (description + ' ' + (domainHint || '')).toLowerCase()
  
  if (desc.includes('injury') || desc.includes('accident') || desc.includes('damage') || desc.includes('compensation')) {
    return 'personal_injury'
  }
  if (desc.includes('contract') || desc.includes('agreement') || desc.includes('breach') || desc.includes('violation')) {
    return 'contract_dispute'
  }
  if (desc.includes('property') || desc.includes('land') || desc.includes('boundary') || desc.includes('possession') || desc.includes('title')) {
    return 'property_dispute'
  }
  if (desc.includes('criminal') || desc.includes('fraud') || desc.includes('theft') || desc.includes('assault') || desc.includes('fir')) {
    return 'criminal'
  }
  if (desc.includes('divorce') || desc.includes('custody') || desc.includes('maintenance') || desc.includes('marriage')) {
    return 'family'
  }
  
  return domainHint?.toLowerCase() || 'default'
}

const getEvidenceRequirements = (caseType) => {
  return EVIDENCE_REQUIREMENTS[caseType] || EVIDENCE_REQUIREMENTS.default
}

const getProceduralTimeline = (jurisdiction, caseType, complexity = 'simple') => {
  const jurisdictionData = PROCEDURAL_TIMELINES[jurisdiction]
  if (!jurisdictionData) {
    return PROCEDURAL_TIMELINES.India.civil.simple
  }
  
  const category = caseType === 'criminal' ? 'criminal' : 'civil'
  const complexityKey = complexity === 'complex' ? 'complex' : 
                        complexity === 'summary' ? 'summary' : 
                        complexity === 'cognizable' ? 'cognizable' :
                        complexity === 'fast_track' ? 'fast_track' :
                        complexity === 'small_claims' ? 'small_claims' : 'simple'
  
  return jurisdictionData[category]?.[complexityKey] || PROCEDURAL_TIMELINES.India.civil.simple
}

const calculateTimeline = (baseDate, timeline) => {
  let currentDate = new Date(baseDate)
  
  return timeline.map((item, index) => {
    const milestone = { ...item }
    
    if (item.duration) {
      currentDate = new Date(currentDate.getTime() + item.duration * 24 * 60 * 60 * 1000)
      milestone.estimatedDate = currentDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } else {
      milestone.estimatedDate = 'Immediate'
    }
    
    milestone.milestone = index + 1
    return milestone
  })
}

const LegalDecisionDocument = ({ onResponseReceived, onNavigateHome }) => {
  const [intakeData, setIntakeData] = useState({
    caseDescription: '',
    jurisdiction: 'India',
    parties: { plaintiff: '', defendant: '' },
    caseType: '',
    dateOfIncident: ''
  })
  const [decision, setDecision] = useState(null)
  const [loading, setLoading] = useState(false)
  const [traceId, setTraceId] = useState(null)
  const [error, setError] = useState(null)
  const [currentStep, setCurrentStep] = useState(1)

  const handleIntakeChange = (field, value) => {
    setIntakeData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePartyChange = (party, value) => {
    setIntakeData(prev => ({
      ...prev,
      parties: { ...prev.parties, [party]: value }
    }))
  }

  const handleGenerateDecision = async () => {
    if (!intakeData.caseDescription.trim()) {
      setError('Case description is required for generating decision')
      return
    }

    setLoading(true)
    setError(null)
    setCurrentStep(2)

    try {
      const result = await legalQueryService.submitQuery({
        query: intakeData.caseDescription,
        jurisdiction_hint: intakeData.jurisdiction,
        domain_hint: intakeData.caseType
      })

      if (result.success) {
        setTraceId(result.trace_id)
        setDecision(result.data)
        setCurrentStep(3)
        if (onResponseReceived) {
          onResponseReceived(result.data)
        }
      } else {
        setError(result.error || 'Failed to generate decision')
        setCurrentStep(1)
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to backend')
      setCurrentStep(1)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setIntakeData({
      caseDescription: '',
      jurisdiction: 'India',
      parties: { plaintiff: '', defendant: '' },
      caseType: '',
      dateOfIncident: ''
    })
    setDecision(null)
    setTraceId(null)
    setError(null)
    setCurrentStep(1)
  }

  const getRecommendationBadgeVariant = (type) => {
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
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Contextual Workspace Header */}
      <WorkspaceHeader
        breadcrumbs={[
          { label: 'NYAI', onClick: onNavigateHome },
          { label: 'Legal Operations' },
          { label: 'Decision Draft' }
        ]}
        title="Legal Decision Document Drafter"
        description="Generate formal, multi-statutory legal determination documents and evidence registers."
        badge="DOCUMENT DRAFTER"
        onBack={onNavigateHome}
      />

      {/* Case Intake Form */}
      <GlassCard variant="primary" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--color-primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-bold)'
          }}>
            0
          </span>
          <h3 style={{
            fontFamily: 'var(--font-family-heading)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--color-text)',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Formal Case Intake
          </h3>
        </div>

        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', display: 'block', marginBottom: 'var(--space-1)', textTransform: 'uppercase' }}>
              Jurisdiction
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {['India', 'UK', 'UAE'].map((jur) => (
                <button
                  key={jur}
                  type="button"
                  onClick={() => handleIntakeChange('jurisdiction', jur)}
                  disabled={loading || currentStep > 1}
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    background: intakeData.jurisdiction === jur ? 'var(--color-primary-transparent)' : 'var(--color-surface-subtle)',
                    border: `1px solid ${intakeData.jurisdiction === jur ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    color: intakeData.jurisdiction === jur ? 'var(--color-text)' : 'var(--color-text-secondary)',
                    fontWeight: 'var(--font-medium)',
                    fontSize: 'var(--text-sm)',
                    cursor: loading || currentStep > 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {jur}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', display: 'block', marginBottom: 'var(--space-1)', textTransform: 'uppercase' }}>
                Plaintiff / Applicant
              </label>
              <input
                type="text"
                value={intakeData.parties.plaintiff}
                onChange={(e) => handlePartyChange('plaintiff', e.target.value)}
                placeholder="Enter plaintiff name"
                disabled={loading || currentStep > 1}
                style={{
                  width: '100%',
                  padding: 'var(--space-2) var(--space-3)',
                  background: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text)',
                  fontSize: 'var(--text-sm)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', display: 'block', marginBottom: 'var(--space-1)', textTransform: 'uppercase' }}>
                Defendant / Respondent
              </label>
              <input
                type="text"
                value={intakeData.parties.defendant}
                onChange={(e) => handlePartyChange('defendant', e.target.value)}
                placeholder="Enter defendant name"
                disabled={loading || currentStep > 1}
                style={{
                  width: '100%',
                  padding: 'var(--space-2) var(--space-3)',
                  background: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text)',
                  fontSize: 'var(--text-sm)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)', display: 'block', marginBottom: 'var(--space-1)', textTransform: 'uppercase' }}>
              Case Facts & Circumstances
            </label>
            <textarea
              value={intakeData.caseDescription}
              onChange={(e) => handleIntakeChange('caseDescription', e.target.value)}
              placeholder="Describe the full case facts, transaction, breach or incident, and relief sought..."
              disabled={loading || currentStep > 1}
              rows={5}
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                background: 'var(--color-bg-base)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text)',
                fontSize: 'var(--text-sm)',
                lineHeight: 'var(--line-height-normal)',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {currentStep === 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <BHIVButton
                variant="primary"
                onClick={handleGenerateDecision}
                disabled={loading || !intakeData.caseDescription.trim()}
                loading={loading}
              >
                {loading ? 'Generating Decision...' : 'Generate Legal Decision'}
              </BHIVButton>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Error Presentation */}
      {error && (
        <GlassCard
          variant="secondary"
          style={{
            borderColor: 'var(--color-error)',
            background: 'rgba(239, 68, 68, 0.08)',
            padding: 'var(--space-4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <StatusBadge variant="error">ERROR</StatusBadge>
            <span style={{ color: 'var(--color-text)', fontSize: 'var(--text-sm)' }}>
              {error}
            </span>
          </div>
        </GlassCard>
      )}

      {/* Decision Document Results */}
      {decision && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Header Banner */}
          <GlassCard variant="primary" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-primary-light)', textTransform: 'uppercase' }}>
                  Advisory Recommendation
                </span>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-text)', marginTop: '2px' }}>
                  {decision.recommendation?.type || 'INFORM'}
                </div>
              </div>
              <StatusBadge variant={getRecommendationBadgeVariant(decision.recommendation?.type)} size="md">
                {decision.recommendation?.type || 'INFORM'}
              </StatusBadge>
            </div>
          </GlassCard>

          {/* Section I: Case Header */}
          <GlassCard variant="secondary" style={{ padding: 'var(--space-5)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
              SECTION I — Case Header
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
              <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Jurisdiction</span>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)', marginTop: '2px' }}>
                  {decision.jurisdiction_detected || decision.jurisdiction || intakeData.jurisdiction}
                </div>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Domain</span>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)', textTransform: 'capitalize', marginTop: '2px' }}>
                  {decision.domain || 'Civil'}
                </div>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Date</span>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)', marginTop: '2px' }}>
                  {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Section II: Findings of Fact */}
          <GlassCard variant="secondary" style={{ padding: 'var(--space-5)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
              SECTION II — Findings of Fact
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {(intakeData.parties.plaintiff || intakeData.parties.defendant) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Plaintiff:</span>
                    <p style={{ margin: '2px 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{intakeData.parties.plaintiff || 'Not specified'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Defendant:</span>
                    <p style={{ margin: '2px 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{intakeData.parties.defendant || 'Not specified'}</p>
                  </div>
                </div>
              )}
              <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-primary)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Facts Stated:</span>
                <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: '1.6' }}>
                  {intakeData.caseDescription}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Section III: Analysis & Reasoning */}
          <GlassCard variant="secondary" style={{ padding: 'var(--space-5)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
              SECTION III — Analysis & Reasoning
            </h4>
            <pre style={{
              margin: 0,
              padding: 'var(--space-4)',
              background: 'var(--color-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-sm)',
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'inherit'
            }}>
              {decision.reasoning_trace?.legal_analysis || 'No legal analysis generated.'}
            </pre>
          </GlassCard>

          {/* Evidence Requirements */}
          <GlassCard variant="secondary" style={{ padding: 'var(--space-5)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
              SECTION III-B — Evidence Requirements
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {getEvidenceRequirements(classifyCaseType(intakeData.caseDescription, intakeData.caseType)).map((evidence, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-2) var(--space-3)',
                  background: 'var(--color-surface-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)'
                }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                    {evidence.item}
                  </span>
                  <StatusBadge variant={evidence.required ? 'warning' : 'neutral'} size="sm">
                    {evidence.required ? 'Mandatory' : 'Optional'}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Procedural Timeline */}
          <GlassCard variant="secondary" style={{ padding: 'var(--space-5)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
              SECTION III-C — Procedural Timeline
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {calculateTimeline(new Date(), getProceduralTimeline(intakeData.jurisdiction, classifyCaseType(intakeData.caseDescription, intakeData.caseType))).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-text)' }}>{item.stage}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Deadline: {item.deadline}</div>
                  </div>
                  <StatusBadge variant="info" size="sm">
                    {item.estimatedDate}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Section IV: Conclusion & Order */}
          <GlassCard variant="primary" style={{ padding: 'var(--space-5)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
              SECTION IV — Conclusion & Order
            </h4>
            <div style={{
              padding: 'var(--space-4)',
              background: 'var(--color-surface-subtle)',
              borderLeft: '4px solid var(--color-primary)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--color-text)'
            }}>
              {decision.recommendation?.type === 'ESCALATE' ? 'ESCALATION ADVISED — FORMAL COUNSEL REQUIRED' :
               decision.recommendation?.type === 'REVIEW' ? 'FURTHER REVIEW RECOMMENDED BEFORE FILING' :
               decision.recommendation?.type === 'INSUFFICIENT_DATA' ? 'ADDITIONAL FACTUAL EVIDENCE NEEDED' :
               'INFORMATIONAL / PROCEED UNDER APPLICABLE PROCEDURE'}
            </div>
          </GlassCard>

          {/* Technical Details via DeveloperDetails */}
          <DeveloperDetails title="Document Technical Metadata" defaultOpen={false}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Trace ID:</span>
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>{traceId || 'N/A'}</span>
              </div>
              {decision.legal_route && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Route:</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-light)' }}>{decision.legal_route.join(' → ')}</span>
                </div>
              )}
            </div>
          </DeveloperDetails>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <BHIVButton variant="outline" onClick={handleReset}>
              Create New Case Intake
            </BHIVButton>
          </div>
        </div>
      )}
    </div>
  )
}

export default LegalDecisionDocument
