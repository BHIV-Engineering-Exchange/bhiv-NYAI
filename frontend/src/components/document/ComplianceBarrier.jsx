/**
 * ComplianceBarrier.jsx
 * Rendered when enforcement state is 'block'.
 *
 * The decision and reasoning strings are NEVER passed to this component.
 * Legacy barrier UI — advisory routing now uses RecommendationGatekeeper upstream.
 */
import React from 'react'
import { Ban } from 'lucide-react'

const ComplianceBarrier = ({ traceId, reason, blockedPath, barriers, safeExplanation }) => (
  <div style={{
    backgroundColor: '#fff',
    border: '2px solid #dc2626',
    borderRadius: '8px',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  }}>
    {/* High-contrast header strip */}
    <div style={{
      backgroundColor: '#dc2626',
      padding: '20px 32px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      <Ban size={28} color="#fff" />
      <div>
        <div style={{
          fontSize: '11px', fontWeight: '700', letterSpacing: '2px',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: '4px'
        }}>
          Compliance Failure
        </div>
        <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700', color: '#fff' }}>
          Decision Rendering Blocked
        </h2>
      </div>
    </div>

    <div style={{ padding: '28px 32px' }}>
      {/* Safe explanation */}
      {safeExplanation && (
        <p style={{
          margin: '0 0 20px 0', fontSize: '14px', lineHeight: '1.7',
          color: '#374151', fontFamily: 'Georgia, "Times New Roman", serif'
        }}>
          {safeExplanation}
        </p>
      )}

      {/* Reason */}
      {reason && (
        <div style={{
          padding: '14px 18px', backgroundColor: '#fef2f2',
          border: '1px solid #fecaca', borderRadius: '6px', marginBottom: '16px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#991b1b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
            Reason
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#7f1d1d', lineHeight: '1.6' }}>
            {reason}
          </p>
        </div>
      )}

      {/* Blocked path */}
      {blockedPath && (
        <div style={{
          padding: '14px 18px', backgroundColor: '#fef2f2',
          border: '1px solid #fecaca', borderRadius: '6px', marginBottom: '16px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#991b1b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
            Blocked Pathway
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#7f1d1d', lineHeight: '1.6' }}>
            {blockedPath}
          </p>
        </div>
      )}

      {/* Barriers list */}
      {barriers?.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#991b1b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
            Enforcement Barriers
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {barriers.map((b, i) => (
              <li key={i} style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Guidance */}
      <div style={{
        padding: '14px 18px', backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '20px'
      }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
          Recommended Action
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
          Please consult with a qualified legal professional to explore alternative pathways. This determination cannot be issued in its current form.
        </p>
      </div>

      {/* Trace ID — for support reference */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Reference ID:
        </span>
        <code style={{
          fontSize: '11px', fontFamily: '"Courier New", monospace',
          color: '#6b7280', backgroundColor: '#f3f4f6',
          padding: '3px 8px', borderRadius: '4px'
        }}>
          {traceId}
        </code>
      </div>
    </div>
  </div>
)

export default ComplianceBarrier
