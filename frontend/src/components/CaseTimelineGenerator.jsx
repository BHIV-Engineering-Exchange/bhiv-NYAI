import { useState } from 'react'
import GlassCard from './ui/GlassCard.jsx'
import BHIVButton from './ui/BHIVButton.jsx'
import StatusBadge from './ui/StatusBadge.jsx'
import WorkspaceHeader from './layout/WorkspaceHeader.jsx'

const eventTypes = ['Notice', 'Filing', 'Agreement', 'Hearing', 'Incident']
const countries = ['India', 'United Kingdom', 'United Arab Emirates']
const states = {
  'India': ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'West Bengal', 'Rajasthan', 'Uttar Pradesh'],
  'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  'United Arab Emirates': ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Fujairah', 'Ras Al Khaimah', 'Umm Al Quwain']
}

export default function CaseTimelineGenerator({ onBack, onNavigateHome }) {
  const [events, setEvents] = useState([])
  const [currentEvent, setCurrentEvent] = useState({
    title: '',
    description: '',
    date: '',
    type: '',
    documents: []
  })
  const [jurisdiction, setJurisdiction] = useState({ country: '', state: '' })
  const [generatedTimeline, setGeneratedTimeline] = useState(null)
  const [loading, setLoading] = useState(false)

  const addEvent = () => {
    if (currentEvent.title && currentEvent.date && currentEvent.type) {
      setEvents([...events, { ...currentEvent, id: Date.now() }])
      setCurrentEvent({ title: '', description: '', date: '', type: '', documents: [] })
    }
  }

  const removeEvent = (id) => {
    setEvents(events.filter(e => e.id !== id))
  }

  const handleFileUpload = (e) => {
    setCurrentEvent({ ...currentEvent, documents: Array.from(e.target.files) })
  }

  const generateTimeline = () => {
    setLoading(true)
    setTimeout(() => {
      const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date))
      setGeneratedTimeline({
        events: sortedEvents.map((e, idx) => ({
          ...e,
          legalRelevance: 'Critical procedural milestone',
          proceduralStage: idx === 0 ? 'Initiation' : idx === sortedEvents.length - 1 ? 'Current Stage' : 'Ongoing',
          status: new Date(e.date) < new Date() ? 'completed' : 'pending'
        })),
        nextSteps: [
          'File formal response within statutory 30 days',
          'Prepare evidentiary documentation bundle',
          'Schedule preliminary mediation session'
        ],
        missedDeadlines: [],
        statutoryGaps: '15 days between filing and hearing (compliant with jurisdictional rules)'
      })
      setLoading(false)
    }, 1200)
  }

  const handleHomeClick = onNavigateHome || onBack;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Contextual Workspace Header */}
      <WorkspaceHeader
        breadcrumbs={[
          { label: 'NYAI', onClick: handleHomeClick },
          { label: 'Procedural' },
          { label: 'Case Timeline' }
        ]}
        title="Case Timeline Generator"
        description="Construct chronological case progression, map statutory deadlines, and verify procedural compliance."
        badge="TIMELINE BUILDER"
        onBack={handleHomeClick}
      />

      {/* Case Intake Form */}
      <GlassCard variant="primary" style={{ padding: 'var(--space-6)' }}>
        <div style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--color-primary-light)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em'
        }}>
          Procedural Analysis Tool
        </div>
        <h2 style={{
          fontFamily: 'var(--font-family-heading)',
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--color-text)',
          margin: 'var(--space-1) 0 0 0'
        }}>
          Case Timeline Generator
        </h2>
        <p style={{ margin: 'var(--space-2) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Sequence key dispute milestones, track statutory compliance, and generate an AI-aligned procedural timeline.
        </p>
      </GlassCard>

      {!generatedTimeline ? (
        <>
          {/* Section 1: Event Input */}
          <GlassCard variant="secondary" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--color-text)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 'var(--space-4)'
            }}>
              1. Add Legal Milestones
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <input
                type="text"
                placeholder="Milestone / Event Title (e.g. Demand Notice Served)"
                value={currentEvent.title}
                onChange={(e) => setCurrentEvent({ ...currentEvent, title: e.target.value })}
                style={{
                  background: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3)',
                  color: 'var(--color-text)',
                  fontSize: 'var(--text-sm)',
                  boxSizing: 'border-box'
                }}
              />

              <textarea
                placeholder="Event Description (facts, context, recipients)..."
                value={currentEvent.description}
                onChange={(e) => setCurrentEvent({ ...currentEvent, description: e.target.value })}
                rows={3}
                style={{
                  background: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3)',
                  color: 'var(--color-text)',
                  fontSize: 'var(--text-sm)',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                <input
                  type="date"
                  value={currentEvent.date}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, date: e.target.value })}
                  style={{
                    background: 'var(--color-bg-base)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-2) var(--space-3)',
                    color: 'var(--color-text)',
                    fontSize: 'var(--text-sm)',
                    boxSizing: 'border-box'
                  }}
                />

                <select
                  value={currentEvent.type}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, type: e.target.value })}
                  style={{
                    background: 'var(--color-bg-base)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-2) var(--space-3)',
                    color: 'var(--color-text)',
                    fontSize: 'var(--text-sm)',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select Event Type</option>
                  {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                <label style={{
                  padding: 'var(--space-2) var(--space-3)',
                  background: 'var(--color-surface-subtle)',
                  border: '1px dashed var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer'
                }}>
                  <input type="file" multiple accept=".pdf,.docx,.doc,.jpg,.jpeg,.png" onChange={handleFileUpload} style={{ display: 'none' }} />
                  {currentEvent.documents.length > 0 ? `${currentEvent.documents.length} document(s) selected` : 'Attach Documents (Optional)'}
                </label>

                <BHIVButton
                  variant="primary"
                  size="sm"
                  onClick={addEvent}
                  disabled={!currentEvent.title || !currentEvent.date || !currentEvent.type}
                >
                  + Add Event
                </BHIVButton>
              </div>
            </div>

            {/* Event List */}
            {events.length > 0 && (
              <div style={{ marginTop: 'var(--space-5)' }}>
                <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
                  Queued Events ({events.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {events.map(event => (
                    <div key={event.id} style={{
                      background: 'var(--color-surface-subtle)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-3) var(--space-4)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ color: 'var(--color-text)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>{event.title}</div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                          {event.type} • {event.date}
                        </div>
                      </div>
                      <BHIVButton
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEvent(event.id)}
                        style={{ color: 'var(--color-error)' }}
                      >
                        Remove
                      </BHIVButton>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Section 2: Jurisdiction */}
          <GlassCard variant="secondary" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--color-text)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 'var(--space-4)'
            }}>
              2. Jurisdiction Context
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-1)', display: 'block', textTransform: 'uppercase' }}>Country</label>
                <select
                  value={jurisdiction.country}
                  onChange={(e) => setJurisdiction({ country: e.target.value, state: '' })}
                  style={{
                    width: '100%',
                    background: 'var(--color-bg-base)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-2) var(--space-3)',
                    color: 'var(--color-text)',
                    fontSize: 'var(--text-sm)',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select Country</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {jurisdiction.country && (
                <div>
                  <label style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-1)', display: 'block', textTransform: 'uppercase' }}>State / Region</label>
                  <select
                    value={jurisdiction.state}
                    onChange={(e) => setJurisdiction({ ...jurisdiction, state: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'var(--color-bg-base)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-2) var(--space-3)',
                      color: 'var(--color-text)',
                      fontSize: 'var(--text-sm)',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select State / Region</option>
                    {states[jurisdiction.country]?.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Submit Button */}
          <BHIVButton
            variant="primary"
            size="lg"
            onClick={generateTimeline}
            disabled={events.length === 0 || !jurisdiction.country || loading}
            loading={loading}
          >
            {loading ? 'Synthesizing Timeline...' : 'Generate Case Timeline →'}
          </BHIVButton>
        </>
      ) : (
        <>
          {/* Section 3: Generated Timeline */}
          <GlassCard variant="primary" style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <h3 style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--color-text)',
                margin: 0
              }}>
                Structured Case Timeline
              </h3>
              <StatusBadge variant="success" size="sm">
                Generated
              </StatusBadge>
            </div>

            {/* Vertical Timeline */}
            <div style={{ position: 'relative', paddingLeft: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Vertical connector line */}
              <div style={{
                position: 'absolute',
                left: '7px',
                top: '12px',
                bottom: '12px',
                width: '2px',
                background: 'var(--color-border)'
              }} />

              {generatedTimeline.events.map((event, _idx) => (
                <div key={event.id} style={{ position: 'relative' }}>
                  {/* Node */}
                  <div style={{
                    position: 'absolute',
                    left: `calc(-1 * var(--space-6) + 3px)`,
                    top: '10px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: event.status === 'completed' ? 'var(--color-success)' : 'var(--color-warning)',
                    border: '2px solid var(--color-bg-base)'
                  }} />

                  <div style={{
                    background: 'var(--color-surface-subtle)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-4)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                      <div>
                        <h4 style={{ color: 'var(--color-text)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', margin: 0 }}>
                          {event.title}
                        </h4>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                          {event.date} • {event.type}
                        </span>
                      </div>
                      <StatusBadge variant={event.status === 'completed' ? 'success' : 'warning'} size="sm">
                        {event.proceduralStage}
                      </StatusBadge>
                    </div>

                    {event.description && (
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', margin: 'var(--space-2) 0', lineHeight: 'var(--line-height-normal)' }}>
                        {event.description}
                      </p>
                    )}

                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      Relevance: {event.legalRelevance}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Next Steps Card */}
          <GlassCard variant="secondary" style={{ padding: 'var(--space-5)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
              Suggested Next Legal Steps
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {generatedTimeline.nextSteps.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ color: 'var(--color-primary-light)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)' }}>{idx + 1}.</span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{step}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Statutory Gap Info */}
          <GlassCard variant="secondary" style={{ padding: 'var(--space-5)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Statutory Time Gap Assessment
            </span>
            <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
              {generatedTimeline.statutoryGaps}
            </p>
          </GlassCard>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <BHIVButton variant="outline" onClick={() => setGeneratedTimeline(null)}>
              Create New Timeline
            </BHIVButton>
          </div>
        </>
      )}
    </div>
  )
}
