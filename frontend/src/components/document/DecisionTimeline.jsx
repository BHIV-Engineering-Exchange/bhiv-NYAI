/**
 * DecisionTimeline.jsx
 * Fields consumed: timeline
 *
 * Empty array → formal "No timeline entries recorded" state (never blank space).
 */
import React from 'react'
import { Calendar, Clock, Flag, ListOrdered } from 'lucide-react'

const TYPE_CONFIG = {
  event:     { color: '#2563eb', Icon: Calendar },
  deadline:  { color: '#dc2626', Icon: Clock },
  milestone: { color: '#059669', Icon: Flag },
  step:      { color: '#7c3aed', Icon: ListOrdered }
}

const STATUS_CONFIG = {
  completed: { color: '#059669', bg: '#d1fae5', label: 'Completed' },
  pending:   { color: '#d97706', bg: '#fef3c7', label: 'Pending' },
  overdue:   { color: '#dc2626', bg: '#fee2e2', label: 'Overdue' }
}

const DecisionTimeline = ({ timeline }) => (
  <section style={{ padding: '32px 40px', borderBottom: '1px solid #e5e7eb' }}>
    <div style={{
      fontSize: '10px', fontWeight: '700', letterSpacing: '2px',
      textTransform: 'uppercase', color: '#6b7280', marginBottom: '20px',
      paddingBottom: '6px', borderBottom: '1px solid #e5e7eb'
    }}>
      Procedural Timeline
    </div>

    {timeline.length === 0 ? (
      <div style={{
        padding: '20px 24px', backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb', borderRadius: '6px',
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <Calendar size={18} color="#6b7280" />
        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
          No timeline entries recorded for this determination.
        </p>
      </div>
    ) : (
      <div style={{ position: 'relative' }}>
        {/* Vertical connector line */}
        <div style={{
          position: 'absolute', left: '15px', top: '16px',
          bottom: '16px', width: '2px', backgroundColor: '#e5e7eb'
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[...timeline]
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((event, i) => {
              const typeCfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.event
              const statusCfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.pending
              const IconComp = typeCfg.Icon
              return (
                <div key={event.id ?? i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', position: 'relative' }}>
                  {/* Icon dot */}
                  <div style={{
                    flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: typeCfg.color, color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1, boxShadow: '0 0 0 3px white'
                  }}>
                    {IconComp && <IconComp size={15} color="#fff" />}
                  </div>

                  <div style={{
                    flex: 1, padding: '12px 16px',
                    backgroundColor: '#f9fafb', border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        {event.title}
                      </span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span style={{
                          fontSize: '11px', fontWeight: '600',
                          color: statusCfg.color, backgroundColor: statusCfg.bg,
                          padding: '2px 8px', borderRadius: '10px'
                        }}>
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: '1.6' }}>
                      {event.description}
                    </p>
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    )}
  </section>
)

export default DecisionTimeline
