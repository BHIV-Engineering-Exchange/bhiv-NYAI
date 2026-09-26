// OfflineBanner.jsx — Non-intrusive degraded mode status banner adhering to BHIV tokens
import React from 'react'
import BHIVButton from './ui/BHIVButton.jsx'

const OfflineBanner = ({ isOffline, isSyncing, hasPending, onSyncClick }) => {
  if (!isOffline) return null

  return (
    <aside
      aria-label="Offline Mode Status"
      style={{
        position: 'fixed',
        bottom: 'var(--space-6)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 'var(--z-sticky)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        padding: 'var(--space-3) var(--space-5)',
        background: 'rgba(17, 24, 39, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(245, 158, 11, 0.4)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        maxWidth: 'calc(100vw - 32px)',
        width: 'auto'
      }}
    >
      {/* Pulsing indicator */}
      <span
        aria-hidden="true"
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-warning)',
          flexShrink: 0,
          animation: 'bhiv-offline-pulse 2s ease-in-out infinite'
        }}
      />

      <span style={{
        color: 'var(--color-text)',
        fontSize: 'var(--text-xs)',
        lineHeight: 'var(--line-height-normal)'
      }}>
        Operating in Offline Mode · Analysis unavailable
      </span>

      {hasPending && (
        <BHIVButton
          variant="outline"
          size="sm"
          onClick={onSyncClick}
          disabled={isSyncing}
          loading={isSyncing}
          style={{
            borderColor: 'rgba(245, 158, 11, 0.5)',
            color: 'var(--color-warning)',
            whiteSpace: 'nowrap'
          }}
        >
          {isSyncing ? 'Syncing...' : 'Sync to Server'}
        </BHIVButton>
      )}

      <style>{`
        @keyframes bhiv-offline-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.85); }
        }
      `}</style>
    </aside>
  )
}

export default OfflineBanner
