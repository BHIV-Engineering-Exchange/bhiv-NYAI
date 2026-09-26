import React from 'react'
import { AlertTriangle } from 'lucide-react'
import GlassCard from './ui/GlassCard.jsx'
import BHIVButton from './ui/BHIVButton.jsx'
import StatusBadge from './ui/StatusBadge.jsx'
import DeveloperDetails from './ui/DeveloperDetails.jsx'

const ApiErrorState = ({ title, message, traceId, onRetry }) => (
  <GlassCard
    variant="secondary"
    className="error-message"
    data-testid="error-message"
    style={{
      padding: 'var(--space-6)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
      background: 'rgba(239, 68, 68, 0.05)',
      maxWidth: '650px',
      margin: '0 auto',
      width: '100%',
      textAlign: 'center'
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-3)', color: '#ef4444' }}>
      <AlertTriangle size={36} />
    </div>
    
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-2)' }}>
      <StatusBadge variant="error" size="sm">
        {title || 'Service Unavailable'}
      </StatusBadge>
    </div>

    <h3 style={{
      fontFamily: 'var(--font-family-heading)',
      fontSize: 'var(--text-lg)',
      fontWeight: 'var(--font-semibold)',
      color: 'var(--color-text)',
      margin: 'var(--space-2) 0'
    }}>
      {title || 'Request Processing Failed'}
    </h3>

    <p style={{
      color: 'var(--color-text-secondary)',
      fontSize: 'var(--text-sm)',
      lineHeight: 'var(--line-height-normal)',
      margin: '0 0 var(--space-4) 0'
    }}>
      {message || 'The backend returned an incomplete or invalid response. Please try again.'}
    </p>

    {traceId && (
      <div style={{ marginBottom: 'var(--space-4)', textAlign: 'left' }}>
        <DeveloperDetails title="Error Diagnostic Metadata" defaultOpen={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Trace / Reference ID:</span>
            <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>
              {traceId}
            </span>
          </div>
        </DeveloperDetails>
      </div>
    )}

    <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
      {onRetry && (
        <BHIVButton variant="primary" size="sm" onClick={onRetry}>
          Try Again
        </BHIVButton>
      )}
      {traceId && (
        <BHIVButton
          variant="outline"
          size="sm"
          onClick={() => {
            const subject = encodeURIComponent(`NYAI Error Report — Trace ${traceId}`)
            const body = encodeURIComponent(`Reference ID: ${traceId}\nError Message: ${message}\n\nPlease review system diagnostics.`)
            window.open(`mailto:support@nyaya.ai?subject=${subject}&body=${body}`)
          }}
        >
          Report Diagnostic
        </BHIVButton>
      )}
    </div>
  </GlassCard>
)

export default ApiErrorState
