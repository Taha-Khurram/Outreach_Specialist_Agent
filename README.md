# Client Acquisition Agent

AI-powered outbound sales agent that automates prospect discovery, personalized email outreach, reply handling, and meeting scheduling — all using free-tier services.

## Goal

Close **2 US web/mobile app development clients by June 30, 2026** with $0 spend.

## Architecture

```
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│  Apollo.io  │──▶│   Enrich &   │──▶│   Generate   │
│  Prospects  │   │  Personalize │   │   Email (AI) │
└─────────────┘   └──────────────┘   └──────┬───────┘
                                           │
                                           ▼
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│   Gmail     │──▶│   Monitor    │──▶│  Classify &  │
│   Send      │   │   Replies    │   │  Auto-Reply  │
└─────────────┘   └──────────────┘   └──────┬───────┘
                                           │
                                           ▼
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│  Calendar   │──▶│   Log CRM    │──▶│  Close Deal  │
│  Schedule   │   │  (Sheets)    │   │              │
└─────────────┘   └──────────────┘   └──────────────┘
```

## Tech Stack

- **Runtime:** Node.js 20+
- **AI:** Claude Haiku (Anthropic) — email generation & reply classification
- **Email:** Gmail API (OAuth2)
- **Prospects:** Apollo.io (free tier, 200/month)
- **Scheduling:** Google Calendar API
- **CRM:** Google Sheets API
- **Templates:** Handlebars
- **Task Scheduling:** node-cron (local) or Windows Task Scheduler

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in your API keys
```

### 3. Setup Google OAuth2

```bash
npm run setup
# Opens browser for Google authorization
# Automatically saves refresh token to .env
```

### 4. Run the agent

**Option A: Continuous mode (node-cron scheduler)**
```bash
npm start
```

**Option B: Individual cron scripts**
```bash
npm run discover        # Find & enrich prospects
npm run send-emails     # Send generated emails
npm run monitor         # Check replies & auto-respond
npm run report          # Generate daily report
```

**Option C: One-off commands**
```bash
node src/index.js discover   # Run discovery once
node src/index.js send       # Send emails once
node src/index.js monitor    # Check replies once
node src/index.js report     # Generate report once
```

### 5. Windows Task Scheduler (cron alternative)

```
# Discovery: Daily at 9:00 AM
schtasks /create /tn "Agent-Discover" /tr "node F:\New\scripts\discover.js" /sc daily /st 09:00

# Email Send: Daily at 10:00 AM
schtasks /create /tn "Agent-Send" /tr "node F:\New\scripts\send-emails.js" /sc daily /st 10:00

# Reply Monitor: Every 5 minutes
schtasks /create /tn "Agent-Monitor" /tr "node F:\New\scripts\monitor-replies.js" /sc minute /mo 5

# Daily Report: Daily at 6:00 PM
schtasks /create /tn "Agent-Report" /tr "node F:\New\scripts\daily-report.js" /sc daily /st 18:00
```

## Project Structure

```
├── src/
│   ├── index.js              # Main orchestrator (node-cron)
│   ├── config.js             # Configuration loader
│   ├── services/
│   │   ├── apollo.js         # Prospect search & enrichment
│   │   ├── gmail.js          # Email send/receive
│   │   ├── calendar.js       # Meeting scheduling
│   │   ├── sheets.js         # CRM logging
│   │   └── ai.js             # Claude Haiku integration
│   ├── workflows/
│   │   ├── prospect-discovery.js
│   │   ├── email-generation.js
│   │   ├── email-delivery.js
│   │   ├── reply-monitor.js
│   │   └── reply-handler.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── rate-limiter.js
│   └── templates/
│       └── cold-email.hbs
├── scripts/
│   ├── discover.js           # Cron: prospect discovery
│   ├── send-emails.js        # Cron: email delivery
│   ├── monitor-replies.js    # Cron: reply monitoring
│   ├── daily-report.js       # Cron: performance report
│   └── setup.js              # One-time OAuth setup
├── config/
│   └── default.json          # Default configuration
├── prospects/                 # Discovered prospect data
├── emails/                    # Generated email content
├── logs/                      # Application logs
├── tests/                     # Unit tests
├── docs/                      # Documentation
├── .env.example              # Environment template
└── package.json
```

## Free Tier Limits

| Service | Limit | Strategy |
|---------|-------|----------|
| Apollo.io | 200 credits/month | Batch daily, max 50/run |
| Gmail | 50 sends/day | Rate-limited, tracked |
| Claude Haiku | Pay-per-token (very cheap) | Short prompts, ~$0.01/email |
| Google Sheets | 300 req/min | Well under limit |
| Google Calendar | 1M queries/day | Negligible usage |

## Testing

```bash
npm test
```

## Target Client Profile

- **Industry:** SaaS startups, e-commerce, digital agencies, enterprise IT (US)
- **Company Size:** 10-200 employees
- **Decision Makers:** CEO, CTO, VP Engineering, Head of Product, Founders
- **Pain Points:** Low lead volume, high sales dev cost, lack of personalized outreach

## Success Metrics

| Metric | Target |
|--------|--------|
| Reply Rate | >= 20% |
| Meeting Conversion | >= 15% of replies |
| Close Rate | >= 5% of meetings |
| Deals by June 30 | 2 |
| Cost | $0 |

## Compliance

- **CAN-SPAM:** Every email includes unsubscribe text
- **GDPR:** Opt-out immediately honored, prospect removed from list
- **Rate limiting:** Respects all API limits with exponential backoff
- **Human-in-the-loop:** Low-confidence replies flagged for manual review
