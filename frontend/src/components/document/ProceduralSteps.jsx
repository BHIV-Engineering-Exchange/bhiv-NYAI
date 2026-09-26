/**
 * ProceduralSteps.jsx
 * Fields consumed: procedural_steps
 *
 * Empty array → formal "No procedural steps required" state (never blank space).
 */
import React from 'react'
import { ClipboardList, FileText } from 'lucide-react'

const TYPE_CONFIG = {
  required:    { color: '#dc2626', label: 'Required' },
  optional:    { color: '#2563eb', label: 'Optional' },
  conditional: { color: '#d97706', label: 'Conditional' }
}

const ProceduralSteps = ({ proceduralSteps }) => (
  <section style={{ padding: '32px 40px', borderBottom: '1px solid #e5e7eb' }}>
    <div style={{
      fontSize: '10px', fontWeight: '700', letterSpacing: '2px',
      textTransform: 'uppercase', color: '#6b7280', marginBottom: '20px',
      paddingBottom: '6px', borderBottom: '1px solid #e5e7eb'
    }}>
      Procedural Steps
    </div>

    {proceduralSteps.length === 0 ? (
      <div style={{
        padding: '20px 24px',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <ClipboardList size={18} color="#6b7280" />
        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
          No procedural steps required for this determination.
        </p>
      </div>
    ) : (
      <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {proceduralSteps.map((step, i) => {
          const typeCfg = TYPE_CONFIG[step.type] ?? TYPE_CONFIG.required
          return (
            <li key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              {/* Step number bubble */}
              <div style={{
                flexShrink: 0, width: '32px', height: '32px',
                borderRadius: '50%', backgroundColor: '#1e3a5f',
                color: 'white', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '13px', fontWeight: '700'
              }}>
                {step.step_number ?? i + 1}
              </div>

              <div style={{ flex: 1, paddingTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    {step.title}
                  </span>
                  <span style={{
                    fontSize: '11px', fontWeight: '600', color: typeCfg.color,
                    border: `1px solid ${typeCfg.color}`, borderRadius: '10px',
                    padding: '1px 8px'
                  }}>
                    {typeCfg.label}
                  </span>
                  {step.deadline && (
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>
                      Due: {new Date(step.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>

                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#4b5563', lineHeight: '1.6' }}>
                  {step.description}
                </p>

                {step.documents?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {step.documents.map((doc, j) => (
                      <span key={j} style={{
                        fontSize: '11px', color: '#374151',
                        backgroundColor: '#f3f4f6', border: '1px solid #d1d5db',
                        borderRadius: '4px', padding: '2px 8px',
                        display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        <FileText size={12} color="#6b7280" />
                        <span>{doc}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    )}
  </section>
)

export default ProceduralSteps
