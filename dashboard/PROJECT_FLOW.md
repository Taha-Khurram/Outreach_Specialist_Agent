# ClientFlow — Project Flow Guide

> A beginner-friendly explanation of how this project works from start to finish.

---

## What Is This Project?

ClientFlow is an **AI-powered sales tool** that helps a web/mobile development agency find potential clients and send them personalized cold emails — automatically.

Think of it like having a robot sales assistant that:
1. Finds people who might need your services
2. Researches their company
3. Writes personalized emails to them
4. Sends follow-up emails if they don't reply
5. Reads their replies and tells you who's interested
6. Books meetings with interested people

All of this runs from a single web application with a dashboard you can see in your browser.

---

## The Big Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR BROWSER                              │
│  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Dashboard │  │Prospects │  │Campaigns │  │   Replies    │  │
│  │   Home    │  │   Page   │  │   Page   │  │    Inbox     │  │
│  └─────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
└────────┼──────────────┼─────────────┼────────────────┼──────────┘
         │              │             │                │
         ▼              ▼             ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS API ROUTES                           │
│         (The "brain" — handles all logic on the server)          │
└────────┬──────────────┬─────────────┬────────────────┬──────────┘
         │              │             │                │
         ▼              ▼             ▼                ▼
┌──────────────┐ ┌───────────┐ ┌──────────┐ ┌────────────────┐
│   MongoDB    │ │ Gemini AI │ │ Gmail API│ │  Apollo.io API │
│  (Database)  │ │ (Google)  │ │  (Email) │ │ (Find People)  │
└──────────────┘ └───────────┘ └──────────┘ └────────────────┘
```

---

## Technology Stack (What Tools Are Used)

| Tool | What It Does | Analogy |
|------|-------------|---------|
| **Next.js 15** | The web framework — runs both the website AND the server logic | The building that houses everything |
| **React 19** | Makes the interactive pages you click through | The furniture and decorations |
| **MongoDB** | Stores all data (users, prospects, emails, campaigns) | The filing cabinet |
| **Gemini AI** | Google's AI that writes emails, scores leads, reads replies | The smart assistant |
| **Gmail API** | Sends and receives emails through your Gmail account | The mailroom |
| **Apollo.io** | Finds contact info for potential clients | The phone book |
| **Tailwind CSS** | Makes everything look good | The paint and styling |
| **JWT** | Keeps you logged in securely | Your ID badge |

---

## How Users Interact With the App

### Step 1: Sign Up / Log In

```
User visits website → Signs up with name, email, password, company
                    → System creates account in database
                    → System gives back a "token" (like a wristband at a concert)
                    → User is now logged in and can access the dashboard
```

**How it works technically:**
- User submits the signup form
- Server hashes (scrambles) the password so nobody can read it
- Server creates a JWT token (a secure ID card) and puts it in a cookie
- Every future request sends this cookie automatically
- The middleware (security guard) checks the cookie on every page

---

### Step 2: Configure Settings

Before anything works, the user needs to provide API keys (like passwords that let our app talk to other services):

| Setting | Why It's Needed |
|---------|----------------|
| Gemini API Key | So AI can write emails and score leads |
| Gmail OAuth Tokens | So the app can send/receive emails from your Gmail |
| Apollo API Key | So the app can search for potential clients |
| Calendly Link | So prospects can book meetings with you |

These are stored in the **Settings** collection in the database, linked to your user account.

---

### Step 3: Discover Prospects

```
User clicks "Discover" → App calls Apollo.io API
                       → Apollo returns a list of people matching your criteria
                       → App saves them to your database as "Prospects"
                       → Each prospect starts with status: "new"
```

**What filters are used:**
- Job titles (CEO, CTO, VP Engineering)
- Industries (SaaS, E-commerce, Fintech)
- Company size (10-500 employees)
- Location (US-based)

**What gets saved for each prospect:**
- Name, email, job title
- Company name, industry, size
- LinkedIn URL
- Tech stack, funding info

---

### Step 4: Score Prospects with AI

```
User clicks "Score" on a prospect → App sends prospect info to Gemini AI
                                   → AI rates them 0-25 on four categories:
                                      • Company Fit (do they need dev help?)
                                      • Role Authority (can they make buying decisions?)
                                      • Engagement Signals (are they growing/hiring?)
                                      • Timing (is now a good time to reach out?)
                                   → Total score: 0-100
                                   → Score saved on the prospect record
```

**Why this matters:** A prospect scoring 85/100 is much more likely to become a client than one scoring 30/100. You want to focus your energy on high-score prospects.

---

### Step 5: Research Prospects with AI

```
User clicks "Research" → App sends company info to Gemini AI
                       → AI generates:
                          • Company summary (what they do)
                          • Pain points (problems they likely have)
                          • Talking points (personalization hooks for emails)
                          • Recent news (funding, launches, hiring)
                          • Tech needs (where a dev team could help)
                       → Research saved on prospect record
```

**Why this matters:** This research is used later to write personalized emails. Instead of "Hi, we do web development", the email might say "I noticed you just raised Series A and are expanding your mobile team — we've helped similar companies ship 3x faster."

---

### Step 6: Create a Campaign

A **campaign** is a sequence of emails sent to a group of prospects over time.

```
Example Campaign: "SaaS Founders Outreach"
├── Step 1 (Day 0): "Hi {{firstName}}, noticed {{company}} is growing..."
├── Step 2 (Day 3): "Following up on my last email..."
├── Step 3 (Day 7): "One last thought about {{painPoint}}..."
└── Step 4 (Day 14): "Break-up email — last chance to connect"
```

**What you configure:**
- Campaign name
- Email steps (subject + body for each)
- Delay between steps (in days)
- Which prospects to include
- Daily send limit (don't spam!)
- Send window (9am-5pm only)

---

### Step 7: Launch the Campaign

```
User clicks "Launch" → For each prospect in the campaign:
                        1. AI personalizes the email template using research data
                        2. Replaces {{firstName}}, {{company}}, etc.
                        3. Sends email via Gmail API
                        4. Records "email_sent" interaction in database
                        5. Schedules the next step (e.g., 3 days later)
                     → Prospect status changes from "new" to "contacted"
```

**AI Personalization Example:**

Template: `"Hi {{firstName}}, I noticed {{company}} is {{hook}}"`

AI Output: `"Hi Sarah, I noticed Acme Corp is expanding into mobile — congrats on the Series B! We've helped similar fintech startups ship iOS apps in 8 weeks."`

---

### Step 8: Automatic Follow-ups (Runs Every 15 Minutes)

```
Cron job triggers → Finds all prospects where "nextSendAt" time has passed
                  → For each one:
                     • Generates next personalized follow-up email
                     • Considers what was already sent (no repetition)
                     • Sends via Gmail
                     • Schedules next step OR marks campaign complete
```

This runs **automatically** — you don't need to do anything. The system checks every 15 minutes if any follow-ups are due.

---

### Step 9: Reply Detection & Classification

```
Cron job triggers → Checks Gmail inbox for new unread messages
                  → For each new email:
                     • Matches sender to a known prospect
                     • Sends reply text to Gemini AI for classification:
                        ✅ POSITIVE ("Yes, let's chat!")
                        😐 NEUTRAL ("Tell me more about pricing")
                        ❌ NEGATIVE ("Not interested")
                        🚫 UNSUBSCRIBE ("Remove me from your list")
                     • Updates prospect status accordingly
                     • If POSITIVE + confidence > threshold:
                        → Auto-sends reply with Calendly link
                        → Notifies you via email
                     • If UNSUBSCRIBE:
                        → Marks prospect as unsubscribed
                        → Removes from all active campaigns
```

---

### Step 10: Meeting & Deal Tracking

```
Prospect books a Calendly meeting → Calendly sends webhook to our app
                                   → App matches email to prospect
                                   → Updates status to "meeting"
                                   → Logs interaction

After the meeting, if they become a client:
   → User creates a "Deal" (value, status: won/lost/negotiating)
   → Prospect status changes to "closed"
```

---

## The Automated Loop (What Happens Without You)

Every 15 minutes, this happens automatically:

```
┌─────────────────────────────────────────────────┐
│              CRON JOB (Every 15 min)            │
│                                                 │
│  1. CHECK REPLIES                               │
│     └─ Read inbox → Classify → Auto-reply      │
│                                                 │
│  2. PROCESS FOLLOW-UPS                          │
│     └─ Find due emails → Personalize → Send    │
│                                                 │
│  3. CHECK BOUNCES                               │
│     └─ Find bounced emails → Mark prospects     │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Database Structure (Where Data Lives)

Think of the database as having these "filing cabinets":

```
MongoDB Database
├── users          → Login credentials, profile info
├── prospects      → All potential clients (name, email, score, research)
├── campaigns      → Email sequences and who's in them
├── interactions   → Log of every email sent/received
├── deals          → Won/lost client deals with revenue
├── templates      → Reusable email sequence templates
└── settings       → API keys, preferences, targeting rules
```

---

## Folder Structure (Where Code Lives)

```
f:\New\dashboard\
├── app\                          ← All pages and API routes
│   ├── (auth)\                   ← Login & signup pages
│   │   ├── login\page.tsx
│   │   └── signup\page.tsx
│   ├── (dashboard)\              ← Protected pages (need login)
│   │   ├── page.tsx              ← Dashboard home
│   │   ├── prospects\page.tsx    ← Manage prospects
│   │   ├── campaigns\            ← Campaign list + detail
│   │   ├── replies\page.tsx      ← Reply inbox
│   │   ├── pipeline\page.tsx     ← Visual deal pipeline
│   │   ├── settings\page.tsx     ← Configuration
│   │   └── profile\page.tsx      ← User profile
│   └── api\                      ← Server-side logic (30+ endpoints)
│       ├── auth\                 ← Login, signup, logout, me
│       ├── prospects\            ← CRUD + score + research
│       ├── campaigns\            ← CRUD + launch + pause + process
│       ├── replies\              ← List + check + reply
│       ├── discover\             ← Find new prospects via Apollo
│       ├── settings\             ← Get/update settings
│       ├── stats\                ← Dashboard metrics
│       ├── deals\                ← Deal tracking
│       ├── templates\            ← Email templates
│       ├── suggestions\          ← AI action recommendations
│       ├── export\               ← CSV export
│       ├── cron\                 ← Automated task runner
│       ├── bounces\              ← Bounce detection
│       ├── reports\              ← Weekly email reports
│       └── webhooks\             ← Calendly integration
├── components\                   ← Reusable UI pieces
│   ├── layout\                   ← Sidebar, Header, PageTransition
│   └── ui\                       ← Buttons, Badges, Charts, Toasts
├── models\                       ← Database schemas (what data looks like)
├── lib\                          ← Shared utilities
│   ├── db.ts                     ← Database connection
│   ├── auth.ts                   ← Password hashing & JWT
│   ├── gmail.ts                  ← Send/receive emails
│   ├── rate-limit.ts             ← Prevent abuse
│   └── utils.ts                  ← Small helpers
├── tests\                        ← Automated tests
└── public\                       ← Static files (images, etc.)
```

---

## How Authentication Works (Security)

```
                    ┌─────────────┐
                    │   Browser   │
                    └──────┬──────┘
                           │ Every request sends cookie automatically
                           ▼
                    ┌─────────────┐
                    │ Middleware   │ ← Security guard
                    │ (checks JWT)│
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        Valid token?   No token?    Public route?
              │            │            │
              ▼            ▼            ▼
        ✅ Add user ID  🚫 Redirect   ✅ Allow through
        to request      to /login     (health, webhooks)
```

**In simple terms:**
1. When you log in, the server gives you an encrypted ticket (JWT) stored in a cookie
2. Every time you visit a page or call an API, the cookie goes along automatically
3. The middleware reads the cookie, verifies it's real, and either lets you through or kicks you to the login page
4. API routes get your user ID injected as a header so they know who's making the request

---

## How AI Is Used (5 Ways)

| Feature | What AI Does | When It Runs |
|---------|-------------|--------------|
| **Lead Scoring** | Rates how likely a prospect is to buy (0-100) | When you click "Score" |
| **Company Research** | Writes summary, pain points, talking points | When you click "Research" |
| **Email Writing** | Personalizes email templates for each person | When campaign launches |
| **Reply Reading** | Classifies replies as positive/negative/neutral | Every 15 minutes (auto) |
| **Smart Suggestions** | Recommends which prospects to focus on today | When you open dashboard |

All AI uses **Google Gemini 3 Flash Preview** — a fast, capable language model.

---

## The Complete Prospect Journey

```
         DISCOVER              SCORE               RESEARCH
     ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
     │ Find on      │    │ AI rates     │    │ AI generates │
     │ Apollo.io    │───▶│ 0-100        │───▶│ pain points  │
     │              │    │              │    │ & hooks      │
     └──────────────┘    └──────────────┘    └──────────────┘
                                                     │
                                                     ▼
         FOLLOW UP            SEND EMAIL         ADD TO CAMPAIGN
     ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
     │ Auto send    │    │ AI writes    │    │ Choose email │
     │ step 2, 3, 4 │◀───│ personalized │◀───│ sequence     │
     │ on schedule  │    │ first email  │    │              │
     └──────────────┘    └──────────────┘    └──────────────┘
            │
            ▼
     ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
     │ AI classifies│    │ Book meeting │    │ Close deal   │
     │ their reply  │───▶│ via Calendly │───▶│ Track revenue│
     │              │    │              │    │              │
     └──────────────┘    └──────────────┘    └──────────────┘
         DETECT REPLY         MEETING              CLIENT! 🎉
```

---

## How to Run This Project

### Prerequisites
- Node.js 18+ installed
- MongoDB database (local or cloud like MongoDB Atlas)
- API keys for: Gemini, Gmail OAuth, Apollo.io (optional)

### Steps

```bash
# 1. Clone the project
git clone <repo-url>
cd New/dashboard

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Then edit .env with your actual API keys

# 4. Run the development server
npm run dev

# 5. Open in browser
# Visit http://localhost:3000

# 6. Sign up for an account and configure settings
```

---

## Glossary

| Term | Meaning |
|------|---------|
| **Prospect** | A potential client you want to reach out to |
| **Campaign** | A sequence of automated emails sent over days/weeks |
| **Step** | One email in a campaign sequence |
| **Interaction** | Any logged event (email sent, reply received, meeting booked) |
| **Score** | AI-generated rating (0-100) of how likely someone is to buy |
| **JWT** | JSON Web Token — a secure way to stay logged in |
| **API Route** | Server-side code that handles requests (like a waiter taking orders) |
| **Middleware** | Code that runs before every request (like a security checkpoint) |
| **Cron Job** | A task that runs automatically on a schedule |
| **Webhook** | A way for external services (Calendly) to notify our app when something happens |
| **OAuth** | A secure way to let our app access Gmail without knowing your password |
| **MongoDB** | A database that stores data as flexible documents (like JSON files) |
| **Mongoose** | A library that defines the shape of data before storing it |

---

## Common Questions

**Q: Does this send spam?**  
A: No. It has safeguards: daily send limits, send windows (business hours only), automatic unsubscribe handling, bounce detection, and rate limiting.

**Q: What happens if someone says "unsubscribe"?**  
A: The AI detects it, marks them as unsubscribed, and removes them from all campaigns. They'll never be emailed again.

**Q: Do I need all the API keys?**  
A: Only Gemini and MongoDB are required for basic functionality. Gmail is needed to actually send emails. Apollo is needed to discover new prospects.

**Q: Can multiple people use this?**  
A: Yes! Each user has their own account, prospects, campaigns, and settings. Data is isolated per user.

**Q: How much does it cost to run?**  
A: The app itself is free to host on Vercel. Costs come from: Gemini API (free tier available), Gmail (free), MongoDB Atlas (free tier: 512MB). Note: Apollo.io's people search API requires a paid plan — the free tier does NOT include the search endpoint. You can still add prospects manually or via CSV import.
