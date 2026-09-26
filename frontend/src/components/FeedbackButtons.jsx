import React, { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { legalQueryService } from '../services/nyayaApi.js'
import GlassCard from './ui/GlassCard.jsx'
import BHIVButton from './ui/BHIVButton.jsx'
import StatusBadge from './ui/StatusBadge.jsx'

// Validate that traceId is a valid non-empty string
const isValidTraceId = (traceId) => {
  return typeof traceId === 'string' && traceId.length > 0 && traceId.trim().length > 0
}

// Validate that feedback value is a boolean
const isValidFeedbackValue = (value) => {
  return typeof value === 'boolean'
}

const FeedbackButtons = ({ traceId, context = '' }) => {
  const [feedback, setFeedback] = useState({
    helpful: null,
    clear: null,
    matchesSituation: null
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const submitFeedback = async (type, value) => {
    if (!isValidTraceId(traceId)) {
      console.log('Skipping feedback submission - no valid trace ID')
      return
    }

    if (!isValidFeedbackValue(value)) {
      setError('Invalid feedback value')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      const rating = value ? 5 : 1
      
      const feedbackData = {
        trace_id: traceId,
        rating: rating,
        feedback_type: 'correctness',
        comment: `${type}: ${value ? 'positive' : 'negative'}${context ? ` | Context: ${context}` : ''}`
      }

      const result = await legalQueryService.submitFeedback(feedbackData)
      
      if (result.success) {
        setSubmitted(true)
      } else {
        setError(result.error || 'Failed to submit feedback')
      }
    } catch (err) {
      setError(err?.message || 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFeedback = (type, value) => {
    setFeedback(prev => ({ ...prev, [type]: value }))
    submitFeedback(type, value)
  }

  return (
    <GlassCard variant="secondary" className="feedback-card" style={{ padding: 'var(--space-5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <div>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Verification & Feedback
          </span>
          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-text)', marginTop: '2px' }}>
            Response Accuracy & Clarity
          </h4>
        </div>
        {submitted && (
          <StatusBadge variant="success" size="sm" pulse>
            Feedback Recorded
          </StatusBadge>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-3)' }}>
        {/* Was this helpful? */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-medium)' }}>
            Was this response helpful?
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <BHIVButton
              size="sm"
              variant={feedback.helpful === true ? 'primary' : 'outline'}
              onClick={() => handleFeedback('helpful', true)}
              disabled={submitting}
            >
              <ThumbsUp size={13} style={{ marginRight: '6px' }} />
              Helpful
            </BHIVButton>
            <BHIVButton
              size="sm"
              variant={feedback.helpful === false ? 'danger' : 'outline'}
              onClick={() => handleFeedback('helpful', false)}
              disabled={submitting}
            >
              <ThumbsDown size={13} style={{ marginRight: '6px' }} />
              Not Helpful
            </BHIVButton>
          </div>
        </div>

        {/* Was this clear? */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-medium)' }}>
            Was the analysis clear?
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <BHIVButton
              size="sm"
              variant={feedback.clear === true ? 'primary' : 'outline'}
              onClick={() => handleFeedback('clear', true)}
              disabled={submitting}
            >
              Clear
            </BHIVButton>
            <BHIVButton
              size="sm"
              variant={feedback.clear === false ? 'danger' : 'outline'}
              onClick={() => handleFeedback('clear', false)}
              disabled={submitting}
            >
              Unclear
            </BHIVButton>
          </div>
        </div>

        {/* Matched situation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-medium)' }}>
            Matched situation accurately?
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <BHIVButton
              size="sm"
              variant={feedback.matchesSituation === true ? 'primary' : 'outline'}
              onClick={() => handleFeedback('matchesSituation', true)}
              disabled={submitting}
            >
              Matched
            </BHIVButton>
            <BHIVButton
              size="sm"
              variant={feedback.matchesSituation === false ? 'danger' : 'outline'}
              onClick={() => handleFeedback('matchesSituation', false)}
              disabled={submitting}
            >
              Mismatched
            </BHIVButton>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          marginTop: 'var(--space-3)',
          padding: 'var(--space-2) var(--space-3)',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-error)',
          fontSize: 'var(--text-xs)'
        }}>
          {error}
        </div>
      )}
    </GlassCard>
  )
}

export default FeedbackButtons