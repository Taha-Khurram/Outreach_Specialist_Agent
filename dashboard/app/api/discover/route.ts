import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getDecryptedSettings } from '@/lib/settings';
import { Prospect } from '@/models/Prospect';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

async function searchWithApollo(apolloApiKey: string, targeting: any, page: number, perPage: number) {
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

  const apolloRes = await fetch('https://api.apollo.io/v1/people/search', {
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
    const status = apolloRes.status;
    logger.error('Apollo API error', undefined, { status, body: text });

    if (status === 403) {
      throw new Error('APOLLO_PLAN_RESTRICTED');
    }
    if (status === 401) {
      throw new Error('Invalid Apollo API key. Check Settings → API Keys.');
    }
    if (status === 429) {
      throw new Error('Apollo rate limit reached. Try again in a few minutes.');
    }
    throw new Error(`Apollo API returned ${status}. Check your API key and try again.`);
  }

  const data = await apolloRes.json();
  return {
    people: data.people || [],
    totalResults: data.pagination?.total_entries || (data.people || []).length,
    totalPages: data.pagination?.total_pages || 1,
  };
}

async function searchWithGemini(geminiApiKey: string, targeting: any, page: number, perPage: number) {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const criteria: string[] = [];
  if (targeting.titles?.length) criteria.push(`Job titles: ${targeting.titles.join(', ')}`);
  if (targeting.industries?.length) criteria.push(`Industries: ${targeting.industries.join(', ')}`);
  if (targeting.location) criteria.push(`Location: ${targeting.location}`);
  if (targeting.companySize) criteria.push(`Company size: ${targeting.companySize} employees`);
  if (targeting.keywords) criteria.push(`Keywords/tech: ${targeting.keywords}`);
  if (targeting.companyName) criteria.push(`Company: ${targeting.companyName}`);
  if (targeting.domains?.length) criteria.push(`Domains: ${targeting.domains.join(', ')}`);

  if (criteria.length === 0) {
    criteria.push('Job titles: CEO, CTO, Founder, VP Engineering');
    criteria.push('Industries: SaaS, Technology');
    criteria.push('Company size: 10-200 employees');
  }

  const prompt = `You are a B2B lead research assistant. Based on the following targeting criteria, generate a list of ${perPage} realistic business prospects that match.

Targeting criteria:
${criteria.join('\n')}

For each prospect, provide realistic information based on your knowledge of real companies in these industries. Use real company names and realistic (but generated) contact details.

Return ONLY a valid JSON array with exactly ${perPage} objects. Each object must have:
- "id": a unique string identifier (use format "ai_" + random 8 chars)
- "firstName": string
- "lastName": string
- "email": a realistic business email (firstname@companydomain.com format)
- "title": their job title
- "company": real company name that fits the criteria
- "industry": the company's industry
- "companySize": estimated number of employees (number)
- "linkedinUrl": leave as empty string
- "techStack": array of 2-4 relevant technologies the company likely uses

IMPORTANT: Use real well-known companies that match the criteria. Generate realistic email patterns based on actual company domains. Do NOT use placeholder names. Return ONLY the JSON array, no markdown formatting.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    const prospects = JSON.parse(cleaned);

    if (!Array.isArray(prospects)) throw new Error('Not an array');

    return {
      people: prospects.map((p: any) => ({
        apolloId: p.id || `ai_${Math.random().toString(36).slice(2, 10)}`,
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        email: p.email || '',
        title: p.title || '',
        company: p.company || '',
        industry: p.industry || '',
        techStack: p.techStack || [],
        funding: '',
        fundingAmount: null,
        companySize: p.companySize || null,
        linkedinUrl: p.linkedinUrl || '',
        status: 'new' as const,
      })),
      totalResults: perPage,
      totalPages: 1,
      source: 'ai',
    };
  } catch {
    throw new Error('AI discovery failed to generate valid results. Try again.');
  }
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

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'auto';
    const source = body.source || 'auto'; // 'apollo', 'ai', or 'auto'

    const targeting = body.targeting || settings.targeting || {};
    const page = body.page || 1;
    const perPage = Math.min(body.perPage || 25, 100);

    const apolloApiKey = settings.apiKeys?.apolloApiKey;
    const geminiApiKey = settings.apiKeys?.geminiApiKey || process.env.GEMINI_API_KEY;

    let searchResults: any;
    let usedSource = source;

    if (source === 'apollo' || (source === 'auto' && apolloApiKey)) {
      if (!apolloApiKey) {
        return NextResponse.json({ error: 'Apollo API key not configured. Add it in Settings → API Keys, or use AI discovery.' }, { status: 400 });
      }

      try {
        const apollo = await searchWithApollo(apolloApiKey, targeting, page, perPage);
        searchResults = { ...apollo, source: 'apollo' };
        usedSource = 'apollo';
      } catch (err: any) {
        if (err.message === 'APOLLO_PLAN_RESTRICTED') {
          if (geminiApiKey && source !== 'apollo') {
            // Fall back to AI discovery
            logger.info('Apollo search restricted on free plan, falling back to AI discovery');
            searchResults = await searchWithGemini(geminiApiKey, targeting, page, perPage);
            usedSource = 'ai';
          } else {
            return NextResponse.json({
              error: 'Apollo People Search requires a paid plan. Switch to AI Discovery mode (powered by Gemini) for free prospect research.',
              suggestion: 'ai',
            }, { status: 403 });
          }
        } else {
          return NextResponse.json({ error: err.message }, { status: 502 });
        }
      }
    } else if (geminiApiKey) {
      searchResults = await searchWithGemini(geminiApiKey, targeting, page, perPage);
      usedSource = 'ai';
    } else {
      return NextResponse.json({
        error: 'No discovery source available. Configure either Apollo API key (paid plan) or Gemini API key in Settings.',
      }, { status: 400 });
    }

    const people = searchResults.people || [];

    if (mode === 'search') {
      const results = usedSource === 'apollo' ? people.map(mapPerson) : people;
      return NextResponse.json({
        results,
        pagination: { page, perPage, total: searchResults.totalResults, totalPages: searchResults.totalPages },
        source: usedSource,
      });
    }

    // Import mode
    const selectedIds = body.selectedIds as string[] | undefined;
    const toImport = selectedIds
      ? people.filter((p: any) => selectedIds.includes(p.apolloId || p.id))
      : (usedSource === 'apollo' ? people.map(mapPerson) : people);

    let created = 0;
    let skipped = 0;

    for (const person of toImport) {
      const mapped = usedSource === 'apollo' ? mapPerson(person) : person;
      if (!mapped.email || !mapped.firstName || !mapped.company) {
        skipped++;
        continue;
      }

      try {
        await Prospect.create({ ...mapped, userId, apolloId: mapped.apolloId || undefined });
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
      source: usedSource,
    });
  } catch (error) {
    logger.error('POST /api/discover error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
