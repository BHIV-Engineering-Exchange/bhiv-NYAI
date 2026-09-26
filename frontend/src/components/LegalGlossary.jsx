import React, { useState } from 'react'
import GlassCard from './ui/GlassCard.jsx'
import BHIVButton from './ui/BHIVButton.jsx'
import StatusBadge from './ui/StatusBadge.jsx'
import WorkspaceHeader from './layout/WorkspaceHeader.jsx'

const glossaryTerms = [
  { term: 'Breach of Contract', definition: 'Violation of any term or condition of a contract without lawful excuse', jurisdiction: 'India' },
  { term: 'Force Majeure', definition: 'A clause that frees parties from liability when extraordinary events occur', jurisdiction: 'India' },
  { term: 'Specific Performance', definition: 'Court-ordered remedy requiring a party to perform contractual obligations', jurisdiction: 'India' },
  { term: 'Limitation Period', definition: 'Maximum time period to initiate legal action after cause of action arises', jurisdiction: 'India' },
  { term: 'Arbitration', definition: 'Binding dispute resolution through private arbitration tribunal', jurisdiction: 'India' },
  { term: 'Tort', definition: 'Civil wrong that causes harm or loss to another person', jurisdiction: 'UK' },
  { term: 'Injunction', definition: 'Court order requiring a party to do or refrain from doing specific acts', jurisdiction: 'UK' },
  { term: 'Damages', definition: 'Monetary compensation awarded for loss or injury', jurisdiction: 'UAE' }
]

const LegalGlossary = ({ onBack, onNavigateHome }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('All')

  const filteredTerms = glossaryTerms.filter(item => {
    const matchesSearch = item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.definition.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesJurisdiction = selectedJurisdiction === 'All' || item.jurisdiction === selectedJurisdiction
    return matchesSearch && matchesJurisdiction
  })

  const handleHomeClick = onNavigateHome || onBack;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Contextual Workspace Header */}
      <WorkspaceHeader
        breadcrumbs={[
          { label: 'NYAI', onClick: handleHomeClick },
          { label: 'Reference' },
          { label: 'Legal Glossary' }
        ]}
        title="Legal Glossary & Statutory Lexicon"
        description="Comprehensive cross-jurisdictional legal definitions and statutory provisions."
        badge="LEXICON"
        onBack={handleHomeClick}
      />

      {/* Search & Filter Card */}
      <GlassCard variant="primary" style={{ padding: 'var(--space-6)' }}>
        <p style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Comprehensive canonical legal definitions across India, UK, and UAE jurisdictions.
        </p>

        {/* Search and Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search legal terms or definitions..."
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--color-bg-base)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-sm)',
              boxSizing: 'border-box'
            }}
          />

          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {['All', 'India', 'UK', 'UAE'].map(jur => (
              <BHIVButton
                key={jur}
                variant={selectedJurisdiction === jur ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedJurisdiction(jur)}
              >
                {jur === 'All' ? 'All Jurisdictions' : jur}
              </BHIVButton>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Terms List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {filteredTerms.length > 0 ? (
          filteredTerms.map((item, idx) => (
            <GlassCard key={idx} variant="secondary" style={{ padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <h3 style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--color-text)',
                  margin: 0
                }}>
                  {item.term}
                </h3>
                <StatusBadge variant="info" size="sm">
                  {item.jurisdiction}
                </StatusBadge>
              </div>
              <p style={{
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--text-sm)',
                lineHeight: 'var(--line-height-normal)',
                margin: 0
              }}>
                {item.definition}
              </p>
            </GlassCard>
          ))
        ) : (
          <GlassCard variant="secondary" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>
              No glossary terms matching "{searchTerm}".
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  )
}

export default LegalGlossary
