# Dashboard Audit — Improvement Items

**Date:** 2026-06-01  
**Scope:** Full codebase audit of `f:\New\dashboard`

---

## Critical Issues (Must Fix)

| # | Issue | File(s) | Details |
|---|-------|---------|---------|
| 1 | Hardcoded JWT Secret Fallback | `middleware.ts:5`, `lib/auth.ts:6` | Falls back to `'your-super-secret-jwt-key-change-this'` if env var missing. Should throw at startup. |
| 2 | No Input Sanitization | All POST/PUT API routes | Request bodies are spread directly into Mongoose — no schema validation beyond Mongoose types. Potential XSS in rendered content. |
| 3 | API Keys Stored in Plaintext | `models/Settings.ts` | Apollo, Gemini, Google OAuth tokens stored as plain strings in MongoDB. Should be encrypted at rest. |
| 4 | Cron Route Open When CRON_SECRET Empty | `app/api/cron/route.ts` | GET handler's auth check passes when `CRON_SECRET` is empty string — unauthenticated access. |
| 5 | No CSRF Protection | All state-changing routes | Relies only on `sameSite: 'lax'` cookie. No CSRF token implementation. |

---

## High-Priority Issues

| # | Issue | File(s) | Details |
|---|-------|---------|---------|
| 6 | No Error Boundaries | `app/` directory | Zero `error.tsx` files — unhandled exceptions crash the app with no recovery. Add `app/error.tsx` and `app/(dashboard)/error.tsx`. |
| 7 | No Loading States (Route-Level) | `app/` directory | Zero `loading.tsx` files. Navigation between pages has no Suspense boundary. |
| 8 | No Custom 404 Page | `app/` directory | No `not-found.tsx` — users see generic Next.js 404. |
| 9 | Zero Accessibility (ARIA) | All components | No `aria-label`, `role`, or `alt` attributes anywhere. Icon-only buttons have no accessible names. |
| 10 | Missing Security Headers | `next.config.mjs` | No CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy configured. |
| 11 | 80+ `any` Type Usages | Multiple files | Especially in campaign launch/process routes, replies check, prospects page, campaigns page. Reduces type safety. |
| 12 | Missing Form Validation | Auth pages, settings, pipeline | Login has no email format check. Settings doesn't validate URL/email fields. Deal modal accepts negative values. |

---

## Medium-Priority Issues

| # | Issue | File(s) | Details |
|---|-------|---------|---------|
| 13 | `console.error` in Production | All 30+ API routes | 38 instances. Should use structured logger (pino/winston) with log levels. |
| 14 | `alert()` / `confirm()` Instead of UI Components | `prospects/page.tsx`, `campaigns/page.tsx`, `replies/page.tsx` | Blocking browser dialogs. Toast system exists but isn't used for errors. |
| 15 | Unused Dependency: `jsonwebtoken` | `package.json` | Only `jose` is used (edge-compatible). `jsonwebtoken` + `@types/jsonwebtoken` can be removed. |
| 16 | Unused Import: `TrendingUp` | `components/layout/Sidebar.tsx:6` | Imported but never rendered. |
| 17 | Rate Limiter Ineffective in Serverless | `lib/rate-limit.ts` | In-memory `Map` resets on cold start. Useless on Vercel. Needs Redis/Upstash. |
| 18 | No SEO Metadata on Sub-Pages | All page files | Only root `layout.tsx` has metadata. Dashboard pages are client components — can't export metadata. |
| 19 | No Testing Framework | `package.json` | No jest, vitest, playwright, or cypress configured. Zero tests exist. |

---

## Low-Priority / Polish

| # | Issue | File(s) | Details |
|---|-------|---------|---------|
| 20 | Hardcoded UI Text | `Sidebar.tsx:62` | "Next check in 3 min" is static — not connected to actual schedule. |
| 21 | Performance: No Memoization | `page.tsx`, `Header.tsx`, `PerformanceChart.tsx` | Derived state recomputed every render. No `useMemo` or `React.memo` used. |
| 22 | Pipeline Fetches 500 Prospects | `pipeline/page.tsx:48` | No virtualization — will lag at scale. |
| 23 | PageTransition Forces Re-mounts | `PageTransition.tsx` | Uses pathname as key in AnimatePresence — full component re-mount on nav. |
| 24 | Hardcoded Deal Goal | `page.tsx:53` | `goal: 2` default should be user-configurable in Settings. |
| 25 | MongoDB URI Fallback | `lib/db.ts:3` | Falls back to `localhost:27017` — should error if env var missing. |

---

## Architecture Recommendations

1. **Add `app/error.tsx`** — Catch-all error boundary with retry button
2. **Add `app/not-found.tsx`** — Branded 404 page with navigation back
3. **Add `app/(dashboard)/loading.tsx`** — Skeleton or spinner for route transitions
4. **Create validation utility** (`lib/validate.ts`) with Zod schemas for all API inputs
5. **Replace `alert()`/`confirm()`** with the existing Toast component + a ConfirmDialog component
6. **Add security headers** in `next.config.mjs` (`headers()` config)
7. **Encrypt sensitive settings** before storing in MongoDB (use `crypto.createCipheriv`)
8. **Add Playwright or Vitest** for API and component testing
9. **Create a logging utility** (`lib/logger.ts`) wrapping `console` with levels
10. **Add `aria-label`** to all icon-only buttons throughout the app

---

## File Inventory

- **API Routes:** 31 route files
- **Pages:** 10 pages (2 auth + 8 dashboard)
- **Components:** 6 UI + 3 layout = 9 total
- **Models:** 7 Mongoose models
- **Lib Utils:** 5 utility files
- **Config Files:** `package.json`, `tsconfig.json`, `tailwind.config.js`, `next.config.mjs`, `vercel.json`, `middleware.ts`
