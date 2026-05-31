# Agent Workflow Document  
**Version:** 1.0  
**Date:** 2026-05-31  

---

## 1. High‑Level Flow  
```
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│  Apollo.io  │──▶│   Enrich &   │──▶│   Generate   │
│  Prospects  │   │   Personalize│   │   Email      │
└─────────────┘   └──────────────┘   └──────┬───────┘
                                           │
                                           ▼
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│   Gmail     │──▶│   Monitor    │──▶│   Classify   │
│   Send      │   │   Replies    │   │   & Reply    │
└─────────────┘   └──────────────┘   └──────┬───────┘
                                           │
                                           ▼
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│ Calendar    │──▶│   Log CRM    │──▶│   Close Deal │
│ Schedule    │   │   (Sheet)    │   │   (2 by Jun) │
└─────────────┘   └──────────────┘   └──────────────┘
```

---

## 2. Detailed Steps  

### 2.1 Prospect Discovery  
1. **Schedule:** Daily at 09:00 EST.  
2. **Query:** `company_tags:"SaaS" AND country:"United States"`.  
3. **Limit:** 50 prospects per run.  
4. **Output:** JSON array saved under `prospects/`.

### 2.2 Enrichment  
1. Call Apollo enrichment endpoint for each prospect.  
2. Capture fields: `first_name, last_name, title, company, industry, tech_stack, funding_round, last_funding_at`.
3. Save enriched JSON back to `prospects/`.

### 2.3 Email Generation  
1. Use a Jinja2/Handlebars template.  
2. Insert Apollo fields.  
3. Prompt Claude Haiku:
```
Write a 100‑word cold email to {first_name} at {company}. Mention their recent {funding_round} and how we can improve {metric} by 30%.
```
4. Produce subject line + body.

### 2.4 Email Delivery  
- Send via Gmail API (`users.messages.send`).
- Add custom headers `X‑Task‑ID` and `X‑Prospect‑ID`.
- Respect free‑tier limit of 50 emails/day.

### 2.5 Reply Monitoring  
- Set up Gmail **watch** on label `outreach_replied` (push to a webhook).  
- Fallback poll every 5 min if push fails.

### 2.6 Reply Classification  
Prompt Claude Haiku:
```
Classify this reply: POSITIVE, NEUTRAL, or NEGATIVE. Extract any request.
```
- Use a confidence threshold ≥ 80 % for auto‑reply.
- Low confidence → route to human review queue.

### 2.7 Auto‑Response Logic  
| Intent | Action |
|-------|--------|
| Positive + Question | Reply with answer + Calendly link |
| Positive + No Question | Reply with Calendly link only |
| Neutral | Ask a clarifying question |
| Negative | Log and stop future outreach |

### 2.8 Scheduling  
- When intent = “schedule”, call Google Calendar API to create a 15‑min slot (next two business days).  
- Email the Zoom/Google Meet link back to prospect.

### 2.9 CRM Logging  
- Append a row to a Google Sheet: `Timestamp, Prospect, Email, Status, Notes`.
- Update status flow: `new → contacted → replied → meeting → closed`.

### 2.10 Dashboard  
- Sheet `Dashboard` with KPIs: Sent, Replies, Meetings, Closed Deals, Cost (should stay $0).
- Refresh after each run.

---

## 3. Error Handling  
| Situation | Remedy |
|-----------|--------|
| Apollo quota exhausted | Pause, alert Slack, retry next day |
| Gmail send fail | Exponential back‑off (max 3) |
| Calendar conflict | Mark as manual follow‑up |
| Unrecognized reply | Flag for human review |

---

## 4. Monitoring & Alerts  
| Metric | Threshold | Channel |
|--------|-----------|---------|
| Send failure > 5 % | Slack DM |
| Reply lag > 10 min | Email |
| Deal stuck > 3 days | Slack @owner |

---

## 5. File Structure  
```
agent/
├─ main.py               # entry point
├─ config.json           # API keys & settings
├─ prospects/            # raw & enriched JSON
├─ emails/               # generated templates
├─ logs/                 # CRM & dashboard sheets
├─ utils/                # helper functions
└─ tests/                # unit tests
```

---

## 6. Timeline (back‑dated)  
| Milestone | Target |
|-----------|--------|
| Prospect DB ready | 31 May 2026 |
| Email engine live | 15 Jun 2026 |
| Gmail watch functional | 30 Jun 2026 |
| AI reply loop stable | 15 Jul 2026 |
| First two deals closed | 30 Jun 2026 |

---

*End of Document*