import React from 'react'
import { FileText, Search, Scale, Phone, ClipboardList } from 'lucide-react'
import GlassCard from './ui/GlassCard.jsx'
import StatusBadge from './ui/StatusBadge.jsx'

const ProceduralTimeline = ({ jurisdiction }) => {
  const timelineData = {
    India: [
      {
        step: 'Filing',
        description: 'File FIR at Police Station or submit formal complaint',
        duration: '1-3 days',
        icon: FileText,
        status: 'current'
      },
      {
        step: 'Investigation',
        description: 'Police investigation and evidentiary collection',
        duration: '15-90 days',
        icon: Search,
        status: 'pending'
      },
      {
        step: 'Court Process',
        description: 'Chargesheet filing, formal trial, and judicial determination',
        duration: '6-24 months',
        icon: Scale,
        status: 'pending'
      }
    ],
    UK: [
      {
        step: 'Filing',
        description: 'Report to Police or initiate formal proceedings through CPS',
        duration: '1-7 days',
        icon: Phone
      },
      {
        step: 'Investigation',
        description: 'Police investigation and Crown Prosecution Service review',
        duration: '14-60 days',
        icon: Search
      },
      {
        step: 'Court Process',
        description: 'Magistrates Court proceedings, Crown Court trial',
        duration: '3-12 months',
        icon: Scale
      }
    ],
    UAE: [
      {
        step: 'Filing',
        description: 'Submit complaint to Public Prosecution or civil registrar',
        duration: '1-5 days',
        icon: ClipboardList
      },
      {
        step: 'Investigation',
        description: 'Public Prosecution examination and evidence intake',
        duration: '7-30 days',
        icon: Search
      },
      {
        step: 'Court Process',
        description: 'First Instance Federal Court proceedings and ruling',
        duration: '2-8 months',
        icon: Scale
      }
    ]
  }

  const steps = timelineData[jurisdiction] || []

  if (!jurisdiction || steps.length === 0) {
    return (
      <GlassCard variant="secondary" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>
          Procedural timeline data is currently unavailable for {jurisdiction || 'the selected jurisdiction'}.
        </p>
      </GlassCard>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{
          fontFamily: 'var(--font-family-heading)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--color-text)',
          margin: 0
        }}>
          Procedural Timeline in {jurisdiction}
        </h4>
        <StatusBadge variant="info" size="sm">
          {jurisdiction}
        </StatusBadge>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        position: 'relative'
      }}>
        {steps.map((step, index) => {
          const IconComp = step.icon;
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-3)',
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)'
              }}
            >
              {/* Step icon */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-transparent)',
                border: '1px solid var(--color-primary)',
                color: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {IconComp && <IconComp size={18} />}
              </div>

            {/* Step content */}
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-1)',
                flexWrap: 'wrap',
                gap: 'var(--space-2)'
              }}>
                <span style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text)',
                  fontWeight: 'var(--font-semibold)'
                }}>
                  {step.step}
                </span>
                <StatusBadge variant="neutral" size="sm">
                  {step.duration}
                </StatusBadge>
              </div>
              <p style={{
                margin: 0,
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--text-xs)',
                lineHeight: 'var(--line-height-normal)'
              }}>
                {step.description}
              </p>
            </div>
          </div>
        )
      })}
    </div>

      <div style={{
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--color-surface-subtle)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-secondary)',
        lineHeight: 'var(--line-height-normal)'
      }}>
        <strong style={{ color: 'var(--color-warning)' }}>Notice:</strong> These are typical duration ranges across court registries and may vary based on complexity and jurisdiction-specific calendar rules.
      </div>
    </div>
  )
}

export default ProceduralTimeline