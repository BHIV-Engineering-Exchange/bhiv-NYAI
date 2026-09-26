import React from 'react'
import { AlertTriangle } from 'lucide-react'
import GlassCard from './ui/GlassCard.jsx'
import BHIVButton from './ui/BHIVButton.jsx'
import StatusBadge from './ui/StatusBadge.jsx'
import DeveloperDetails from './ui/DeveloperDetails.jsx'

/**
 * SystemCrash - Full-page overlay for unhandled React errors
 * Displays trace_id, DeveloperDetails diagnostic, and "Return to Dashboard" action
 */
const SystemCrash = ({ traceId, errorMessage, onReturnToDashboard, onRetry }) => {
  const handleReturn = () => {
    if (onReturnToDashboard) {
      onReturnToDashboard()
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(11, 15, 25, 0.95)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 'var(--space-4)'
    }}>
      <div style={{ maxWidth: '580px', width: '100%' }}>
        <GlassCard
          variant="primary"
          style={{
            padding: 'var(--space-8)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            textAlign: 'center'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-3)', color: '#ef4444' }}>
            <AlertTriangle size={48} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-2)' }}>
            <StatusBadge variant="error" size="md">
              SYSTEM CRITICAL ERROR
            </StatusBadge>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-family-heading)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--color-text)',
            margin: 'var(--space-2) 0 var(--space-3) 0'
          }}>
            Operational Fault Detected
          </h2>

          <p style={{
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--text-sm)',
            lineHeight: 'var(--line-height-relaxed)',
            margin: '0 0 var(--space-5) 0'
          }}>
            {errorMessage || 'The application encountered an unexpected runtime exception in the component tree.'}
          </p>

          <div style={{ marginBottom: 'var(--space-6)', textAlign: 'left' }}>
            <DeveloperDetails title="Technical Diagnostic Data" defaultOpen={false}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {traceId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Trace ID:</span>
                    <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>{traceId}</span>
                  </div>
                )}
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  Check the browser developer console for the unhandled exception stack trace.
                </div>
              </div>
            </DeveloperDetails>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <BHIVButton
              variant="primary"
              size="md"
              onClick={handleReturn}
            >
              Return to Overview
            </BHIVButton>
            {onRetry && (
              <BHIVButton
                variant="outline"
                size="md"
                onClick={onRetry}
              >
                Recover Session
              </BHIVButton>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

/**
 * ErrorBoundary - React class component that catches JavaScript errors in child component tree
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught unhandled error:', error, errorInfo)
    this.setState({ errorInfo })
    this._reportError(error, errorInfo)
  }

  _reportError(error, errorInfo) {
    const traceId = window.__gravitas_active_trace_id || null
    const errorPayload = {
      message: error?.message || 'Unknown error',
      stack: error?.stack || '',
      componentStack: errorInfo?.componentStack || '',
      traceId,
      timestamp: new Date().toISOString(),
      userAgent: navigator?.userAgent || ''
    }
    console.error('Error payload for reporting:', errorPayload)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReturnToDashboard = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      const traceId = this.props.traceId || window.__gravitas_active_trace_id || null
      const errorMessage = this.state.error?.message || 'An unexpected error occurred'
      const { onReturnToDashboard, onRetry } = this.props

      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          traceId,
          onRetry: this.handleRetry,
          onReturnToDashboard: onReturnToDashboard || this.handleReturnToDashboard
        })
      }

      return (
        <SystemCrash
          traceId={traceId}
          errorMessage={errorMessage}
          onReturnToDashboard={onReturnToDashboard || this.handleReturnToDashboard}
          onRetry={onRetry || this.handleRetry}
        />
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
export { SystemCrash }
