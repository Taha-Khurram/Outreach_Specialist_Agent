import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Settings } from '@/models/Settings';
import { Prospect } from '@/models/Prospect';
import { logger } from '@/lib/logger';

function parseCompanySize(size: string): string[] {
  const cleaned = size.replace(/\s*employees?\s*/i, '').trim();
  const match = cleaned.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (match) return [`${match[1]},${match[2]}`];
  return ['1,200'];
}

function mapPerson(person: any) {
  return {
    apolloId: person.id || '',
    firstName: person.first_name || '',
    lastName: person.last_name || '',
    email: person.email || '',
    title: person.title || '',
    company: person.organization?.name || '',
    industry: person.organization?.industry || '',
    techStack: person.organization?.technologies || [],
    funding: person.organization?.latest_funding_round_type || '',
    fundingAmount: person.organization?.latest_funding_amount || null,
    companySize: person.organization?.estimated_num_employees || null,
    linkedinUrl: person.linkedin_url || '',
    status: 'new' as const,
  };
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const settings: any = await Settings.findOne({ userId }).lean();
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found. Please configure your settings first.' }, { status: 400 });
    }

    const apolloApiKey = settings.apiKeys?.apolloApiKey;
    if (!apolloApiKey) {
      return NextResponse.json({ error: 'Apollo API key not configured. Add it in Settings → API Keys.' }, { status: 400 });
    }

    const targeting = settings.targeting || {};
    const searchBody = {
      person_titles: targeting.titles?.length ? targeting.titles : ['CEO', 'CTO', 'VP Engineering', 'Founder'],
      organization_industry_tag_ids: targeting.industries?.length ? targeting.industries : ['SaaS', 'Technology'],
      organization_num_employees_ranges: parseCompanySize(targeting.companySize || '10-200 employees'),
      person_locations: targeting.location ? [targeting.location] : ['United States'],
      per_page: 50,
    };

    const apolloRes = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apolloApiKey,
      },
      body: JSON.stringify(searchBody),
    });

    if (!apolloRes.ok) {
      const text = await apolloRes.text();
      logger.error('Apollo API error', undefined, { status: apolloRes.status, body: text });
      return NextResponse.json(
        { error: `Apollo API returned ${apolloRes.status}. Check your API key and try again.` },
        { status: 502 }
      );
    }

    const data = await apolloRes.json();
    const people = data.people || [];

    let created = 0;
    let skipped = 0;

    for (const person of people) {
      const mapped = mapPerson(person);
      if (!mapped.email || !mapped.firstName || !mapped.company) {
        skipped++;
        continue;
      }

      try {
        await Prospect.create({ ...mapped, userId });
        created++;
      } catch (err: any) {
        if (err.code === 11000) {
          skipped++;
        } else {
          skipped++;
          logger.error('Error creating prospect', err);
        }
      }
    }

    return NextResponse.json({
      discovered: people.length,
      created,
      skipped,
    });
  } catch (error) {
    logger.error('POST /api/discover error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
