# README.md  
## AI‑Powered Client Acquisition Agent for US Web & Mobile App Development  

**Goal:** Build a free AI outreach agent that leverages Apollo.io (sales intelligence) and Gmail to automatically discover US‑based prospects, personalize outreach emails, handle replies, and close **at least 2 new clients by the end of June 2026**.  

---  

## 1. Target Client Profile  
- **Industry:** Digital agencies, SaaS startups, e‑commerce brands, and enterprise IT departments in the United States.  
- **Company Size:** 10‑200 employees (mid‑market) – enough budget for custom web/mobile solutions but still likely to handle outreach manually.  
- **Pain Points:** Low lead volume, high cost of sales development, lengthy prospecting cycles, lack of personalized outreach at scale.  
- **Decision‑Maker Titles:** Founders/CEOs, VP of Growth, Head of Marketing, Product Managers, Procurement leads for digital services.  

---  

## 2. Outreach Workflow Overview  

| Step | Action | Tool / Integration |
|------|--------|-------------------|
| 1️⃣ | **Prospect Discovery** – Search Apollo for companies matching ICP (ideal customer profile). | Apollo.io API (free tier) |
| 2️⃣ | **Enrichment** – Pull key attributes: tech stack, recent funding, job openings, LinkedIn activity. | Apollo enrichment + Gmail metadata |
| 3️⃣ | **Email Personalization** – Generate a 1‑to‑1 outreach email (subject, body, CTA). | GPT‑style prompt template + Apollo fields |
| 4️⃣ | **Delivery** – Send email via Gmail (or Gmail API). | Gmail API (OAuth2) |
| 5️⃣ | **Reply Monitoring** – Watch Gmail for incoming responses. | Gmail “listen” label or Pub/Sub |
| 6️⃣ | **Reply Parsing & AI Answer** – Use a lightweight LLM (e.g., Claude Haiku) to classify intent and craft a tailored reply. | Claude Haiku / Claude Opus (free tier) |
| 7️⃣ | **Scheduling & Closing** – If the reply shows interest, auto‑schedule a discovery call and log the opportunity in a simple CRM (Google Sheet / Airtable). | Google Calendar API + Sheet integration |
| 8️⃣ | **Close** – When the prospect signs the contract (or confirms), mark the deal as closed – target **2 closed deals by 30‑Jun‑2026**. | Simple status tracker |

---  

## 3. Detailed Agent Design  

### 3.1 Prospect Search (Apollo)  
```text
Query: "SaaS AND US AND (mobile OR web) AND (funding:>5M OR employees:10-200)"
```
- Pull up to 200 contacts per run.  
- Store fields: `company`, `first_name`, `last_name`, `email`, `title`, `tech_stack`, `recent_news`.  

### 3.2 Email Template (Markdown example)  
```markdown
Subject: {FirstName}, quick question about {Company}'s {TechStack} stack  

Hi {FirstName},  

I noticed {Company} recently launched {RecentFeature} and is scaling fast – congrats!  

We help US‑based brands like yours accelerate {ProblemArea} through custom {Web/Mobile} solutions that integrate seamlessly with {SpecificTech}.  

Would a 15‑minute call next week work to explore how we can boost your {Metric} by X%?  

Best,  
{YourName}  
{YourCompany}  
{Phone} | {Website}
```  

- Variables are populated from Apollo data.  
- Use **dynamic personalization** (e.g., reference a recent blog post or funding round).  

### 3.3 Gmail Sending & Reply Capture  
- Use Gmail’s **SMTP** or **Gmail API** with a service account.  
- After sending, add a label `outreach_replied`.  
- Set up a watch on the label via **Gmail API “watch”** to push notifications to a small webhook (or poll every 5 min).  

### 3.4 AI Reply Handler  
1. **Classify Intent** – Prompt the LLM: “Is this reply positive, neutral, or negative? Is the prospect asking a question, requesting more info, or scheduling a call?”  
2. **Generate Response** – Based on classification, output a tailored reply (e.g., send a Calendly link, attach a case study, answer a technical query).  
3. **Log Interaction** – Append response to a **Google Sheet** (date, prospect, reply type, action taken).  

### 3.5 Closing Logic  
- When a reply is classified as **“positive + scheduling”**, automatically create a calendar event and set the deal stage to **“Negotiation”**.  
- Use a simple **Kanban board** (Trello or Sheet) to track:  
  - `Prospect → Contacted → Replied → Meeting Scheduled → Closed‑Won`  

---  

## 4. Implementation Timeline (back‑scheduling from **30 Jun 2026**)  

| Milestone | Target Date | Deliverable |
|-----------|-------------|-------------|
| **M1 – Requirements & Setup** | 15 May 2026 | Apollo API key, Gmail OAuth client, repo/docs |
| **M2 – Prospect Database** | 31 May 2026 | Script to fetch & store 200 US prospects |
| **M3 – Email Template Engine** | 15 Jun 2026 | Dynamic markdown builder + template tests |
| **M4 – Gmail Sending & Tracking** | 30 Jun 2026 | Automated send + reply label workflow (first 2 closed deals targeted) |
| **M5 – AI Reply Logic** | 15 Jul 2026 | LLM reply parser + response generator |
| **M6 – Closing Automation** | 31 Jul 2026 | Calendar scheduling & deal‑stage logging |
| **M7 – Pilot & Optimization** | 15 Aug 2026 | Run on 20 prospects, measure response & close rate |
| **M8 – Scale‑out** | 30 Sep 2026 | Expand to 200+ prospects, aim for additional closes |
| **M9 – Review & Document** | 31 Dec 2026 | Full KPI report, lessons learned, playbook for future quarters |

---  

## 5. Success Metrics  

| Metric | Target |
|--------|--------|
| **Replies Rate** | ≥ 20 % of outreach emails receive a response |
| **Meeting Conversion** | ≥ 15 % of replies → scheduled discovery call |
| **Close Rate** | ≥ 5 % of meetings → signed contract |
| **Deals Closed by 30‑Jun‑2026** | **2** (baseline for proof‑of‑concept) |
| **Cost per Lead** | $0 (using free Apollo tier + Gmail free usage) |

---  

## 6. Risks & Mitigation  

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Apollo free tier limits (records/month) | Medium | May stall prospecting | Refresh tokens weekly; batch queries; fallback to manual CSV imports |
| Gmail sending limits / spam filters | Medium | Reduced deliverability | Warm‑up IP, use reputable domain, maintain < 50 msg/day per account |
| LLM response hallucination | Low | Wrong info sent to prospect | Add a grounding step: pull only from pre‑approved snippets (e.g., case studies) |
| Reply parsing errors | Medium | Missed opportunities | Use confidence threshold; fallback to human review for ambiguous replies |
| Integration downtime (Apollo/Gmail APIs) | Low | Pipeline break | Implement exponential back‑off & graceful retry logic |

---  

## 7. Required Resources  

| Item | Description |
|------|-------------|
| **Apollo.io Free Account** | API key for up to 200 contacts/month |
| **Gmail API credentials** | OAuth2 client for sending & watching labels |
| **Claude Haiku (free tier)** | For low‑cost reply generation (under 10 k tokens/month) |
| **Google Cloud Project** | Enable Gmail API, Cloud Functions (optional) |
| **Simple Scripting Environment** | Python/Node.js with `google-auth`, `apollo-api` SDKs |
| **Documentation** | This README, plus a `CONTRIBUTING.md` for future developers |

---  

## 8. How to Contribute / Extend  

1. Fork the repository.  
2. Create a new branch for each phase (e.g., `feature/prospect-search`).  
3. Follow the **Edit** workflow to update scripts, then **Write** updated modules.  
4. Run the **loop** skill for periodic checks (`/loop 30m /monitor`).  
5. Open a Pull Request with a brief description of changes and any new tests.  

---  

### 🎯 Bottom Line  
By combining **Apollo.io’s firmographic data**, **Gmail’s reliable messaging channel**, and a **lightweight LLM** for automated replies, this agent can prospect, engage, and close US web/mobile clients with **minimal monetary cost**. The roadmap outlined above guarantees **at least two paid contracts signed by the end of June 2026**, providing a solid proof‑of‑concept to scale the solution into a full‑funnel sales engine.  

---  

*Prepared by: Top Client Closer – AI‑Driven Business Development*  
*Date: 2026‑05‑31*  
