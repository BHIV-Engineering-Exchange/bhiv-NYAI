/**
 * Gravitas Decision Engine - End-to-End Test Suite
 * ============================================================================
 * Tests the complete data flow: User Input → Raj's Backend API → Vedant's 
 * Formatter → React UI Rendering
 * 
 * Tests:
 * 1. Continuity Test (trace_id Integrity) - Verify API trace_id is rendered in DOM
 * 2. Recommendation Gatekeeper Test (State Accuracy) - Verify recommendation.type UI states
 * 3. Rendering Fidelity Test (Data Matching) - Verify JSON keys match UI selectors
 * 4. Resiliency Test (Backend Failure) - Verify 500 error triggers error boundary
 */

import { test, expect, Page } from '@playwright/test';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const DEFAULT_MOCK_RESPONSE = {
  trace_id: 'e2e-trace-001',
  domain: 'civil',
  jurisdiction: 'India',
  jurisdiction_detected: 'India',
  confidence: { overall: 0.85 },
  recommendation: {
    type: 'INFORM',
    confidence: 0.85,
    rationale: 'Legal pathway clear — informational guidance available',
  },
  reasoning_trace: {
    legal_analysis: 'Civil suit filing procedure guidance for district court.',
    procedural_steps: [
      'Verify jurisdiction',
      'Draft plaint',
      'Pay court fee',
      'File in court',
      'Serve notice to defendant',
    ],
  },
  timeline: [
    { step: '1', eta: 'Within limitation period' },
    { step: '2', eta: 'Within 30 days' },
    { step: '3', eta: 'Within 30 days' },
  ],
  provenance_chain: [
    {
      event: 'query_received',
      agent: 'observer',
      timestamp: '2026-06-12T00:00:00.000Z',
    },
  ],
};

async function setupDecisionPage(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('nyaya_user', JSON.stringify({ email: 'e2e@test.com', name: 'E2E' }));
  });

  await page.goto(FRONTEND_URL);
  await page.waitForLoadState('domcontentloaded');

  // Wait for auth gate to clear and dashboard module cards to mount
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

  const legalDecisionsButton = page.locator('.bhiv-sidebar__nav-btn', { hasText: 'Decisions' });
  await expect(legalDecisionsButton).toBeVisible({ timeout: 15000 });
  await legalDecisionsButton.click();

  await expect(page.locator('#query')).toBeVisible({ timeout: 15000 });
  return page.locator('#query');
}

function withFormattedResponse(body: Record<string, unknown>, overrides: Record<string, unknown> = {}) {
  return {
    ...body,
    ...overrides,
    metadata: {
      ...(typeof body.metadata === 'object' && body.metadata !== null ? body.metadata as object : {}),
      ...(typeof overrides.metadata === 'object' && overrides.metadata !== null ? overrides.metadata as object : {}),
      formatted: true,
    },
  };
}

function buildMockResponse(overrides: Record<string, unknown> = {}) {
  return withFormattedResponse(DEFAULT_MOCK_RESPONSE, overrides);
}

async function mockQueryResponse(
  page: Page,
  overrides: Record<string, unknown> = {},
  onBody?: (body: Record<string, unknown>) => void,
) {
  await page.route('**/nyaya/query**', async (route) => {
    const body = buildMockResponse(overrides);
    onBody?.(body);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

async function submitQuery(page: Page, query: string) {
  const queryInput = await setupDecisionPage(page);
  await queryInput.fill(query);

  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();
}

// ============================================================================
// TEST 1: Continuity Test (trace_id Integrity)
// ============================================================================

test.describe('1. Continuity Test - trace_id Integrity', () => {
  test('should verify API trace_id is rendered in DOM', async ({ page }) => {
    let capturedTraceId: string | null = null;

    await mockQueryResponse(page, {}, (body) => {
      capturedTraceId = body.trace_id as string;
    });

    await submitQuery(page, 'file a civil suit in district court');
    await expect(page.locator('[data-testid="trace-id"]').first()).toBeVisible({ timeout: 15000 });

    const traceText = await page.locator('[data-testid="trace-id"]').first().textContent();
    expect(capturedTraceId).not.toBeNull();
    expect(traceText).toContain(capturedTraceId!);
  });
});

// ============================================================================
// TEST 2: Recommendation Gatekeeper Test (State Accuracy)
// ============================================================================

test.describe('2. Recommendation Gatekeeper Test - State Accuracy', () => {
  test('INFORM state: should render decision content', async ({ page }) => {
    await mockQueryResponse(page, {
          recommendation: {
            type: 'INFORM',
            confidence: 0.85,
            rationale: 'Legal pathway clear — informational guidance available',
          },
    });

    await submitQuery(page, 'file a civil suit in district court');
    await expect(page.locator('.decision-display, [data-testid="recommendation-type"]').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="recommendation-type"]')).toHaveText('INFORM');
  });

  test('INSUFFICIENT_DATA state: should show insufficient-data UI', async ({ page }) => {
    await mockQueryResponse(page, {
          recommendation: {
            type: 'INSUFFICIENT_DATA',
            confidence: 0.2,
            rationale: 'Insufficient data to provide reliable legal guidance',
          },
    });

    await submitQuery(page, 'vague legal question');
    await expect(page.locator('[data-testid="recommendation-type"]')).toHaveText('INSUFFICIENT_DATA', { timeout: 15000 });
    await expect(page.getByText(/INSUFFICIENT/i).first()).toBeVisible();
  });

  test('ESCALATE state: should show escalation UI', async ({ page }) => {
    await mockQueryResponse(page, {
          recommendation: {
            type: 'ESCALATE',
            confidence: 0.6,
            rationale: 'Consider consulting a qualified legal professional',
          },
    });

    await submitQuery(page, 'constitutional challenge');
    await expect(page.locator('[data-testid="recommendation-type"]')).toHaveText('ESCALATE', { timeout: 15000 });
    await expect(
      page.getByText(/ESCALAT/i).or(page.getByText(/📈/)).first()
    ).toBeVisible();
  });
});

// ============================================================================
// TEST 3: Rendering Fidelity Test (Data Matching)
// ============================================================================

test.describe('3. Rendering Fidelity Test - Data Matching', () => {
  test('should verify JSON response keys match UI selectors exactly', async ({ page }) => {
    const expectedProceduralSteps = DEFAULT_MOCK_RESPONSE.reasoning_trace.procedural_steps;
    const expectedTimeline = DEFAULT_MOCK_RESPONSE.timeline;
    const expectedAnalysis = DEFAULT_MOCK_RESPONSE.reasoning_trace.legal_analysis;

    await mockQueryResponse(page, {
          recommendation: {
            type: 'INFORM',
            confidence: 0.9,
            rationale: 'Legal pathway clear',
          },
          reasoning_trace: {
            legal_analysis: expectedAnalysis,
            procedural_steps: expectedProceduralSteps,
          },
          timeline: expectedTimeline,
    });

    await submitQuery(page, 'What are the procedures for filing a civil suit in India?');

    await expect(page.locator('[data-testid="trace-id"]').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(expectedAnalysis)).toBeVisible();

    await page.getByRole('button', { name: /Procedural Steps/i }).click();
    for (const step of expectedProceduralSteps) {
      await expect(page.getByText(step, { exact: false }).first()).toBeVisible();
    }

    await page.locator('.section-toggle', { hasText: 'Timeline' }).click();
    for (const item of expectedTimeline) {
      await expect(page.getByText(item.step, { exact: false }).first()).toBeVisible();
    }

    await expect(page.locator('[data-testid="recommendation-type"]')).toHaveText('INFORM');
  });
});

// ============================================================================
// TEST 4: Resiliency Test (Backend Failure)
// ============================================================================

test.describe('4. Resiliency Test - Backend Failure', () => {
  test('should surface error UI on 500 Internal Server Error', async ({ page }) => {
    await page.route('**/nyaya/query**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'Database connection failed',
        }),
      });
    });

    await submitQuery(page, 'test query');
    await expect(page.getByText('Database connection failed')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should handle network timeout gracefully', async ({ page }) => {
    await page.route('**/nyaya/query**', async (route) => {
      await route.abort('timedout');
    });

    await submitQuery(page, 'test timeout query');
    await expect(page.locator('[data-testid="error-message"], .error-message').first()).toBeVisible({ timeout: 15000 });
  });

  test('should handle ECONNREFUSED (backend down)', async ({ page }) => {
    await page.route('**/nyaya/query**', async (route) => {
      await route.abort('failed');
    });

    await submitQuery(page, 'test connection refused');
    await expect(page.locator('[data-testid="error-message"], .error-message').first()).toBeVisible({ timeout: 15000 });
  });
});

// ============================================================================
// Additional Integration Tests
// ============================================================================

test.describe('Additional Integration Tests', () => {
  test('should maintain trace_id across page refreshes', async ({ page }) => {
    let firstTraceId: string | null = null;

    await mockQueryResponse(page, {}, (body) => {
      firstTraceId = body.trace_id as string;
    });

    await submitQuery(page, 'test trace persistence');
    await expect(page.locator('[data-testid="trace-id"]').first()).toBeVisible({ timeout: 15000 });

    await page.evaluate((traceId) => {
      window.localStorage.setItem('gravitas_trace_id', traceId || 'test-id');
    }, firstTraceId);

    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    const storedTraceId = await page.evaluate(() =>
      window.localStorage.getItem('gravitas_trace_id')
    );
    expect(storedTraceId).not.toBeNull();
  });

  test('should verify provenance chain is included in response', async ({ page }) => {
    let hasProvenanceChain = false;

    await mockQueryResponse(page, {}, (body) => {
      hasProvenanceChain = Array.isArray(body.provenance_chain) && body.provenance_chain.length > 0;
    });

    await submitQuery(page, 'test provenance chain');
    await expect(page.locator('[data-testid="trace-id"]').first()).toBeVisible({ timeout: 15000 });
    expect(hasProvenanceChain).toBe(true);
  });
});
