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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {/* Loading skeleton for case presentation */}
        <div className="consultation-card" style={{ padding: '30px' }}>
          <SkeletonLoader type="card" count={5} />
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p style={{ color: '#6c757d', fontSize: '14px' }}>
              Fetching case data from backend for {currentJurisdiction} jurisdiction...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Error notification with retry option */}
      {error && (
        <div style={{
          padding: '20px',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          border: '1px solid rgba(220, 53, 69, 0.3)',
          borderRadius: '8px',
          color: '#721c24'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            gap: '15px'
          }}>
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Error Loading Case Data
              </strong>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5' }}>
                {error}. The backend may be unreachable or returned an unexpected response.
              </p>
            </div>
            <button
              onClick={handleRetry}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                whiteSpace: 'nowrap'
              }}
            >
              Retry ({retryCount})
            </button>
          </div>
        </div>
      )}

      {/* Jurisdiction Switcher */}
      <div className="consultation-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
          <h3 style={{ margin: 0, color: '#2c3e50', fontWeight: '600' }}>Select Jurisdiction</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['India', 'UK', 'UAE'].map((j) => (
              <button
                key={j}
                onClick={() => handleJurisdictionChange(j)}
                style={{
                  padding: '10px 20px',
                  border: currentJurisdiction === j ? '2px solid #007bff' : '2px solid #e9ecef',
                  borderRadius: '8px',
                  backgroundColor: currentJurisdiction === j ? 'rgba(0, 123, 255, 0.1)' : '#fff',
                  color: currentJurisdiction === j ? '#007bff' : '#495057',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                {j}
              </button>
            ))}
          </div>
        </div>
      </div>

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
  const menuRef = useRef(null)

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
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <button
              onClick={handleBackToDashboard}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '10px 20px',
                color: '#fff',
                cursor: 'pointer',
                marginBottom: '20px',
                fontSize: '14px'
              }}
            >
              ← Back to Dashboard
            </button>
            <ErrorBoundary>
              <LegalQueryCard onResponseReceived={setLastResponse} isOffline={isOffline} />
            </ErrorBoundary>
          </div>
        )
      case 'law-agent':
        return (
          <div>
            <button
              onClick={handleBackToDashboard}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '10px 20px',
                color: '#fff',
                cursor: 'pointer',
                marginBottom: '20px',
                fontSize: '14px',
                marginLeft: '20px'
              }}
            >
              ← Back to Dashboard
            </button>
            <ErrorBoundary>
              <LawAgentView responseData={lastResponse} />
            </ErrorBoundary>
          </div>
        )
      case 'decision':
        return (
          <div>
            <button
              onClick={handleBackToDashboard}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '10px 20px',
                color: '#fff',
                cursor: 'pointer',
                marginBottom: '20px',
                fontSize: '14px',
                marginLeft: '20px'
              }}
            >
              ← Back to Dashboard
            </button>
            <ErrorBoundary>
              <DecisionPage />
            </ErrorBoundary>
          </div>
        )
      case 'decision-draft':
        return (
          <div>
            <button
              onClick={handleBackToDashboard}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '10px 20px',
                color: '#fff',
                cursor: 'pointer',
                marginBottom: '20px',
                fontSize: '14px',
                marginLeft: '20px'
              }}
            >
              ← Back to Dashboard
            </button>
            <ErrorBoundary>
              <LegalDecisionDocument onResponseReceived={setLastResponse} isOffline={isOffline} />
            </ErrorBoundary>
          </div>
        )
      case 'procedure':
        return (
          <ErrorBoundary>
            <JurisdictionProcedure onBack={handleBackToDashboard} />
          </ErrorBoundary>
        )
      case 'timeline':
        return (
          <ErrorBoundary>
            <CaseTimelineGenerator onBack={handleBackToDashboard} />
          </ErrorBoundary>
        )
      case 'glossary':
        return (
          <ErrorBoundary>
            <LegalGlossary onBack={handleBackToDashboard} />
          </ErrorBoundary>
        )
      case 'docs':
        return (
          <ErrorBoundary>
            <Documentation onBack={handleBackToDashboard} />
          </ErrorBoundary>
        )
      case 'draft':
        return (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <button
              onClick={handleBackToDashboard}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '10px 20px',
                color: '#fff',
                cursor: 'pointer',
                marginBottom: '20px',
                fontSize: '14px'
              }}
            >
              ← Back to Dashboard
            </button>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>✍️</div>
              <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '12px' }}>Generate Legal Draft</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '24px' }}>AI document generation coming soon</p>
            </div>
          </div>
        )
      case 'compliance':
        return (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <button
              onClick={handleBackToDashboard}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '10px 20px',
                color: '#fff',
                cursor: 'pointer',
                marginBottom: '20px',
                fontSize: '14px'
              }}
            >
              ← Back to Dashboard
            </button>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>✓</div>
              <h2 style={{ color: '#fff', fontSize: '24px', marginBottom: '12px' }}>Compliance Risk Check</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '24px' }}>Compliance verification coming soon</p>
            </div>
          </div>
        )
      default:
        return <LegalOSDashboard onModuleSelect={handleModuleSelect} />
    }
  }

  return (
    <div className="container" style={{ paddingTop: '100px', position: 'relative' }}>
      {/* Galaxy Background */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <Galaxy 
          mouseInteraction
          density={0.8}
          glowIntensity={0.2}
          saturation={0}
          hueShift={200}
          twinkleIntensity={0.4}
          rotationSpeed={0.05}
          starSpeed={0.3}
          speed={0.8}
        />
      </div>

      {/* Floating Pill-Shaped Glassmorphism Navbar */}
      <nav style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        padding: '12px 24px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '9999px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)'
      }}>
        <div 
          onClick={handleBackToDashboard}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer'
          }}
        >
          <img 
            src="/03.svg" 
            alt="NYAI Logo" 
            style={{ 
              width: '40px', 
              height: '40px', 
              objectFit: 'contain'
            }} 
          />
          <span style={{
            fontSize: '16px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.7) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            NYAI
          </span>
        </div>
        <button
          onClick={() => {
            if (menuRef.current) {
              menuRef.current.toggle();
            }
          }}
          style={{
            padding: '8px 20px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '9999px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Menu
        </button>
      </nav>

      <StaggeredMenu
        ref={menuRef}
        items={[
          { label: 'Chat Mode', value: 'consult' },
          { label: 'Decision Draft', value: 'decision-draft' },
          { label: 'Law Agent', value: 'law-agent' },
          { label: 'Explore', value: 'docs' },
          { label: user.name, value: 'profile' },
          { label: 'Logout', value: 'logout' }
        ]}
        accentColor="#8c929b"
        onItemClick={(item) => {
          if (item.value === 'logout') {
            handleLogout();
          } else {
            setActiveView(item.value);
          }
        }}
      />

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {renderView()}
      </div>

      {/* Degraded Mode Banner — mounts globally, visible across all views */}
      <OfflineBanner
        isOffline={isOffline}
        isSyncing={isSyncing}
        hasPending={hasPending}
        onSyncClick={() => syncToServer(casePresentationService.getAllCaseData)}
      />
    </div>
  )
}

export default App
