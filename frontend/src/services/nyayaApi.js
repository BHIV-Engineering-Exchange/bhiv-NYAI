// Nyaya AI API Integration Service
// Connects frontend to the existing Nyaya AI backend
// Includes global interceptor for 5xx errors that routes to ServiceOutage

import axios from 'axios'
import { BASE_URL, NYAI_API_KEY } from '../lib/apiConfig'

const API_BASE_URL = BASE_URL

// Global failure listeners — registered by useResiliency
const _failureListeners = new Set()
export const onBackendFailure = (fn) => { _failureListeners.add(fn); return () => _failureListeners.delete(fn) }
const _emitFailure = (error) => _failureListeners.forEach(fn => fn(error))

// Service outage state - components can subscribe to this
let _isServiceOutage = false
let _serviceOutageError = null
const _outageListeners = new Set()

export const onServiceOutage = (fn) => {
  _outageListeners.add(fn)
  // Immediately notify of current state
  if (_isServiceOutage) fn({ isOutage: true, error: _serviceOutageError })
  return () => _outageListeners.delete(fn)
}
const _emitOutage = (error) => {
  _isServiceOutage = true
  _serviceOutageError = error
  _outageListeners.forEach(fn => fn({ isOutage: true, error }))
}
// Clear outage when backend recovers
export const clearServiceOutage = () => {
  _isServiceOutage = false
  _serviceOutageError = null
  _outageListeners.forEach(fn => fn({ isOutage: false, error: null }))
}
export const isBackendOutage = () => _isServiceOutage

// Configure axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor — inject active trace_id into every request header for backend logging
apiClient.interceptors.request.use((config) => {
  const traceId = window.__gravitas_active_trace_id
  if (traceId) {
    config.headers['X-Trace-ID'] = traceId
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers['Authorization'] = Bearer 
  }
  }
  const path = config.url || ''
  if (NYAI_API_KEY && path.startsWith('/nyaya/')) {
    config.headers['X-API-Key'] = NYAI_API_KEY
  }
  return config
})

// Global interceptor — detects 5xx errors and ECONNREFUSED/timeout
// Routes to ServiceOutage component when backend is down
apiClient.interceptors.response.use(
  (response) => {
    // Clear any previous service outage on successful response
    if (_isServiceOutage) {
      clearServiceOutage()
    }
    return response
  },
  (error) => {
    const status = error.response?.status
    const isServerError = status >= 500
    const isNetworkError = !error.response && (
      error.code === 'ECONNREFUSED' || 
      error.code === 'ERR_NETWORK' || 
      error.code === 'ERR_CONNECTION_REFUSED' ||
      error.message === 'Network Error' ||
      error.message.includes('Failed to fetch')
    )
    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
    
    // Capture error details for the outage handler
    const errorDetails = {
      status,
      isServerError,
      isNetworkError,
      isTimeout,
      message: error.message,
      code: error.code,
      trace_id: error.response?.data?.trace_id || window.__gravitas_active_trace_id || null,
      timestamp: new Date().toISOString()
    }

    if (isServerError || isNetworkError || isTimeout) {
      console.error('[API Interceptor] Backend failure detected:', errorDetails)
      _emitFailure(errorDetails)
      _emitOutage(errorDetails)
    }

    return Promise.reject(error)
  }
)

// Set the active trace_id so the request interceptor can inject it
export const setActiveTraceId = (traceId) => {
  window.__gravitas_active_trace_id = traceId || null
}

function generateTraceId() {
  return 'frontend_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// Case Presentation Service - for case presentation components
export const casePresentationService = {
  // Fetch case summary from backend
  async getCaseSummary(traceId, jurisdiction) {
    try {
      const response = await apiClient.get('/nyaya/case_summary', {
        params: { trace_id: traceId, jurisdiction }
      })
      return {
        success: true,
        data: this._validateCaseSummary(response.data),
        trace_id: traceId
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        http_status: error.response?.status ?? null,
        trace_id: error.response?.data?.trace_id || traceId,
        data: null
      }
    }
  },

  // Fetch legal routes from backend
  async getLegalRoutes(traceId, jurisdiction, caseType) {
    try {
      const response = await apiClient.get('/nyaya/legal_routes', {
        params: { trace_id: traceId, jurisdiction, case_type: caseType }
      })
      return {
        success: true,
        data: this._validateLegalRoutes(response.data),
        trace_id: traceId
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        http_status: error.response?.status ?? null,
        trace_id: error.response?.data?.trace_id || traceId,
        data: null
      }
    }
  },

  // Fetch timeline events from backend
  async getTimeline(traceId, jurisdiction, caseId) {
    try {
      const response = await apiClient.get('/nyaya/timeline', {
        params: { trace_id: traceId, jurisdiction, case_id: caseId }
      })
      return {
        success: true,
        data: this._validateTimeline(response.data),
        trace_id: traceId
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        http_status: error.response?.status ?? null,
        trace_id: error.response?.data?.trace_id || traceId,
        data: null
      }
    }
  },

  // Fetch glossary terms from backend
  async getGlossary(traceId, jurisdiction, caseType) {
    try {
      const response = await apiClient.get('/nyaya/glossary', {
        params: { trace_id: traceId, jurisdiction, case_type: caseType }
      })
      return {
        success: true,
        data: this._validateGlossary(response.data),
        trace_id: traceId
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        http_status: error.response?.status ?? null,
        trace_id: error.response?.data?.trace_id || traceId,
        data: null
      }
    }
  },

  // Fetch jurisdiction info from backend
  async getJurisdictionInfo(jurisdiction) {
    try {
      const response = await apiClient.get('/nyaya/jurisdiction_info', {
        params: { jurisdiction }
      })
      const data = response.data
      if (!data || !data.courtSystem || !data.country) {
        throw new Error('Jurisdiction info response missing required fields: country, courtSystem')
      }
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        http_status: error.response?.status ?? null,
        data: null
      }
    }
  },

  // Fetch advisory recommendation from stored output bucket
  async getRecommendation(traceId) {
    try {
      const response = await apiClient.get(`/nyaya/output/${traceId}`)
      const fullResponse = response.data?.stored_output?.full_response
        || response.data?.stored_output
        || {}
      const recommendation = fullResponse.recommendation
      if (!recommendation?.type) {
        throw new Error('Recommendation missing from stored output')
      }
      return {
        success: true,
        data: recommendation,
        trace_id: traceId
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Recommendation could not be retrieved',
        trace_id: traceId,
        data: {
          type: 'INSUFFICIENT_DATA',
          confidence: 0,
          rationale: 'Recommendation could not be retrieved from stored output.',
          urgency_flag: false
        }
      }
    }
  },

  // Fetch all case presentation data in parallel
  async getAllCaseData(traceId, jurisdiction, caseType, caseId) {
    try {
      const [caseSummary, legalRoutes, timeline, glossary, jurisdictionInfo] = await Promise.all([
        this.getCaseSummary(traceId, jurisdiction),
        this.getLegalRoutes(traceId, jurisdiction, caseType),
        this.getTimeline(traceId, jurisdiction, caseId),
        this.getGlossary(traceId, jurisdiction, caseType),
        this.getJurisdictionInfo(jurisdiction)
      ])
      
      return {
        success: true,
        data: {
          caseSummary: caseSummary.data,
          legalRoutes: legalRoutes.data,
          timeline: timeline.data,
          glossary: glossary.data,
          jurisdictionInfo: jurisdictionInfo.data
        },
        trace_id: traceId
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch case data',
        data: null
      }
    }
  },

  // Strict validators — throw on missing required fields, never coerce to fallback strings

  _validateCaseSummary(data) {
    if (!data || typeof data !== 'object') throw new Error('Case summary response is null or not an object')
    const required = ['title', 'overview', 'jurisdiction', 'confidence', 'summaryAnalysis']
    for (const field of required) {
      if (data[field] == null || data[field] === '') {
        throw new Error(`Case summary missing required field: ${field}`)
      }
    }
    if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) {
      throw new Error(`Case summary confidence out of range: ${data.confidence}`)
    }
    return {
      caseId: data.caseId ?? null,
      title: data.title,
      overview: data.overview,
      keyFacts: Array.isArray(data.keyFacts) ? data.keyFacts : [],
      jurisdiction: data.jurisdiction,
      confidence: data.confidence,
      summaryAnalysis: data.summaryAnalysis,
      dateFiled: data.dateFiled ?? null,
      status: data.status ?? null,
      parties: data.parties ?? null
    }
  },

  _validateLegalRoutes(data) {
    if (!data || typeof data !== 'object') throw new Error('Legal routes response is null or not an object')
    if (!Array.isArray(data.routes) || data.routes.length === 0) {
      throw new Error('Legal routes response contains no routes')
    }
    if (!data.jurisdiction) throw new Error('Legal routes response missing required field: jurisdiction')
    return {
      routes: data.routes.map((route, i) => {
        if (!route.name) throw new Error(`Route[${i}] missing required field: name`)
        if (typeof route.suitability !== 'number') throw new Error(`Route[${i}] missing required field: suitability`)
        return {
          name: route.name,
          description: route.description ?? '',
          recommendation: route.recommendation ?? '',
          suitability: route.suitability,
          estimatedDuration: route.estimatedDuration ?? null,
          estimatedCost: route.estimatedCost ?? null,
          pros: Array.isArray(route.pros) ? route.pros : [],
          cons: Array.isArray(route.cons) ? route.cons : []
        }
      }),
      jurisdiction: data.jurisdiction,
      caseType: data.caseType ?? null
    }
  },

  _validateTimeline(data) {
    if (!data || typeof data !== 'object') throw new Error('Timeline response is null or not an object')
    if (!Array.isArray(data.events) || data.events.length === 0) {
      throw new Error('Timeline response contains no events')
    }
    if (!data.jurisdiction) throw new Error('Timeline response missing required field: jurisdiction')
    const validTypes = ['event', 'deadline', 'milestone', 'step']
    const validStatuses = ['completed', 'pending', 'overdue']
    return {
      events: data.events.map((event, i) => {
        if (!event.title) throw new Error(`Timeline event[${i}] missing required field: title`)
        if (!event.date) throw new Error(`Timeline event[${i}] missing required field: date`)
        if (!validTypes.includes(event.type)) throw new Error(`Timeline event[${i}] invalid type: ${event.type}`)
        if (!validStatuses.includes(event.status)) throw new Error(`Timeline event[${i}] invalid status: ${event.status}`)
        return {
          id: event.id ?? `event_${i}`,
          date: event.date,
          title: event.title,
          description: event.description ?? '',
          type: event.type,
          status: event.status,
          documents: Array.isArray(event.documents) ? event.documents : [],
          parties: Array.isArray(event.parties) ? event.parties : []
        }
      }),
      jurisdiction: data.jurisdiction,
      caseId: data.caseId ?? null
    }
  },

  _validateGlossary(data) {
    if (!data || typeof data !== 'object') throw new Error('Glossary response is null or not an object')
    if (!Array.isArray(data.terms) || data.terms.length === 0) {
      throw new Error('Glossary response contains no terms')
    }
    if (!data.jurisdiction) throw new Error('Glossary response missing required field: jurisdiction')
    return {
      terms: data.terms.map((term, i) => {
        if (!term.term) throw new Error(`Glossary term[${i}] missing required field: term`)
        if (!term.definition) throw new Error(`Glossary term[${i}] missing required field: definition`)
        return {
          term: term.term,
          definition: term.definition,
          context: term.context ?? null,
          relatedTerms: Array.isArray(term.relatedTerms) ? term.relatedTerms : [],
          jurisdiction: term.jurisdiction ?? null,
          confidence: typeof term.confidence === 'number' ? term.confidence : null
        }
      }),
      jurisdiction: data.jurisdiction,
      caseType: data.caseType ?? null
    }
  }
}

// Legal Query Service
export const legalQueryService = {
  // Single jurisdiction query
  async submitQuery(queryData) {
    try {
      const payload = {
        query: queryData.query,
        jurisdiction_hint: queryData.jurisdiction_hint || 'India',
        user_context: {
          role: 'citizen',
          confidence_required: true
        }
      }
      
      // Only add domain_hint if provided
      if (queryData.domain_hint) {
        payload.domain_hint = queryData.domain_hint
      }
      
      console.log('API Request Payload:', payload)
      
      const response = await apiClient.post('/nyaya/query', payload)
      
      return {
        success: true,
        data: response.data,
        trace_id: response.data.trace_id
      }
    } catch (error) {
      console.error('API Error Details:', error.response?.data)
      
      // Extract error message from FastAPI validation error
      let errorMessage = 'Query failed'
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // FastAPI validation errors are arrays
          errorMessage = error.response.data.detail.map(err => 
            `${err.loc.join('.')}: ${err.msg}`
          ).join(', ')
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        error: errorMessage,
        trace_id: error.response?.data?.trace_id
      }
    }
  },

  // Multi-jurisdiction query
  async submitMultiJurisdictionQuery(queryData) {
    try {
      const response = await apiClient.post('/nyaya/multi_jurisdiction', {
        query: queryData.query,
        jurisdictions: queryData.jurisdictions
      })
      
      return {
        success: true,
        data: response.data,
        trace_id: response.data.trace_id
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Multi-jurisdiction query failed',
        trace_id: error.response?.data?.trace_id
      }
    }
  },

  // Explain reasoning
  async explainReasoning(traceId, explanationLevel = 'detailed') {
    try {
      const response = await apiClient.post('/nyaya/explain_reasoning', {
        trace_id: traceId,
        explanation_level: explanationLevel
      })
      
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Reasoning explanation failed'
      }
    }
  },

  // Submit feedback for RL engine
  async submitFeedback(feedbackData) {
    try {
      const response = await apiClient.post('/nyaya/feedback', {
        trace_id: feedbackData.trace_id,
        rating: feedbackData.rating,
        feedback_type: feedbackData.feedback_type || 'correctness',
        comment: feedbackData.comment
      })
      
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Feedback submission failed'
      }
    }
  },

  // Get trace information
  async getTrace(traceId) {
    try {
      const response = await apiClient.get(`/nyaya/trace/${traceId}`)

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Trace retrieval failed'
      }
    }
  },

  // Send RL training signal
  async sendRLSignal({ trace_id, helpful, clear, match }) {
    // Validate input - no UI-side learning logic
    if (!trace_id || typeof trace_id !== 'string' || trace_id.trim().length === 0) {
      return {
        success: false,
        error: 'Invalid trace_id - RL signal cannot be sent'
      }
    }

    // Validate boolean fields
    if (typeof helpful !== 'boolean' || typeof clear !== 'boolean' || typeof match !== 'boolean') {
      return {
        success: false,
        error: 'Invalid signal values - all signals must be boolean'
      }
    }

    try {
      const response = await apiClient.post('/nyaya/rl_signal', {
        trace_id,
        helpful,
        clear,
        match
      })

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'RL signal send failed'
      }
    }
  }
}

// Health check service
export const healthService = {
  async checkHealth() {
    try {
      const response = await apiClient.get('/health')
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: 'Backend service unavailable'
      }
    }
  }
}

// Procedure Service - New endpoints
export const procedureService = {
  async analyzeProcedure(data) {
    try {
      const response = await apiClient.post('/nyaya/procedures/analyze', data)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },

  async getProcedureSummary(country, domain) {
    try {
      const response = await apiClient.get(`/nyaya/procedures/summary/${country}/${domain}`)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },

  async assessEvidence(data) {
    try {
      const response = await apiClient.post('/nyaya/procedures/evidence/assess', data)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },

  async analyzeFailure(data) {
    try {
      const response = await apiClient.post('/nyaya/procedures/failure/analyze', data)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },

  async compareProcedures(data) {
    try {
      const response = await apiClient.post('/nyaya/procedures/compare', data)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },

  async listProcedures() {
    try {
      const response = await apiClient.get('/nyaya/procedures/list')
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },

  async getSchemas() {
    try {
      const response = await apiClient.get('/nyaya/procedures/schemas')
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },

  async getEnhancedAnalysis(jurisdiction, domain) {
    try {
      const response = await apiClient.get(`/nyaya/procedures/enhanced_analysis/${jurisdiction}/${domain}`)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },

  async getDomainClassification(jurisdiction) {
    try {
      const response = await apiClient.get(`/nyaya/procedures/domain_classification/${jurisdiction}`)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  },

  async getLegalSections(jurisdiction, domain) {
    try {
      const response = await apiClient.get(`/nyaya/procedures/legal_sections/${jurisdiction}/${domain}`)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message }
    }
  }
}

export default {
  legalQuery: legalQueryService,
  casePresentation: casePresentationService,
  health: healthService,
  procedure: procedureService
}

// Export the sendRLSignal function directly for convenience
export const sendRLSignal = legalQueryService.sendRLSignal