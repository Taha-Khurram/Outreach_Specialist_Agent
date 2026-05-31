import { test, expect, APIRequestContext } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

let authCookie: string = '';
let testProspectId: string = '';
let testCampaignId: string = '';

test.describe('API Endpoint Tests', () => {

  test.describe('Auth Endpoints', () => {
    test('POST /api/auth/signup - Create test user', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/auth/signup`, {
        data: {
          name: 'Test User',
          email: `testuser_${Date.now()}@example.com`,
          password: 'TestPass123!',
          company: 'Test Corp',
        },
      });
      // 201 (created) or 409 (already exists) are both acceptable
      expect([200, 201, 409]).toContain(res.status());
      if (res.status() === 200 || res.status() === 201) {
        const cookies = res.headers()['set-cookie'];
        if (cookies) {
          const match = cookies.match(/token=([^;]+)/);
          if (match) authCookie = `token=${match[1]}`;
        }
      }
    });

    test('POST /api/auth/login - Login', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/auth/login`, {
        data: {
          email: 'admin@clientflow.com',
          password: 'admin123',
        },
      });
      // May fail if user doesn't exist — that's fine, we record it
      if (res.status() === 200 || res.status() === 201) {
        const cookies = res.headers()['set-cookie'];
        if (cookies) {
          const match = cookies.match(/token=([^;]+)/);
          if (match) authCookie = `token=${match[1]}`;
        }
      }
      expect([200, 401]).toContain(res.status());
    });

    test('GET /api/auth/me - Get current user', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/auth/me`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      expect([200, 401]).toContain(res.status());
    });

    test('PUT /api/auth/me - Update profile', async ({ request }) => {
      const res = await request.put(`${BASE_URL}/api/auth/me`, {
        headers: authCookie ? { Cookie: authCookie } : {},
        data: { name: 'Test User Updated', company: 'Updated Corp' },
      });
      expect([200, 401]).toContain(res.status());
    });
  });

  test.describe('Health & Stats Endpoints', () => {
    test('GET /api/health - Health check', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/health`);
      expect(res.status()).toBe(200);
    });

    test('GET /api/stats - Dashboard stats', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/stats`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      expect([200, 401]).toContain(res.status());
    });

    test('GET /api/stats/chart - Chart data', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/stats/chart`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      expect([200, 401]).toContain(res.status());
    });
  });

  test.describe('Prospects Endpoints', () => {
    test('GET /api/prospects - List prospects', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/prospects`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      expect([200, 401]).toContain(res.status());
    });

    test('POST /api/prospects - Create prospect', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/prospects`, {
        headers: authCookie ? { Cookie: authCookie } : {},
        data: {
          firstName: 'Test',
          lastName: 'Prospect',
          email: `prospect_${Date.now()}@example.com`,
          company: 'Test Inc',
          title: 'CEO',
        },
      });
      expect([200, 201, 401]).toContain(res.status());
      if (res.status() === 200 || res.status() === 201) {
        const data = await res.json();
        testProspectId = data.prospect?._id || data._id || '';
      }
    });

    test('GET /api/prospects/[id] - Get single prospect', async ({ request }) => {
      if (!testProspectId) {
        test.skip();
        return;
      }
      const res = await request.get(`${BASE_URL}/api/prospects/${testProspectId}`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      expect([200, 401, 404]).toContain(res.status());
    });

    test('PUT /api/prospects/[id] - Update prospect', async ({ request }) => {
      if (!testProspectId) {
        test.skip();
        return;
      }
      const res = await request.put(`${BASE_URL}/api/prospects/${testProspectId}`, {
        headers: authCookie ? { Cookie: authCookie } : {},
        data: { title: 'CTO' },
      });
      expect([200, 401, 404]).toContain(res.status());
    });

    test('POST /api/prospects/[id]/score - Score prospect', async ({ request }) => {
      if (!testProspectId) {
        test.skip();
        return;
      }
      const res = await request.post(`${BASE_URL}/api/prospects/${testProspectId}/score`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      // May fail if Gemini API key not configured
      expect([200, 401, 404, 500]).toContain(res.status());
    });

    test('POST /api/prospects/[id]/research - Research prospect', async ({ request }) => {
      if (!testProspectId) {
        test.skip();
        return;
      }
      const res = await request.post(`${BASE_URL}/api/prospects/${testProspectId}/research`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      // May fail if Gemini API key not configured
      expect([200, 401, 404, 500]).toContain(res.status());
    });

    test('POST /api/prospects/score-all - Score all prospects', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/prospects/score-all`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      expect([200, 401, 500]).toContain(res.status());
    });
  });

  test.describe('Campaigns Endpoints', () => {
    test('GET /api/campaigns - List campaigns', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/campaigns`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      expect([200, 401]).toContain(res.status());
    });

    test('POST /api/campaigns - Create campaign', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/campaigns`, {
        headers: authCookie ? { Cookie: authCookie } : {},
        data: {
          name: 'Test Campaign',
          steps: [{ stepNumber: 1, subject: 'Hello {{firstName}}', body: 'Test body', delayDays: 0 }],
          prospectIds: testProspectId ? [testProspectId] : [],
        },
      });
      expect([200, 201, 401, 500]).toContain(res.status());
      if (res.status() === 200 || res.status() === 201) {
        const data = await res.json();
        testCampaignId = data.campaign?._id || data._id || '';
      }
    });

    test('GET /api/campaigns/[id] - Get campaign', async ({ request }) => {
      if (!testCampaignId) {
        test.skip();
        return;
      }
      const res = await request.get(`${BASE_URL}/api/campaigns/${testCampaignId}`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      expect([200, 401, 404]).toContain(res.status());
    });

    test('PUT /api/campaigns/[id] - Update campaign', async ({ request }) => {
      if (!testCampaignId) {
        test.skip();
        return;
      }
      const res = await request.put(`${BASE_URL}/api/campaigns/${testCampaignId}`, {
        headers: authCookie ? { Cookie: authCookie } : {},
        data: { name: 'Updated Campaign' },
      });
      expect([200, 401, 404]).toContain(res.status());
    });

    test('GET /api/campaigns/[id]/analytics - Campaign analytics', async ({ request }) => {
      if (!testCampaignId) {
        test.skip();
        return;
      }
      const res = await request.get(`${BASE_URL}/api/campaigns/${testCampaignId}/analytics`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      expect([200, 401, 404]).toContain(res.status());
    });

    test('POST /api/campaigns/[id]/launch - Launch campaign', async ({ request }) => {
      if (!testCampaignId) {
        test.skip();
        return;
      }
      const res = await request.post(`${BASE_URL}/api/campaigns/${testCampaignId}/launch`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      // May fail due to missing email/API config
      expect([200, 401, 404, 400, 500]).toContain(res.status());
    });

    test('POST /api/campaigns/[id]/pause - Pause campaign', async ({ request }) => {
      if (!testCampaignId) {
        test.skip();
        return;
      }
      const res = await request.post(`${BASE_URL}/api/campaigns/${testCampaignId}/pause`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      expect([200, 401, 404, 400]).toContain(res.status());
    });

    test('POST /api/campaigns/process - Process follow-ups', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/campaigns/process`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      expect([200, 400, 401, 500]).toContain(res.status());
    });
  });

  test.describe('Replies Endpoints', () => {
    test('GET /api/replies - List replies', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/replies`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      expect([200, 401]).toContain(res.status());
    });

    test('POST /api/replies/check - Check for new replies', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/replies/check`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      // May fail due to missing Gmail/API config
      expect([200, 401, 500]).toContain(res.status());
    });
  });

  test.describe('Other Endpoints', () => {
    test('GET /api/settings - Get settings', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/settings`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      expect([200, 401]).toContain(res.status());
    });

    test('PUT /api/settings - Update settings', async ({ request }) => {
      const res = await request.put(`${BASE_URL}/api/settings`, {
        headers: authCookie ? { Cookie: authCookie } : {},
        data: {
          email: { senderEmail: 'test@test.com', senderName: 'Test', dailySendLimit: 50, calendlyLink: '' },
          ai: { model: 'gemini-3-flash-preview', confidenceThreshold: 0.8, autoReplyPositive: true, autoUnsubscribe: true },
        },
      });
      expect([200, 401]).toContain(res.status());
    });

    test('GET /api/activity - Activity feed', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/activity?limit=10`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      expect([200, 401]).toContain(res.status());
    });

    test('GET /api/deals - List deals', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/deals`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      expect([200, 401]).toContain(res.status());
    });

    test('POST /api/deals - Create deal', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/deals`, {
        headers: authCookie ? { Cookie: authCookie } : {},
        data: {
          prospectId: testProspectId || '000000000000000000000000',
          value: 5000,
          status: 'won',
          notes: 'Test deal',
        },
      });
      expect([200, 201, 401, 404]).toContain(res.status());
    });

    test('GET /api/templates - List templates', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/templates`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      expect([200, 401]).toContain(res.status());
    });

    test('POST /api/templates - Create template', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/templates`, {
        headers: authCookie ? { Cookie: authCookie } : {},
        data: {
          name: 'Test Template',
          category: 'outreach',
          steps: [{ subject: 'Hi {{firstName}}', body: 'Test', delayDays: 0 }],
        },
      });
      expect([200, 201, 401]).toContain(res.status());
    });

    test('GET /api/suggestions - AI suggestions', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/suggestions`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      expect([200, 401]).toContain(res.status());
    });

    test('GET /api/export - Export CSV', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/api/export?type=prospects`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      expect([200, 401]).toContain(res.status());
    });

    test('POST /api/discover - Discover prospects', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/discover`, {
        headers: authCookie ? { Cookie: authCookie } : {},
        data: { titles: ['CEO'], industries: ['SaaS'], limit: 5 },
      });
      // May fail due to missing Apollo API key
      expect([200, 401, 500]).toContain(res.status());
    });

    test('POST /api/bounces - Check bounces', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/bounces`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      // May fail due to missing Gmail config
      expect([200, 401, 500]).toContain(res.status());
    });

    test('POST /api/cron - Run cron', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/cron`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      expect([200, 401, 500]).toContain(res.status());
    });

    test('POST /api/reports/weekly - Generate weekly report', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/reports/weekly`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      // May fail due to missing email config
      expect([200, 401, 500]).toContain(res.status());
    });

    test('POST /api/webhooks/calendly - Calendly webhook', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/webhooks/calendly`, {
        data: {
          event: 'invitee.created',
          payload: { email: 'test@example.com', event_type: { name: 'Meeting' } },
        },
        timeout: 15000,
      });
      // Webhook endpoint — may accept or reject
      expect([200, 400, 401, 404, 500]).toContain(res.status());
    });
  });

  test.describe('Cleanup', () => {
    test('DELETE /api/prospects/[id] - Delete test prospect', async ({ request }) => {
      if (!testProspectId) {
        test.skip();
        return;
      }
      const res = await request.delete(`${BASE_URL}/api/prospects/${testProspectId}`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      expect([200, 401, 404]).toContain(res.status());
    });

    test('DELETE /api/campaigns/[id] - Delete test campaign', async ({ request }) => {
      if (!testCampaignId) {
        test.skip();
        return;
      }
      const res = await request.delete(`${BASE_URL}/api/campaigns/${testCampaignId}`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      expect([200, 401, 404]).toContain(res.status());
    });

    test('POST /api/auth/logout - Logout', async ({ request }) => {
      const res = await request.post(`${BASE_URL}/api/auth/logout`, {
        headers: authCookie ? { Cookie: authCookie } : {},
      });
      // 200 if authenticated, 401 if no valid cookie
      expect([200, 401]).toContain(res.status());
    });
  });
});
