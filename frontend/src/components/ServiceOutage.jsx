// ServiceOutage.jsx — UI displayed when backend is down (5xx / ECONNREFUSED)
// Routes users here via global interceptor when backend is unreachable.
import React from 'react'
import { ShieldAlert } from 'lucide-react'

const ServiceOutage = ({ traceId, onReturnToDashboard }) => {
  const handleReturn = () => {
    if (onReturnToDashboard) {
      onReturnToDashboard()
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px 20px',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'rgba(220, 53, 69, 0.1)',
        border: '1px solid rgba(220, 53, 69, 0.3)',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%'
      }}>
        {/* Service Icon */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <ShieldAlert size={48} color="#ef4444" />
        </div>

        {/* Title */}
        <h2 style={{
          color: '#dc3545',
          marginBottom: '16px',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          Service Temporarily Unavailable
        </h2>

        {/* Description */}
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '15px',
          lineHeight: '1.6',
          marginBottom: '24px'
        }}>
          We're experiencing technical difficulties connecting to our legal decision service.
          Your session has been preserved. Please try again in a few moments.
        </p>

        {/* Retry Info */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '13px',
            marginBottom: '8px'
          }}>
            Automatic reconnection is enabled.
          </p>
          <p style={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '12px'
          }}>
            We'll notify you when the service is back online.
          </p>
        </div>

        {/* Trace ID */}
        {traceId && (
          <div style={{
            display: 'inline-block',
            padding: '6px 12px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '24px',
            wordBreak: 'break-all'
          }}>
            Session ID: {traceId}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleReturn}
            style={{
              background: '#dc3545',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Return to Dashboard
          </button>
          
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'transparent',
              border: '1px solid rgba(220, 53, 69, 0.5)',
              borderRadius: '8px',
              padding: '12px 24px',
              color: '#dc3545',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  )
}

export default ServiceOutage
