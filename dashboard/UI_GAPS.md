# UI Gaps — Backend Features Missing from Frontend

**Date:** 2026-06-01  
**Status:** In Progress

---

## High Priority

| # | Feature | Backend Source | UI Needed | Status |
|---|---------|---------------|-----------|--------|
| 1 | Template management page (CRUD) | `models/Template.ts`, `app/api/templates/route.ts` | Full page with create/edit/delete | Pending |
| 2 | Enhanced close-deal modal | `models/Deal.ts`, `lib/validate.ts:100-108` | Add currency, services, status, closeDate, campaignId | Pending |
| 3 | Campaign send window config | `models/Campaign.ts:80-83`, `lib/validate.ts:93-96` | Two number inputs for start/end hour | Pending |
| 4 | Deal status support (lost/negotiating) | `models/Deal.ts:9` | Radio or select in deal modal | Pending |

---

## Medium Priority

| # | Feature | Backend Source | UI Needed | Status |
|---|---------|---------------|-----------|--------|
| 5 | Prospect funding fields | `models/Prospect.ts:28-29` | Text + number inputs in edit modal | Pending |
| 6 | Prospect pagination | `app/api/prospects/route.ts` (page param) | Pagination controls (prev/next/page numbers) | Pending |
| 7 | Replies pagination | `app/api/replies/route.ts` (offset param) | Pagination controls | Pending |
| 8 | Campaign A/B variants | `models/Campaign.ts:44-48` | Variant editor per step with weight slider | Pending |
| 9 | Weekly report trigger | `POST /api/reports/weekly` | Button on dashboard or reports section | Pending |

---

## Low Priority

| # | Feature | Backend Source | UI Needed | Status |
|---|---------|---------------|-----------|--------|
| 10 | Calendly webhook URL display | `POST /api/webhooks/calendly` | Read-only field in Settings showing webhook URL | Pending |
| 11 | Bounce check trigger | `POST /api/bounces` | Button or status indicator | Pending |
| 12 | Campaign process trigger | `POST /api/campaigns/process` | Manual "Process Follow-ups" button | Pending |
| 13 | Template usage count display | `models/Template.ts:16` | Badge/counter on template cards | Pending |
| 14 | Prospect status in edit modal | `models/Prospect.ts:34` | Select dropdown | Pending |

---

## Notes

- Template management is highest priority because the entire CRUD API exists but users have zero access to create custom templates.
- Deal modal enhancement is critical because users can only mark deals as "won" — no way to track lost deals or negotiations.
- Campaign send window is hardcoded to 9am-5pm in the UI despite being configurable in the backend.
- Pagination is needed to prevent performance issues as data grows.
