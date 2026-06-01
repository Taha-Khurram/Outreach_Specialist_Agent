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

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'auto';

    const targeting = body.targeting || settings.targeting || {};
    const page = body.page || 1;
    const perPage = Math.min(body.perPage || 25, 100);

    const searchBody: Record<string, any> = {
      page,
      per_page: perPage,
    };

    if (targeting.titles?.length) {
      searchBody.person_titles = targeting.titles;
    }
    if (targeting.location) {
      searchBody.person_locations = Array.isArray(targeting.location) ? targeting.location : [targeting.location];
    }
    if (targeting.companySize) {
      searchBody.organization_num_employees_ranges = parseCompanySize(targeting.companySize);
    }
    if (targeting.industries?.length) {
      searchBody.q_organization_keyword_tags = targeting.industries;
    }
    if (targeting.keywords) {
      searchBody.q_keywords = targeting.keywords;
    }
    if (targeting.domains?.length) {
      const domainList = Array.isArray(targeting.domains) ? targeting.domains : [targeting.domains];
      searchBody.q_organization_domains = domainList.join('\n');
    }
    if (targeting.companyName) {
      searchBody.q_organization_name = targeting.companyName;
    }

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
      if (apolloRes.status === 401 || apolloRes.status === 403) {
        return NextResponse.json({ error: 'Invalid Apollo API key. Check Settings → API Keys.' }, { status: 401 });
      }
      if (apolloRes.status === 429) {
        return NextResponse.json({ error: 'Apollo rate limit reached. Try again in a few minutes.' }, { status: 429 });
      }
      return NextResponse.json(
        { error: `Apollo API returned ${apolloRes.status}. Check your API key and try again.` },
        { status: 502 }
      );
    }

    const data = await apolloRes.json();
    const people = data.people || [];
    const totalResults = data.pagination?.total_entries || people.length;
    const totalPages = data.pagination?.total_pages || 1;

    // Search mode: return results for preview without importing
    if (mode === 'search') {
      const results = people.map(mapPerson);
      return NextResponse.json({
        results,
        pagination: { page, perPage, total: totalResults, totalPages },
      });
    }

    // Import mode: import selected or all
    const selectedIds = body.selectedIds as string[] | undefined;
    const toImport = selectedIds
      ? people.filter((p: any) => selectedIds.includes(p.id))
      : people;

    let created = 0;
    let skipped = 0;

    for (const person of toImport) {
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
      discovered: toImport.length,
      created,
      skipped,
    });
  } catch (error) {
    logger.error('POST /api/discover error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
