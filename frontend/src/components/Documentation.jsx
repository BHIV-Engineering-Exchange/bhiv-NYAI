import React, { useState } from 'react'
import { procedureService } from '../services/nyayaApi.js'
import GlassCard from './ui/GlassCard.jsx'
import BHIVButton from './ui/BHIVButton.jsx'
import StatusBadge from './ui/StatusBadge.jsx'
import WorkspaceHeader from './layout/WorkspaceHeader.jsx'

const Documentation = ({ onBack, onNavigateHome }) => {
  const [activeSection, setActiveSection] = useState('overview')
  const [testResults, setTestResults] = useState({})
  const [testing, setTesting] = useState(false)

  const testEndpoint = async (name, testFn) => {
    setTesting(true)
    setTestResults(prev => ({ ...prev, [name]: 'Testing...' }))
    try {
      const result = await testFn()
      setTestResults(prev => ({ ...prev, [name]: result.success ? 'Success' : `Failed: ${result.error}` }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, [name]: `Failed: ${error.message}` }))
    }
    setTesting(false)
  }

  const sections = {
    overview: {
      title: 'Platform Overview',
      content: [
        { heading: 'What is NYAI?', text: 'NYAI is a sovereign-compliant multi-agent legal intelligence platform that provides transparent, auditable legal analysis across India, UK, and UAE jurisdictions.' },
        { heading: 'Key Features', text: 'AI-powered legal question answering, jurisdiction-specific procedures, case timeline generation, and comprehensive legal glossary.' },
        { heading: 'How It Works', text: 'Ask your legal question, receive AI-powered analysis with confidence scores, get suggested next steps, and view jurisdiction-specific procedures.' }
      ]
    },
    features: {
      title: 'Features Guide',
      content: [
        { heading: 'Ask Legal Question', text: 'Submit your legal query and receive instant AI-powered analysis with confidence scores, suggested next steps, and jurisdiction-specific procedures tailored to your case type.' },
        { heading: 'Jurisdiction Procedure', text: 'Navigate through step-by-step legal procedures for India, UK, and UAE. Each procedure includes timelines, descriptions, and jurisdiction-specific requirements.' },
        { heading: 'Case Timeline', text: 'Generate comprehensive timelines for your legal case by adding events, milestones, and deadlines. Visualize your case progression with our interactive timeline tool.' },
        { heading: 'Legal Glossary', text: 'Search and explore legal terms across multiple jurisdictions. Filter by India, UK, or UAE to find relevant definitions and explanations.' }
      ]
    },
    laws: {
      title: 'Understanding Laws',
      content: [
        { heading: 'Indian Law', text: 'India follows a common law system with codified laws. Key acts include the Indian Contract Act 1872, Indian Penal Code 1860, and Constitution of India. The legal system has three tiers: District Courts, High Courts, and Supreme Court.' },
        { heading: 'UK Law', text: 'The UK operates under common law with parliamentary sovereignty. Key areas include contract law, tort law, and criminal law. The court system includes Magistrates Courts, Crown Courts, Court of Appeal, and Supreme Court.' },
        { heading: 'UAE Law', text: 'UAE follows a civil law system based on Sharia principles for personal matters and civil codes for commercial matters. The legal system includes Court of First Instance, Court of Appeal, and Court of Cassation.' },
        { heading: 'Legal Procedures', text: 'Each jurisdiction has specific procedures for filing cases, presenting evidence, and appealing decisions. Understanding these procedures is crucial for effective legal action.' }
      ]
    },
    howto: {
      title: 'How to Use',
      content: [
        { heading: 'Step 1: Ask Your Question', text: 'Click "Ask Legal Question" and describe your legal situation in detail. Include relevant facts, dates, and parties involved for better analysis.' },
        { heading: 'Step 2: Review Analysis', text: 'Read the AI-generated legal assessment, confidence score, and jurisdiction determination. Review suggested next steps with priority levels and timelines.' },
        { heading: 'Step 3: Follow Procedures', text: 'Check the jurisdiction-specific procedure section to understand the step-by-step process for your case type (contract, property, criminal, etc.).' },
        { heading: 'Step 4: Use Tools', text: 'Explore additional tools like Timeline Generator for case planning, Glossary for term definitions, and Procedure Navigator for detailed jurisdiction workflows.' },
        { heading: 'Step 5: Provide Feedback', text: 'Help improve the system by providing feedback on response helpfulness, clarity, and accuracy using the feedback buttons.' }
      ]
    },
    faq: {
      title: 'FAQ',
      content: [
        { heading: 'Is this legal advice?', text: 'No. NYAI provides legal information and analysis, not legal advice. Always consult a qualified lawyer for specific legal advice on your situation.' },
        { heading: 'Which jurisdictions are supported?', text: 'Currently, NYAI supports India, United Kingdom, and United Arab Emirates. Each jurisdiction has specific procedures and legal frameworks.' },
        { heading: 'How accurate is the AI?', text: 'The AI provides confidence scores with each analysis. Higher confidence (>80%) indicates stronger analysis, but always verify with legal professionals.' },
        { heading: 'Can I save my queries?', text: 'Each query generates a trace ID for tracking. You can reference this ID for follow-up questions or to retrieve analysis history.' },
        { heading: 'What case types are covered?', text: 'Contract disputes, property disputes, criminal matters, civil litigation, family law, employment law, and more across all supported jurisdictions.' }
      ]
    },
    api: {
      title: 'API Endpoints',
      content: [
        { heading: 'Backend Connectivity Verification', text: 'Trigger real-time diagnostic checks against Nyaya sovereign procedure services.' }
      ]
    }
  }

  const handleHomeClick = onNavigateHome || onBack;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Contextual Workspace Header */}
      <WorkspaceHeader
        breadcrumbs={[
          { label: 'NYAI', onClick: handleHomeClick },
          { label: 'Reference' },
          { label: 'Documentation' }
        ]}
        title="NYAI Platform Documentation"
        description="Operational guides, legal frameworks, and system verification utilities."
        badge="DOCUMENTATION"
        onBack={handleHomeClick}
      />

      {/* Header */}
      <GlassCard variant="primary" style={{ padding: 'var(--space-6)' }}>
        <div style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--color-primary-light)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em'
        }}>
          Knowledge & Guidelines
        </div>
        <h2 style={{
          fontFamily: 'var(--font-family-heading)',
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--color-text)',
          margin: 'var(--space-1) 0 0 0'
        }}>
          NYAI Platform Documentation
        </h2>
        <p style={{ margin: 'var(--space-2) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Operational guides, legal frameworks, and system verification utilities.
        </p>

        {/* Section Tabs */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-5)', flexWrap: 'wrap' }}>
          {Object.keys(sections).map(key => (
            <BHIVButton
              key={key}
              variant={activeSection === key ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveSection(key)}
            >
              {sections[key].title}
            </BHIVButton>
          ))}
        </div>
      </GlassCard>

      {/* Content Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {sections[activeSection].content.map((item, idx) => (
          <GlassCard key={idx} variant="secondary" style={{ padding: 'var(--space-5)' }}>
            <h3 style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--color-text)',
              marginBottom: 'var(--space-2)',
              marginTop: 0
            }}>
              {item.heading}
            </h3>
            <p style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--text-sm)',
              lineHeight: 'var(--line-height-relaxed)',
              margin: 0
            }}>
              {item.text}
            </p>
          </GlassCard>
        ))}

        {/* API Diagnostics */}
        {activeSection === 'api' && (
          <GlassCard variant="secondary" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--color-text)',
              margin: '0 0 var(--space-4) 0'
            }}>
              Procedure Service Diagnostics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
              {[
                { name: 'list', label: 'List Procedures', fn: () => procedureService.listProcedures() },
                { name: 'schemas', label: 'Get Schemas', fn: () => procedureService.getSchemas() },
                { name: 'summary', label: 'Procedure Summary (IN Civil)', fn: () => procedureService.getProcedureSummary('IN', 'civil') },
                { name: 'enhanced', label: 'Enhanced Analysis (IN Civil)', fn: () => procedureService.getEnhancedAnalysis('IN', 'civil') },
                { name: 'domain', label: 'Domain Classification (IN)', fn: () => procedureService.getDomainClassification('IN') },
                { name: 'sections', label: 'Legal Sections (IN Civil)', fn: () => procedureService.getLegalSections('IN', 'civil') }
              ].map(test => (
                <div
                  key={test.name}
                  style={{
                    padding: 'var(--space-3)',
                    background: 'var(--color-surface-subtle)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)' }}>
                      {test.label}
                    </span>
                    {testResults[test.name] && (
                      <span style={{ fontSize: 'var(--text-xs)' }}>{testResults[test.name]}</span>
                    )}
                  </div>
                  <BHIVButton
                    variant="outline"
                    size="sm"
                    onClick={() => testEndpoint(test.name, test.fn)}
                    disabled={testing}
                  >
                    Run Test
                  </BHIVButton>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  )
}

export default Documentation
