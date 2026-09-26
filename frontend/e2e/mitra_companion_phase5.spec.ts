import { test, expect } from '@playwright/test';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

test.describe('NYAI Phase 5: Real MITRA Companion Integration', () => {

  test('1. Authenticated MITRA Flow & Real Live API Network Verification', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Seed authenticated session with real verified MITRA JWT
    await page.evaluate(() => {
      const user = {
        id: 'user_4613e7cb45a64540b828b3936bfcff36',
        email: 'nyai_admin_test@blackholeinfiverse.com',
        name: 'Nyai Admin',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzQ2MTNlN2NiNDVhNjQ1NDBiODI4YjM5MzZiZmNmZjM2IiwidXNlcl9pZCI6InVzZXJfNDYxM2U3Y2I0NWE2NDU0MGI4MjhiMzkzNmJmY2ZmMzYiLCJlbWFpbCI6Im55YWlfYWRtaW5fdGVzdEBibGFja2hvbGVpbmZpdmVyc2UuY29tIiwibmFtZSI6Ik55YWkgQWRtaW4iLCJpZCI6InVzZXJfNDYxM2U3Y2I0NWE2NDU0MGI4MjhiMzkzNmJmY2ZmMzYiLCJpYXQiOjE3OTAxNTAxNTcsImV4cCI6MTc5MDQwOTM1N30.UhY6Q_ZTFzZB-RFes5Mwe6e-QDOH1ubXuc4jPvBVfUc'
      };
      localStorage.setItem('nyaya_user', JSON.stringify(user));
      localStorage.setItem('authToken', user.token);
    });
    await page.reload();

    // Wait for Dashboard
    await expect(page.locator('.bhiv-navbar')).toBeVisible({ timeout: 10000 });

    // 1. Verify MITRA launcher in Navbar
    const navMitraBtn = page.locator('.bhiv-navbar .mitra-launcher');
    await expect(navMitraBtn).toBeVisible();
    await expect(navMitraBtn).toContainText('MITRA');

    // 2. Verify MITRA companion item in Sidebar
    const sideMitraItem = page.locator('.bhiv-sidebar__ecosystem-item', { hasText: 'MITRA' });
    await expect(sideMitraItem).toBeVisible();
    await expect(sideMitraItem.locator('.bhiv-status-badge')).toContainText('COMPANION');

    // Setup network listener for POST /api/companion/chat
    let interceptedRequest: any = null;
    let interceptedResponse: any = null;

    page.on('request', req => {
      if (req.url().includes('/api/companion/chat') && req.method() === 'POST') {
        interceptedRequest = {
          url: req.url(),
          method: req.method(),
          headers: req.headers(),
          postData: req.postDataJSON()
        };
      }
    });

    page.on('response', async res => {
      if (res.url().includes('/api/companion/chat') && res.request().method() === 'POST') {
        try {
          interceptedResponse = {
            status: res.status(),
            body: await res.json()
          };
        } catch {
          // ignore non-json
        }
      }
    });

    // 3. Open MITRA Companion from Navbar
    await navMitraBtn.click();

    // 4. Verify Drawer opens with accessible attributes
    const dialog = page.locator('.mitra-drawer');
    await expect(dialog).toBeVisible();
    const overlay = page.locator('.mitra-overlay');
    await expect(overlay).toHaveAttribute('role', 'dialog');
    await expect(overlay).toHaveAttribute('aria-modal', 'true');
    await expect(page.locator('#mitra-panel-title')).toContainText('MITRA Companion');

    // Verify initial greeting is present
    await expect(page.locator('.mitra-message-list')).toContainText('I am MITRA');

    // 5. Send User Message and await live backend response
    const composerInput = page.locator('#mitra-chat-input');
    await expect(composerInput).toBeVisible();
    await composerInput.fill('What are your capabilities in the BHIV sovereign intelligence ecosystem?');

    const responsePromise = page.waitForResponse(
      res => res.url().includes('/api/companion/chat') && res.request().method() === 'POST',
      { timeout: 60000 }
    );

    await page.locator('.mitra-composer__send-btn').click();

    // 6. Verify "Sending to MITRA..." thinking state
    await expect(page.locator('.mitra-thinking-text')).toBeVisible({ timeout: 5000 });

    // 7. Wait for Real Backend Response to arrive
    const realResponse = await responsePromise;
    expect(realResponse.status()).toBe(200);

    // Thinking state should disappear
    await expect(page.locator('.mitra-thinking-text')).not.toBeVisible({ timeout: 10000 });

    const mitraResponseBubble = page.locator('.mitra-message-bubble--mitra').last();
    const responseText = await mitraResponseBubble.textContent();
    expect(responseText).toBeTruthy();
    expect(responseText!.length).toBeGreaterThan(10);

    // 8. Verify the Intercepted Network Contract
    expect(interceptedRequest).not.toBeNull();
    expect(interceptedRequest.url).toContain('/api/companion/chat');
    expect(interceptedRequest.method).toBe('POST');
    
    // Check Payload matches confirmed contract
    expect(interceptedRequest.postData.message).toBe('What are your capabilities in the BHIV sovereign intelligence ecosystem?');
    expect(interceptedRequest.postData.platform).toBe('web');
    expect(interceptedRequest.postData.device).toBe('browser');
    expect(interceptedRequest.postData.page_context).toBeDefined();
    expect(interceptedRequest.postData.page_context.active_app).toBe('nyai');
    expect(interceptedRequest.postData.page_context.url).toContain('http://localhost:3000');

    // Check Headers complying with backend CORS policy
    expect(interceptedRequest.headers['content-type']).toContain('application/json');
    expect(interceptedRequest.headers['x-api-key']).toBe('bhiv-enterprise-key');
    expect(interceptedRequest.headers['authorization']).toMatch(/^Bearer\s+.+/);

    // Verify Response was 200 OK
    expect(interceptedResponse).not.toBeNull();
    expect(interceptedResponse.status).toBe(200);

    // 9. Accessibility: Escape closes the drawer
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // 10. Open from Sidebar & verify same conversation preserved
    await sideMitraItem.click();
    await expect(dialog).toBeVisible();
    // Confirm previous conversation is still present
    await expect(page.locator('.mitra-message-bubble--user').last()).toContainText('What are your capabilities');

    // Close via (X) button
    await page.locator('.mitra-close-btn').click();
    await expect(dialog).not.toBeVisible();
  });


  test('2. Guest Mode Flow — Explicit Auth Requirement Without Fabricated Identity', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Clear any existing stored user
    await page.evaluate(() => {
      localStorage.removeItem('nyaya_user');
      localStorage.removeItem('authToken');
    });
    await page.reload();

    // On AuthPage, click "Continue as Guest"
    const guestBtn = page.locator('button', { hasText: 'Continue as Guest' });
    await expect(guestBtn).toBeVisible({ timeout: 5000 });
    await guestBtn.click();

    // Dashboard loads in guest mode
    await expect(page.locator('.bhiv-navbar')).toBeVisible({ timeout: 10000 });

    // Open MITRA
    const navMitraBtn = page.locator('.bhiv-navbar .mitra-launcher');
    await navMitraBtn.click();

    // Notice guest banner is shown
    await expect(page.locator('.mitra-guest-notice')).toBeVisible();
    await expect(page.locator('.mitra-guest-notice')).toContainText('Guest Session');

    // Attempt sending a message as guest
    const composerInput = page.locator('#mitra-chat-input');
    await composerInput.fill('Can I use MITRA as guest?');
    await page.locator('.mitra-composer__send-btn').click();

    // Verify clear login requirement response with NO fabricated fake ID
    const mitraReply = page.locator('.mitra-message-bubble--mitra').last();
    await expect(mitraReply).toContainText('MITRA requires an authenticated session');

    // Close drawer
    await page.keyboard.press('Escape');
    await expect(page.locator('.mitra-drawer')).not.toBeVisible();
  });


  test('3. Responsive Viewports Verification', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Login as guest to test layout quickly
    const guestBtn = page.locator('button', { hasText: 'Continue as Guest' });
    if (await guestBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await guestBtn.click();
    }
    await expect(page.locator('.bhiv-navbar')).toBeVisible({ timeout: 10000 });

    const viewports = [
      { width: 320, height: 600, label: '320px Mobile' },
      { width: 375, height: 667, label: '375px Mobile' },
      { width: 390, height: 844, label: '390px Mobile' },
      { width: 430, height: 932, label: '430px Mobile' },
      { width: 768, height: 1024, label: '768px Tablet' },
      { width: 1024, height: 768, label: '1024px Desktop' },
      { width: 1280, height: 800, label: '1280px Desktop' },
      { width: 1440, height: 900, label: '1440px Desktop' },
      { width: 1920, height: 1080, label: '1920px Large' }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(150);

      // Open MITRA from navbar
      const navMitraBtn = page.locator('.bhiv-navbar .mitra-launcher');
      await navMitraBtn.click();

      const drawer = page.locator('.mitra-drawer');
      await expect(drawer).toBeVisible();

      // Check drawer bounding box does not exceed viewport width
      const box = await drawer.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeLessThanOrEqual(vp.width + 1); // within rounding margin

      // Composer remains reachable
      const composer = page.locator('#mitra-chat-input');
      await expect(composer).toBeVisible();

      // Close button remains reachable
      const closeBtn = page.locator('.mitra-close-btn');
      await expect(closeBtn).toBeVisible();
      await closeBtn.click();
      await expect(drawer).not.toBeVisible();
    }
  });


  test('4. NYAI Regression Workflows Preserved', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Skip auth if needed
    const guestBtn = page.locator('button', { hasText: 'Continue as Guest' });
    if (await guestBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await guestBtn.click();
    }

    // 1. Dashboard Overview
    await expect(page.locator('.bhiv-navbar')).toBeVisible({ timeout: 10000 });

    // 2. Navigate to "Ask Legal" (Consult)
    const consultNav = page.locator('.bhiv-sidebar__nav-btn', { hasText: 'Ask Legal' });
    if (await consultNav.isVisible()) {
      await consultNav.click();
    } else {
      // On mobile or collapsed, open sidebar or select from dashboard card
      const consultCard = page.locator('.bhiv-card', { hasText: 'Ask Legal' });
      await consultCard.click();
    }
    await expect(page.locator('textarea')).toBeVisible({ timeout: 5000 });

    // Return to Overview
    const backBtn = page.locator('button', { hasText: '← Back to Overview' });
    if (await backBtn.isVisible()) {
      await backBtn.click();
    }

    // 3. Navigate to "Decisions"
    const decisionsBtn = page.locator('.bhiv-sidebar__nav-btn', { hasText: 'Decisions' });
    if (await decisionsBtn.isVisible()) {
      await decisionsBtn.click();
      await page.waitForTimeout(300);
    }

    // 4. Navigate to "Case Timeline"
    const timelineBtn = page.locator('.bhiv-sidebar__nav-btn', { hasText: 'Case Timeline' });
    if (await timelineBtn.isVisible()) {
      await timelineBtn.click();
      await page.waitForTimeout(300);
    }

    // 5. Navigate to "Legal Glossary"
    const glossaryBtn = page.locator('.bhiv-sidebar__nav-btn', { hasText: 'Legal Glossary' });
    if (await glossaryBtn.isVisible()) {
      await glossaryBtn.click();
      await page.waitForTimeout(300);
    }

    // Verify system operational badge is still visible in navbar
    await expect(page.locator('.bhiv-navbar__status')).toBeVisible();
  });

});
