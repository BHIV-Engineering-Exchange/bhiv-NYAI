import React, { useState, useEffect, useCallback, useRef } from 'react'
import Galaxy from './components/Galaxy.jsx'
import LegalOSDashboard from './components/LegalOSDashboard.jsx'
import LegalQueryCard from './components/LegalQueryCard.jsx'
import JurisdictionProcedure from './components/JurisdictionProcedure.jsx'
import CaseTimelineGenerator from './components/CaseTimelineGenerator.jsx'
import LegalGlossary from './components/LegalGlossary.jsx'
import Documentation from './components/Documentation.jsx'
import LegalConsultation from './components/LegalConsultation.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import MultiJurisdictionCard from './components/MultiJurisdictionCard.jsx'
import LegalConsultationCard from './components/LegalConsultationCard.jsx'
import CaseSummaryCard from './components/CaseSummaryCard.jsx'
import LegalRouteCard from './components/LegalRouteCard.jsx'
import TimelineCard from './components/TimelineCard.jsx'
import GlossaryCard from './components/GlossaryCard.jsx'
import JurisdictionInfoBar from './components/JurisdictionInfoBar.jsx'
import RecommendationStatusCard from './components/RecommendationStatusCard.jsx'
import SkeletonLoader from './components/SkeletonLoader.jsx'
import GlareHover from './components/GlareHover.jsx'
import AnimatedText from './components/AnimatedText.jsx'
import AuthPage from './components/AuthPage.jsx'
import LawAgentView from './components/LawAgentView.jsx'
import DecisionPage from './components/DecisionPage.jsx'
import LegalDecisionDocument from './components/LegalDecisionDocument.jsx'
import StaggeredMenu from './components/StaggeredMenu.jsx'
import OfflineBanner from './components/OfflineBanner.jsx'
import { BHIVShell, PageContainer } from './components/layout/index.js'
import BHIVButton from './components/ui/BHIVButton.jsx'
import GlassCard from './components/ui/GlassCard.jsx'
import StatusBadge from './components/ui/StatusBadge.jsx'
import { Globe, PenTool, ShieldCheck } from 'lucide-react'
import { casePresentationService } from './services/nyayaApi.js'
import { useResiliency } from './hooks/useResiliency.js'

// Case Presentation Component - Wires components to real backend data only
// NO MOCK DATA - All data comes from real Nyaya backend (Raj's Decision Engine)
const CasePresentation = ({ traceId, jurisdiction, caseType, caseId }) => {
  const [caseData, setCaseData] = useState({
    caseSummary: null,
    legalRoutes: null,
    timeline: null,
    glossary: null,
    jurisdictionInfo: null,
    recommendation: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentJurisdiction, setCurrentJurisdiction] = useState(jurisdiction || 'India')
  const [retryCount, setRetryCount] = useState(0)

  // Fetch all case data from REAL backend only - no fallback to mock data
  const fetchCaseData = useCallback(async () => {
    // Cannot fetch without traceId - show error instead of mock data
    if (!traceId) {
      setError('No trace ID available. Please submit a legal query first to get a decision from Nyaya backend.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [caseResult, recommendationResult] = await Promise.all([
        casePresentationService.getAllCaseData(traceId, currentJurisdiction, caseType, caseId),
        casePresentationService.getRecommendation(traceId)
      ])

      const recommendation = recommendationResult.success ? recommendationResult.data : null

      if (caseResult.success) {
        setCaseData({
          caseSummary: caseResult.data.caseSummary,
          legalRoutes: caseResult.data.legalRoutes,
          timeline: caseResult.data.timeline,
          glossary: caseResult.data.glossary,
          jurisdictionInfo: caseResult.data.jurisdictionInfo,
          recommendation
        })
      } else {
        setError(caseResult.error || 'Failed to load case data from Nyaya backend')
        setCaseData({
          caseSummary: null,
          legalRoutes: null,
          timeline: null,
          glossary: null,
          jurisdictionInfo: null,
          recommendation
        })
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to Nyaya backend')
      setCaseData({
        caseSummary: null,
        legalRoutes: null,
        timeline: null,
        glossary: null,
        jurisdictionInfo: null,
        recommendation: null
      })
    } finally {
      setLoading(false)
    }
  }, [traceId, currentJurisdiction, caseType, caseId, retryCount])

  // Fetch data on mount and when jurisdiction changes
  useEffect(() => {
    fetchCaseData()
  }, [fetchCaseData])

  // Handle jurisdiction change
  const handleJurisdictionChange = (newJurisdiction) => {
    setCurrentJurisdiction(newJurisdiction)
    setRetryCount(0) // Reset retry count on jurisdiction change
    fetchCaseData()
  }

  // Handle retry on error
  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <GlassCard variant="secondary" style={{ padding: 'var(--space-8)' }}>
          <SkeletonLoader type="card" count={4} />
          <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
              Retrieving sovereign case telemetry for {currentJurisdiction} jurisdiction...
            </p>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Error notification with retry option */}
      {error && (
        <GlassCard
          variant="secondary"
          style={{
            padding: 'var(--space-4)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.08)'
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-3)'
          }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                <StatusBadge variant="error" size="sm">TELEMETRY ERROR</StatusBadge>
              </div>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-normal)' }}>
                {error}
              </p>
            </div>
            <BHIVButton
              variant="danger"
              size="sm"
              onClick={handleRetry}
            >
              Retry Connection ({retryCount})
            </BHIVButton>
          </div>
        </GlassCard>
      )}

      {/* Jurisdiction Switcher */}
      <GlassCard variant="secondary" style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Jurisdiction
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {['India', 'UK', 'UAE'].map((j) => (
              <BHIVButton
                key={j}
                variant={currentJurisdiction === j ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleJurisdictionChange(j)}
              >
                <Globe size={13} style={{ marginRight: '6px' }} />
                {j}
              </BHIVButton>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Recommendation Status Card - Shows REVIEW, ESCALATE, INSUFFICIENT_DATA states */}
      <RecommendationStatusCard
        recommendation={caseData.recommendation}
        traceId={traceId}
      />

      {/* Jurisdiction Info Bar */}
      <JurisdictionInfoBar jurisdiction={caseData.jurisdictionInfo} />

      {/* Case Summary Card */}
      <CaseSummaryCard {...caseData.caseSummary} traceId={traceId} />

      {/* Legal Route Card */}
      <LegalRouteCard {...caseData.legalRoutes} traceId={traceId} />

      {/* Timeline Card */}
      <TimelineCard {...caseData.timeline} traceId={traceId} />

      {/* Glossary Card */}
      <GlossaryCard {...caseData.glossary} traceId={traceId} />
    </div>
  )
}

function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const [activeModule, setActiveModule] = useState(null)
  const [queryResult, setQueryResult] = useState(null)
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('India')
  const [user, setUser] = useState(null)
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [lastResponse, setLastResponse] = useState(null)

  // Ref always holds latest case intake for offline snapshot capture
  const caseIntakeRef = useRef(null)
  const { isOffline, isSyncing, hasPending, persistIntake, syncToServer } = useResiliency(caseIntakeRef)

  useEffect(() => {
    const storedUser = localStorage.getItem('nyaya_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsAuthChecking(false)

    // Safeguard: ensure auth check completes within 2 seconds
    const authTimeout = setTimeout(() => {
      setIsAuthChecking(false)
    }, 2000)

    return () => clearTimeout(authTimeout)
  }, [])

  const handleAuthSuccess = (userData) => {
    setUser(userData)
  }

  const handleSkipAuth = () => {
    const guestUser = { email: 'guest@nyaya.ai', name: 'Guest User' }
    localStorage.setItem('nyaya_user', JSON.stringify(guestUser))
    setUser(guestUser)
  }

  const handleLogout = () => {
    localStorage.removeItem('nyaya_user')
    localStorage.removeItem('authToken')
    setUser(null)
    setActiveView('dashboard')
  }

  if (isAuthChecking) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
      <div style={{ color: '#fff' }}>Loading...</div>
    </div>
  }

  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} onSkipAuth={handleSkipAuth} />
  }

  const handleModuleSelect = (moduleId) => {
    setActiveModule(moduleId)
    setActiveView(moduleId)
  }

  const handleBackToDashboard = () => {
    setActiveView('dashboard')
    setActiveModule(null)
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <LegalOSDashboard onModuleSelect={handleModuleSelect} />
      case 'consult':
        return (
          <ErrorBoundary>
            <LegalQueryCard
              onResponseReceived={setLastResponse}
              isOffline={isOffline}
              onNavigateHome={handleBackToDashboard}
            />
          </ErrorBoundary>
        )
      case 'law-agent':
        return (
          <ErrorBoundary>
            <LawAgentView
              responseData={lastResponse}
              onNavigateHome={handleBackToDashboard}
              onNavigateConsult={() => handleModuleSelect('consult')}
            />
          </ErrorBoundary>
        )
      case 'decision':
        return (
          <ErrorBoundary>
            <DecisionPage
              onNavigateHome={handleBackToDashboard}
              onNavigateConsult={() => handleModuleSelect('consult')}
            />
          </ErrorBoundary>
        )
      case 'decision-draft':
        return (
          <ErrorBoundary>
            <LegalDecisionDocument
              onResponseReceived={setLastResponse}
              isOffline={isOffline}
              onNavigateHome={handleBackToDashboard}
            />
          </ErrorBoundary>
        )
      case 'procedure':
        return (
          <ErrorBoundary>
            <JurisdictionProcedure
              onBack={handleBackToDashboard}
              onNavigateHome={handleBackToDashboard}
            />
          </ErrorBoundary>
        )
      case 'timeline':
        return (
          <ErrorBoundary>
            <CaseTimelineGenerator
              onBack={handleBackToDashboard}
              onNavigateHome={handleBackToDashboard}
            />
          </ErrorBoundary>
        )
      case 'glossary':
        return (
          <ErrorBoundary>
            <LegalGlossary
              onBack={handleBackToDashboard}
              onNavigateHome={handleBackToDashboard}
            />
          </ErrorBoundary>
        )
      case 'docs':
        return (
          <ErrorBoundary>
            <Documentation
              onBack={handleBackToDashboard}
              onNavigateHome={handleBackToDashboard}
            />
          </ErrorBoundary>
        )
      case 'draft':
        return (
          <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            <GlassCard variant="primary" style={{ padding: 'var(--space-12) var(--space-6)', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)', color: 'var(--bhiv-primary-hover, #818cf8)' }}>
                <PenTool size={44} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-2)' }}>
                <StatusBadge variant="neutral" size="sm">ROADMAP</StatusBadge>
              </div>
              <h2 style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--color-text)', fontSize: 'var(--text-xl)', margin: 'var(--space-2) 0' }}>
                Generate Legal Draft
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', margin: '0 0 var(--space-6) 0' }}>
                AI-assisted legal document drafting and verification will be integrated here.
              </p>
              <BHIVButton variant="outline" size="sm" onClick={handleBackToDashboard}>
                Return to Overview
              </BHIVButton>
            </GlassCard>
          </div>
        )
      case 'compliance':
        return (
          <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            <GlassCard variant="primary" style={{ padding: 'var(--space-12) var(--space-6)', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)', color: 'var(--bhiv-accent-emerald, #34d399)' }}>
                <ShieldCheck size={44} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-2)' }}>
                <StatusBadge variant="neutral" size="sm">ROADMAP</StatusBadge>
              </div>
              <h2 style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--color-text)', fontSize: 'var(--text-xl)', margin: 'var(--space-2) 0' }}>
                Compliance Risk Check
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', margin: '0 0 var(--space-6) 0' }}>
                Multi-jurisdictional statutory compliance audits and regulatory cross-checks will be integrated here.
              </p>
              <BHIVButton variant="outline" size="sm" onClick={handleBackToDashboard}>
                Return to Overview
              </BHIVButton>
            </GlassCard>
          </div>
        )
      default:
        return <LegalOSDashboard onModuleSelect={handleModuleSelect} />
    }
  }

  return (
    <BHIVShell
      activeView={activeView}
      onSelectView={(view) => {
        setActiveModule(view)
        setActiveView(view)
      }}
      user={user}
      onLogout={handleLogout}
      isOffline={isOffline}
    >
      <PageContainer width="default">
        <div className="bhiv-page-transition" key={activeView}>
          {renderView()}
        </div>
      </PageContainer>

      {/* Degraded Mode Banner — mounts globally, visible across all views */}
      <OfflineBanner
        isOffline={isOffline}
        isSyncing={isSyncing}
        hasPending={hasPending}
        onSyncClick={() => syncToServer(casePresentationService.getAllCaseData)}
      />
    </BHIVShell>
  )
}

export default App

