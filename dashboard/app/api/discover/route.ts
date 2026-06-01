import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getDecryptedSettings } from '@/lib/settings';
import { Prospect } from '@/models/Prospect';
import { logger } from '@/lib/logger';

const SNOV_CLIENT_ID = process.env.SNOV_CLIENT_ID || '';
const SNOV_CLIENT_SECRET = process.env.SNOV_CLIENT_SECRET || '';

async function getSnovToken(): Promise<string> {
  const res = await fetch('https://api.snov.io/v1/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: SNOV_CLIENT_ID,
      client_secret: SNOV_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error('Failed to authenticate with Snov.io');
  const data = await res.json();
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const settings: any = await getDecryptedSettings(userId);
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found. Please configure your settings first.' }, { status: 400 });
    }

    if (!SNOV_CLIENT_ID || !SNOV_CLIENT_SECRET) {
      return NextResponse.json({ error: 'Snov.io credentials not configured in .env (SNOV_CLIENT_ID, SNOV_CLIENT_SECRET)' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'search';

    // Import mode: directly save provided prospects
    if (mode === 'import') {
      const prospects = body.prospects as any[];
      if (!prospects?.length) {
        return NextResponse.json({ error: 'No prospects to import' }, { status: 400 });
      }

      let created = 0;
      let skipped = 0;

      for (const p of prospects) {
        if (!p.email || !p.firstName || !p.company) {
          skipped++;
          continue;
        }
        try {
          await Prospect.create({
            userId,
            firstName: p.firstName,
            lastName: p.lastName || '',
            email: p.email,
            title: p.title || '',
            company: p.company,
            industry: p.industry || '',
            techStack: p.techStack || [],
            companySize: p.companySize || null,
            linkedinUrl: p.linkedinUrl || '',
            status: 'new',
          });
          created++;
        } catch (err: any) {
          if (err.code === 11000) skipped++;
          else { skipped++; logger.error('Error creating prospect', err); }
        }
      }

      return NextResponse.json({ created, skipped, discovered: prospects.length });
    }

    // Search mode: use Snov.io Database Search
    const targeting = body.targeting || settings.targeting || {};
    const perPage = Math.min(body.perPage || 10, 25);

    const token = await getSnovToken();

    // Build Snov.io search payload
    const searchBody: Record<string, any> = {
      limit: perPage,
      offset: 0,
    };

    if (targeting.titles?.length) {
      searchBody.positions = targeting.titles;
    }
    if (targeting.industries?.length) {
      searchBody.industries = targeting.industries;
    }
    if (targeting.location) {
      searchBody.countries = [targeting.location];
    }
    if (targeting.companySize) {
      const match = targeting.companySize.replace(/\s*employees?\s*/i, '').match(/(\d+)\s*[-–]\s*(\d+)/);
      if (match) {
        searchBody.companySizeFrom = parseInt(match[1]);
        searchBody.companySizeTo = parseInt(match[2]);
      }
    }
    if (targeting.keywords) {
      searchBody.technologies = targeting.keywords.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (targeting.companyName) {
      searchBody.companyName = targeting.companyName;
    }

    const snovRes = await fetch('https://api.snov.io/v2/database-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(searchBody),
    });

    if (!snovRes.ok) {
      const text = await snovRes.text();
      logger.error('Snov.io API error', undefined, { status: snovRes.status, body: text });

      if (snovRes.status === 401 || snovRes.status === 403) {
        return NextResponse.json({ error: 'Snov.io authentication failed. Check SNOV_CLIENT_ID and SNOV_CLIENT_SECRET in .env' }, { status: 401 });
      }
      if (snovRes.status === 429) {
        return NextResponse.json({ error: 'Snov.io rate limit reached. Try again later.' }, { status: 429 });
      }
      return NextResponse.json({ error: `Snov.io returned ${snovRes.status}` }, { status: 502 });
    }

    const data = await snovRes.json();
    const people = data.data || data.results || [];

    const results = people.map((p: any, i: number) => ({
      id: p.id?.toString() || `snov_${Date.now()}_${i}`,
      firstName: p.firstName || p.first_name || '',
      lastName: p.lastName || p.last_name || '',
      email: p.email || p.emails?.[0]?.email || '',
      title: p.position || p.currentJob?.position || '',
      company: p.companyName || p.currentJob?.companyName || '',
      industry: p.industry || p.currentJob?.industry || '',
      companySize: p.companySize || null,
      linkedinUrl: p.socialLinks?.linkedin || p.linkedin || '',
      techStack: p.technologies || [],
    }));

    return NextResponse.json({
      results,
      total: data.total || data.totalCount || results.length,
    });
  } catch (error: any) {
    logger.error('POST /api/discover error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
