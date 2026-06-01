import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Template } from '@/models/Template';
import { validateBody, templateSchema } from '@/lib/validate';
import { logger } from '@/lib/logger';

const DEFAULT_TEMPLATES = [
  {
    name: 'Direct Value Prop',
    description: 'Lead with specific value and ROI. Best for prospects with clear tech needs.',
    category: 'cold_outreach',
    isDefault: true,
    steps: [
      {
        stepNumber: 1,
        subject: '{{company}} + faster shipping',
        body: `Hi {{firstName}},

I noticed {{company}} is building in the {{industry}} space. Companies at your stage often hit a wall when trying to ship new features while keeping the core product stable.

We're a US-based dev team that helps companies like yours ship 2-3x faster by handling the heavy lifting — whether that's a new mobile app, dashboard rebuild, or API layer.

Would a quick 15-min call make sense to see if there's a fit?

Best,
Alex`,
        delayDays: 0,
      },
      {
        stepNumber: 2,
        subject: 'Re: {{company}} + faster shipping',
        body: `Hi {{firstName}},

Quick follow-up — I know things get busy. I thought this might resonate:

We recently helped a {{industry}} company (similar size to {{company}}) launch their mobile app in 8 weeks instead of the 6 months they'd budgeted internally.

Happy to share the details if useful. 15 minutes?

Alex`,
        delayDays: 3,
      },
      {
        stepNumber: 3,
        subject: 'Re: {{company}} + faster shipping',
        body: `Hi {{firstName}},

Last note from me — I don't want to be a pest.

If building/shipping faster isn't a priority right now, totally get it. But if it ever becomes one, here's my Calendly: [link]

Either way, wishing {{company}} the best.

Alex`,
        delayDays: 5,
      },
    ],
  },
  {
    name: 'Pain Point Opener',
    description: 'Lead with their likely challenge. Best when you know their tech stack.',
    category: 'cold_outreach',
    isDefault: true,
    steps: [
      {
        stepNumber: 1,
        subject: 'Scaling {{company}}\'s engineering?',
        body: `Hi {{firstName}},

Most {{industry}} companies I talk to at the {{companySize}}-person stage hit the same wall: too many features to build, not enough senior devs to build them.

Sound familiar?

We're a US-based team that embeds with your existing engineers to unblock the backlog — no 6-month onboarding, no timezone headaches.

Worth a quick chat to see if we could help {{company}} ship faster?

Alex`,
        delayDays: 0,
      },
      {
        stepNumber: 2,
        subject: 'Re: Scaling {{company}}\'s engineering?',
        body: `Hi {{firstName}},

Wanted to follow up with a concrete example:

A {{industry}} startup came to us with a 4-month backlog of customer-requested features. We shipped the top 5 in 6 weeks, which directly drove their Series B metrics.

If {{company}} has a similar backlog challenge, I'd love to share how we approach it. 15 min?

Alex`,
        delayDays: 4,
      },
      {
        stepNumber: 3,
        subject: 'One last thought for {{company}}',
        body: `Hi {{firstName}},

I'll keep this brief — if scaling engineering capacity isn't top of mind right now, I totally understand.

But if it ever becomes urgent (funding round, big launch, key hire falling through), we can usually spin up a team in under 2 weeks.

Bookmark this for later if needed: [calendly link]

Cheers,
Alex`,
        delayDays: 5,
      },
    ],
  },
  {
    name: 'Case Study Hook',
    description: 'Lead with social proof from a similar company. High trust signal.',
    category: 'case_study',
    isDefault: true,
    steps: [
      {
        stepNumber: 1,
        subject: 'How a {{industry}} company cut dev time 40%',
        body: `Hi {{firstName}},

I saw {{company}} is growing in the {{industry}} space — congrats on the momentum.

Quick context: we recently helped a similar-sized {{industry}} company rebuild their customer-facing app in 10 weeks. The result: 40% faster feature releases and a 2.3x improvement in user retention.

I think we could do something similar for {{company}}. Worth 15 minutes to explore?

Alex`,
        delayDays: 0,
      },
      {
        stepNumber: 2,
        subject: 'Re: How a {{industry}} company cut dev time 40%',
        body: `Hi {{firstName}},

Following up — I realize "40% faster" is a bold claim without context.

Here's what made it work: we took over their mobile app development entirely, so their core team could focus on backend infrastructure. No context-switching, no hiring delays.

If {{company}} has a similar split between what's urgent and what's important, we should talk.

Alex`,
        delayDays: 3,
      },
      {
        stepNumber: 3,
        subject: 'Last one from me, {{firstName}}',
        body: `Hi {{firstName}},

I know you're busy running things at {{company}}, so I'll make this my last message.

If you ever want to explore working with a US dev team that actually delivers on time (novel concept, I know) — my calendar is always open: [calendly link]

No pressure either way. Wishing you and the team the best.

Alex`,
        delayDays: 5,
      },
    ],
  },
];

async function ensureDefaults(userId: string) {
  const existing = await Template.countDocuments({ isDefault: true, userId });
  if (existing === 0) {
    await Template.insertMany(
      DEFAULT_TEMPLATES.map(t => ({ ...t, userId, usageCount: 0 }))
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    await ensureDefaults(userId);

    const templates = await Template.find({ userId }).sort({ isDefault: -1, usageCount: -1 }).lean();
    return NextResponse.json({ templates });
  } catch (error) {
    logger.error('GET /api/templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validation = validateBody(templateSchema, body);
    if (!validation.success) return validation.response;
    const { name, description, category, steps } = validation.data;

    if (!name || !steps?.length) {
      return NextResponse.json({ error: 'Name and at least one step required' }, { status: 400 });
    }

    await connectDB();

    const template = await Template.create({
      userId,
      name,
      description: description || '',
      category: category || 'cold_outreach',
      steps: steps.map((s: any, i: number) => ({
        stepNumber: i + 1,
        subject: s.subject,
        body: s.body,
        delayDays: s.delayDays || 3,
      })),
      isDefault: false,
      usageCount: 0,
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    logger.error('POST /api/templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
