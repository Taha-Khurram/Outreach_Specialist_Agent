# ClientFlow — AI-Powered Client Acquisition Platform

Full-stack SaaS platform that automates B2B outbound sales: prospect discovery, AI-personalized email outreach, reply handling, deal tracking, and pipeline management.

**Goal:** Close **2 US web/mobile app development clients by June 30, 2026** with $0 marketing spend.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Next.js 15 Dashboard                          │
├──────────────────────────────────────────────────────────────────────┤
│  Pages: Dashboard │ Prospects │ Campaigns │ Pipeline │ Replies │ Settings │
├──────────────────────────────────────────────────────────────────────┤
│  API Routes (30+)  │  JWT Auth (jose)  │  Edge Middleware            │
├──────────────────────────────────────────────────────────────────────┤
│  MongoDB (Mongoose)  │  Gmail API  │  Gemini 2.0 Flash  │  Apollo.io │
└──────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Discover (Apollo.io) → Score (AI) → Research (AI) → Campaign (multi-step)
    → Generate Email (AI-personalized) → Send (Gmail API)
        → Monitor Replies → Classify (AI) → Auto-Reply or Flag
            → Book Meeting → Close Deal → Track Revenue
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS 4, Recharts |
| Backend | Next.js API Routes, Edge Middleware |
| Database | MongoDB + Mongoose |
| AI | Google Gemini 2.0 Flash (`@google/generative-ai`) |
| Email | Gmail API via `googleapis` (OAuth2) |
| Auth | JWT with `jose` (Edge-compatible) |
| Prospects | Apollo.io API |
| Scheduling | Calendly webhooks |

---

## Features

### Core Workflow
- **Prospect Discovery** — Search Apollo.io with industry/role/location filters, auto-enrich
- **AI Lead Scoring** — 0-100 scoring across 4 dimensions (company fit, role authority, engagement signals, timing)
- **AI Company Research** — Deep research with pain points, talking points, tech needs
- **Multi-Step Campaigns** — Create sequences (3-5 emails), AI-generates personalized content using research data
- **Gmail Integration** — Send/receive via OAuth2, track opens, handle bounces
- **Reply Classification** — AI classifies replies as POSITIVE/NEUTRAL/NEGATIVE/UNSUBSCRIBE
- **Auto-Reply** — AI generates contextual follow-ups for positive/neutral replies
- **Meeting Booking** — Calendly integration with webhook tracking

### Intelligence
- **Smart Suggestions** — AI-prioritized follow-up recommendations based on engagement
- **Performance Charts** — Weekly send/reply/meeting trends (Recharts)
- **Goal Tracking** — Visual progress toward client acquisition goal
- **Weekly Reports** — Auto-generated performance summaries emailed to you

### Pipeline & Deals
- **Kanban Pipeline** — Visual board: New → Contacted → Replied → Meeting → Closed
- **Deal Tracking** — Record deal value, services, and revenue
- **Revenue Dashboard** — Total revenue, deals closed, goal progress
- **CSV Export** — Download prospect data as CSV

### Templates & Automation
- **Email Templates** — 3 built-in sequences + custom template creation
- **Cron Processing** — One-click "Process Now" checks replies + sends follow-ups
- **Batch Operations** — Score all unscored prospects, bulk campaign launch

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Cloud project with Gmail API enabled
- Gemini API key

### 1. Clone & Install

```bash
git clone <repo-url>
cd New
npm install
cd dashboard
npm install
```

### 2. Configure Environment

```bash
cd dashboard
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/client-acquisition
JWT_SECRET=<generate-a-strong-random-string>

# AI (for scoring, research, email generation)
GEMINI_API_KEY=<your-gemini-api-key>

# Gmail OAuth2 (for sending/receiving emails)
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>
GOOGLE_REFRESH_TOKEN=<from-oauth-flow>

# Optional
CRON_SECRET=<for-external-cron-services>
CALENDLY_WEBHOOK_SECRET=<for-meeting-tracking>
```

### 3. Run Development Server

```bash
cd dashboard
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — create an account and start using the platform.

### 4. Production Build

```bash
cd dashboard
npm run build
npm start
```

---

## Project Structure

```
├── dashboard/                    # Next.js 15 application
│   ├── app/
│   │   ├── (auth)/              # Auth pages (login, signup)
│   │   ├── (dashboard)/         # Protected pages
│   │   │   ├── page.tsx         # Dashboard (stats, goals, suggestions)
│   │   │   ├── prospects/       # Prospect management
│   │   │   ├── campaigns/       # Campaign builder & management
│   │   │   │   └── [id]/       # Campaign detail & analytics
│   │   │   ├── pipeline/        # Kanban pipeline view
│   │   │   ├── replies/         # Reply inbox & management
│   │   │   └── settings/        # API keys, email config, preferences
│   │   └── api/
│   │       ├── auth/            # login, signup, logout, me
│   │       ├── prospects/       # CRUD, score, research, score-all
│   │       ├── campaigns/       # CRUD, launch, pause, process, analytics
│   │       ├── replies/         # List, check, reply
│   │       ├── deals/           # Create, list deals
│   │       ├── suggestions/     # AI follow-up suggestions
│   │       ├── templates/       # Email template CRUD
│   │       ├── discover/        # Apollo.io prospect search
│   │       ├── stats/           # Overview stats, chart data
│   │       ├── reports/weekly   # Weekly report generation
│   │       ├── export/          # CSV export
│   │       ├── health/          # Health check
│   │       ├── cron/            # Process replies + follow-ups
│   │       ├── bounces/         # Bounce handling
│   │       └── webhooks/        # Calendly webhook
│   ├── components/
│   │   ├── layout/              # Header, Sidebar
│   │   └── ui/                  # ScoreBadge, EmptyState, PerformanceChart, etc.
│   ├── models/                  # Mongoose schemas
│   │   ├── User.ts
│   │   ├── Prospect.ts         # + score, research fields
│   │   ├── Campaign.ts
│   │   ├── Interaction.ts
│   │   ├── Template.ts
│   │   ├── Deal.ts
│   │   └── Settings.ts
│   ├── lib/
│   │   ├── db.ts               # MongoDB singleton connection
│   │   ├── auth.ts             # JWT helpers
│   │   ├── gmail.ts            # Gmail send/receive
│   │   ├── gemini.ts           # Gemini AI wrapper
│   │   └── rate-limit.ts       # In-memory rate limiting
│   └── middleware.ts            # JWT auth, route protection
├── src/                         # Legacy CLI agent (Node.js)
│   ├── index.js                # Orchestrator
│   ├── config.js
│   └── services/               # apollo, gmail, ai, calendar, sheets
├── config/default.json
├── .env.example
└── package.json
```

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login, returns JWT cookie |
| POST | `/api/auth/logout` | Clear auth cookie |
| GET | `/api/auth/me` | Get current user |

### Prospects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/prospects` | List prospects (paginated, filterable) |
| POST | `/api/prospects` | Create prospect manually |
| GET | `/api/prospects/[id]` | Get single prospect |
| PUT | `/api/prospects/[id]` | Update prospect |
| DELETE | `/api/prospects/[id]` | Delete prospect |
| POST | `/api/prospects/[id]/score` | AI-score a prospect (0-100) |
| POST | `/api/prospects/[id]/research` | AI-research company |
| POST | `/api/prospects/score-all` | Batch-score unscored prospects |

### Campaigns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List campaigns |
| POST | `/api/campaigns` | Create campaign |
| GET | `/api/campaigns/[id]` | Campaign detail with prospects |
| PUT | `/api/campaigns/[id]` | Update campaign |
| DELETE | `/api/campaigns/[id]` | Delete campaign |
| POST | `/api/campaigns/[id]/launch` | AI-generate emails & launch |
| POST | `/api/campaigns/[id]/pause` | Pause active campaign |
| GET | `/api/campaigns/[id]/analytics` | Campaign performance metrics |
| POST | `/api/campaigns/process` | Process pending emails |

### Replies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/replies` | List received replies |
| POST | `/api/replies/check` | Check Gmail for new replies |
| POST | `/api/replies/[id]/reply` | Send manual reply |

### Deals & Pipeline
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deals` | List deals + revenue summary |
| POST | `/api/deals` | Create deal (close a prospect) |

### Intelligence
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/suggestions` | AI-prioritized follow-up suggestions |
| GET | `/api/templates` | List email templates |
| POST | `/api/templates` | Create custom template |
| GET | `/api/stats` | Overview statistics |
| GET | `/api/stats/chart` | Weekly chart data |

### Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cron` | Process replies + send follow-ups |
| POST | `/api/reports/weekly` | Generate & email weekly report |
| GET | `/api/export?type=prospects` | CSV export |
| GET | `/api/health` | Health check (public) |
| POST | `/api/discover` | Search Apollo.io for prospects |
| POST | `/api/webhooks/calendly` | Calendly meeting webhook |

---

## AI Lead Scoring

Prospects are scored 0-100 across 4 dimensions (0-25 each):

| Dimension | What it measures |
|-----------|-----------------|
| Company Fit | Industry match, company size, tech alignment |
| Role Authority | Decision-making power of the contact |
| Engagement Signals | Funding, growth indicators, tech needs |
| Timing | Stage-appropriate outsourcing likelihood |

**Score interpretation:**
- **80-100** (green): Hot lead — prioritize immediately
- **60-79** (amber): Warm lead — worth pursuing
- **40-59** (orange): Cool lead — needs more qualification
- **0-39** (gray): Low priority — nurture or skip

---

## Email Campaign Flow

1. **Create Campaign** — Name it, select prospects, choose template or custom steps
2. **Launch** — AI generates personalized emails using prospect data + research
3. **Process** — Cron sends emails respecting daily limits and delays between steps
4. **Monitor** — System checks Gmail for replies, classifies with AI
5. **Auto-Reply** — Positive/neutral replies get AI-crafted follow-ups
6. **Track** — All interactions logged, pipeline updated automatically

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for JWT token signing |
| `GEMINI_API_KEY` | For AI | Google Gemini API key |
| `GOOGLE_CLIENT_ID` | For email | OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | For email | OAuth2 client secret |
| `GOOGLE_REFRESH_TOKEN` | For email | OAuth2 refresh token |
| `CRON_SECRET` | Optional | Protects cron endpoint |
| `CALENDLY_WEBHOOK_SECRET` | Optional | Verifies Calendly webhooks |

---

## Deployment

### Vercel (Recommended)

```bash
cd dashboard
vercel deploy
```

Set environment variables in Vercel dashboard. Add a cron job:
```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron", "schedule": "*/30 * * * *" }
  ]
}
```

### Self-Hosted

```bash
cd dashboard
npm run build
npm start    # Runs on port 3000
```

Use a process manager (PM2) and reverse proxy (nginx/caddy) for production.

---

## Development

```bash
cd dashboard
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint
```

### Adding a New API Route

1. Create `dashboard/app/api/<path>/route.ts`
2. Extract `x-user-id` from headers (injected by middleware)
3. Call `connectDB()` before any DB operations
4. Return `NextResponse.json()`

### Adding a New Page

1. Create `dashboard/app/(dashboard)/<path>/page.tsx`
2. Mark `'use client'` for interactive pages
3. Add navigation link in `components/layout/Sidebar.tsx`

---

## Compliance

- **CAN-SPAM** — Unsubscribe text in every outbound email
- **Bounce Handling** — Automatic detection and status update
- **Rate Limiting** — Respects Gmail daily limits, API rate limits
- **Data Privacy** — Per-user data isolation, JWT-protected routes
- **Unsubscribe** — Immediate removal from all campaigns on request

---

## Success Metrics

| Metric | Target | Tracked In |
|--------|--------|-----------|
| Reply Rate | >= 20% | Dashboard stats |
| Reply → Meeting | >= 15% | Key metrics |
| Deals Closed | 2 by June 30, 2026 | Goal tracker |
| Cost | $0 marketing spend | — |
| Time to First Reply | < 48 hours | Activity feed |

---

## License

Private — All rights reserved.
