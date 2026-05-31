# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.spec.ts >> API Endpoint Tests >> Campaigns Endpoints >> POST /api/campaigns/process - Process follow-ups
- Location: tests\api.spec.ts:249:9

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 400
Received array: [200, 401, 500]
```

# Test source

```ts
  153 |       const res = await request.post(`${BASE_URL}/api/prospects/${testProspectId}/research`, {
  154 |         headers: authCookie ? { Cookie: authCookie } : {},
  155 |       });
  156 |       // May fail if Gemini API key not configured
  157 |       expect([200, 401, 404, 500]).toContain(res.status());
  158 |     });
  159 | 
  160 |     test('POST /api/prospects/score-all - Score all prospects', async ({ request }) => {
  161 |       const res = await request.post(`${BASE_URL}/api/prospects/score-all`, {
  162 |         headers: authCookie ? { Cookie: authCookie } : {},
  163 |       });
  164 |       expect([200, 401, 500]).toContain(res.status());
  165 |     });
  166 |   });
  167 | 
  168 |   test.describe('Campaigns Endpoints', () => {
  169 |     test('GET /api/campaigns - List campaigns', async ({ request }) => {
  170 |       const res = await request.get(`${BASE_URL}/api/campaigns`, {
  171 |         headers: authCookie ? { Cookie: authCookie } : {},
  172 |       });
  173 |       expect([200, 401]).toContain(res.status());
  174 |     });
  175 | 
  176 |     test('POST /api/campaigns - Create campaign', async ({ request }) => {
  177 |       const res = await request.post(`${BASE_URL}/api/campaigns`, {
  178 |         headers: authCookie ? { Cookie: authCookie } : {},
  179 |         data: {
  180 |           name: 'Test Campaign',
  181 |           steps: [{ stepNumber: 1, subject: 'Hello {{firstName}}', body: 'Test body', delayDays: 0 }],
  182 |           prospectIds: testProspectId ? [testProspectId] : [],
  183 |         },
  184 |       });
  185 |       expect([200, 201, 401, 500]).toContain(res.status());
  186 |       if (res.status() === 200 || res.status() === 201) {
  187 |         const data = await res.json();
  188 |         testCampaignId = data.campaign?._id || data._id || '';
  189 |       }
  190 |     });
  191 | 
  192 |     test('GET /api/campaigns/[id] - Get campaign', async ({ request }) => {
  193 |       if (!testCampaignId) {
  194 |         test.skip();
  195 |         return;
  196 |       }
  197 |       const res = await request.get(`${BASE_URL}/api/campaigns/${testCampaignId}`, {
  198 |         headers: authCookie ? { Cookie: authCookie } : {},
  199 |       });
  200 |       expect([200, 401, 404]).toContain(res.status());
  201 |     });
  202 | 
  203 |     test('PUT /api/campaigns/[id] - Update campaign', async ({ request }) => {
  204 |       if (!testCampaignId) {
  205 |         test.skip();
  206 |         return;
  207 |       }
  208 |       const res = await request.put(`${BASE_URL}/api/campaigns/${testCampaignId}`, {
  209 |         headers: authCookie ? { Cookie: authCookie } : {},
  210 |         data: { name: 'Updated Campaign' },
  211 |       });
  212 |       expect([200, 401, 404]).toContain(res.status());
  213 |     });
  214 | 
  215 |     test('GET /api/campaigns/[id]/analytics - Campaign analytics', async ({ request }) => {
  216 |       if (!testCampaignId) {
  217 |         test.skip();
  218 |         return;
  219 |       }
  220 |       const res = await request.get(`${BASE_URL}/api/campaigns/${testCampaignId}/analytics`, {
  221 |         headers: authCookie ? { Cookie: authCookie } : {},
  222 |       });
  223 |       expect([200, 401, 404]).toContain(res.status());
  224 |     });
  225 | 
  226 |     test('POST /api/campaigns/[id]/launch - Launch campaign', async ({ request }) => {
  227 |       if (!testCampaignId) {
  228 |         test.skip();
  229 |         return;
  230 |       }
  231 |       const res = await request.post(`${BASE_URL}/api/campaigns/${testCampaignId}/launch`, {
  232 |         headers: authCookie ? { Cookie: authCookie } : {},
  233 |       });
  234 |       // May fail due to missing email/API config
  235 |       expect([200, 401, 404, 400, 500]).toContain(res.status());
  236 |     });
  237 | 
  238 |     test('POST /api/campaigns/[id]/pause - Pause campaign', async ({ request }) => {
  239 |       if (!testCampaignId) {
  240 |         test.skip();
  241 |         return;
  242 |       }
  243 |       const res = await request.post(`${BASE_URL}/api/campaigns/${testCampaignId}/pause`, {
  244 |         headers: authCookie ? { Cookie: authCookie } : {},
  245 |       });
  246 |       expect([200, 401, 404, 400]).toContain(res.status());
  247 |     });
  248 | 
  249 |     test('POST /api/campaigns/process - Process follow-ups', async ({ request }) => {
  250 |       const res = await request.post(`${BASE_URL}/api/campaigns/process`, {
  251 |         headers: authCookie ? { Cookie: authCookie } : {},
  252 |       });
> 253 |       expect([200, 401, 500]).toContain(res.status());
      |                               ^ Error: expect(received).toContain(expected) // indexOf
  254 |     });
  255 |   });
  256 | 
  257 |   test.describe('Replies Endpoints', () => {
  258 |     test('GET /api/replies - List replies', async ({ request }) => {
  259 |       const res = await request.get(`${BASE_URL}/api/replies`, {
  260 |         headers: authCookie ? { Cookie: authCookie } : {},
  261 |       });
  262 |       expect([200, 401]).toContain(res.status());
  263 |     });
  264 | 
  265 |     test('POST /api/replies/check - Check for new replies', async ({ request }) => {
  266 |       const res = await request.post(`${BASE_URL}/api/replies/check`, {
  267 |         headers: authCookie ? { Cookie: authCookie } : {},
  268 |       });
  269 |       // May fail due to missing Gmail/API config
  270 |       expect([200, 401, 500]).toContain(res.status());
  271 |     });
  272 |   });
  273 | 
  274 |   test.describe('Other Endpoints', () => {
  275 |     test('GET /api/settings - Get settings', async ({ request }) => {
  276 |       const res = await request.get(`${BASE_URL}/api/settings`, {
  277 |         headers: authCookie ? { Cookie: authCookie } : {},
  278 |       });
  279 |       expect([200, 401]).toContain(res.status());
  280 |     });
  281 | 
  282 |     test('PUT /api/settings - Update settings', async ({ request }) => {
  283 |       const res = await request.put(`${BASE_URL}/api/settings`, {
  284 |         headers: authCookie ? { Cookie: authCookie } : {},
  285 |         data: {
  286 |           email: { senderEmail: 'test@test.com', senderName: 'Test', dailySendLimit: 50, calendlyLink: '' },
  287 |           ai: { model: 'gemini-3-flash-preview', confidenceThreshold: 0.8, autoReplyPositive: true, autoUnsubscribe: true },
  288 |         },
  289 |       });
  290 |       expect([200, 401]).toContain(res.status());
  291 |     });
  292 | 
  293 |     test('GET /api/activity - Activity feed', async ({ request }) => {
  294 |       const res = await request.get(`${BASE_URL}/api/activity?limit=10`, {
  295 |         headers: authCookie ? { Cookie: authCookie } : {},
  296 |       });
  297 |       expect([200, 401]).toContain(res.status());
  298 |     });
  299 | 
  300 |     test('GET /api/deals - List deals', async ({ request }) => {
  301 |       const res = await request.get(`${BASE_URL}/api/deals`, {
  302 |         headers: authCookie ? { Cookie: authCookie } : {},
  303 |       });
  304 |       expect([200, 401]).toContain(res.status());
  305 |     });
  306 | 
  307 |     test('POST /api/deals - Create deal', async ({ request }) => {
  308 |       const res = await request.post(`${BASE_URL}/api/deals`, {
  309 |         headers: authCookie ? { Cookie: authCookie } : {},
  310 |         data: {
  311 |           prospectId: testProspectId || '000000000000000000000000',
  312 |           value: 5000,
  313 |           status: 'won',
  314 |           notes: 'Test deal',
  315 |         },
  316 |       });
  317 |       expect([200, 201, 401, 404]).toContain(res.status());
  318 |     });
  319 | 
  320 |     test('GET /api/templates - List templates', async ({ request }) => {
  321 |       const res = await request.get(`${BASE_URL}/api/templates`, {
  322 |         headers: authCookie ? { Cookie: authCookie } : {},
  323 |       });
  324 |       expect([200, 401]).toContain(res.status());
  325 |     });
  326 | 
  327 |     test('POST /api/templates - Create template', async ({ request }) => {
  328 |       const res = await request.post(`${BASE_URL}/api/templates`, {
  329 |         headers: authCookie ? { Cookie: authCookie } : {},
  330 |         data: {
  331 |           name: 'Test Template',
  332 |           category: 'outreach',
  333 |           steps: [{ subject: 'Hi {{firstName}}', body: 'Test', delayDays: 0 }],
  334 |         },
  335 |       });
  336 |       expect([200, 201, 401]).toContain(res.status());
  337 |     });
  338 | 
  339 |     test('GET /api/suggestions - AI suggestions', async ({ request }) => {
  340 |       const res = await request.get(`${BASE_URL}/api/suggestions`, {
  341 |         headers: authCookie ? { Cookie: authCookie } : {},
  342 |       });
  343 |       expect([200, 401]).toContain(res.status());
  344 |     });
  345 | 
  346 |     test('GET /api/export - Export CSV', async ({ request }) => {
  347 |       const res = await request.get(`${BASE_URL}/api/export?type=prospects`, {
  348 |         headers: authCookie ? { Cookie: authCookie } : {},
  349 |       });
  350 |       expect([200, 401]).toContain(res.status());
  351 |     });
  352 | 
  353 |     test('POST /api/discover - Discover prospects', async ({ request }) => {
```