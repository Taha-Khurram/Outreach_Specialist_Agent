import config from '../config.js';
import logger from '../utils/logger.js';
import { apolloLimiter } from '../utils/rate-limiter.js';

const { apiKey, baseUrl, searchQuery, monthlyLimit } = config.apollo;

async function searchProspects(customQuery = {}) {
  const query = { ...searchQuery, ...customQuery };

  return apolloLimiter.execute(async () => {
    const response = await fetch(`${baseUrl}/mixed_people/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify(query)
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Apollo search failed', { status: response.status, error });
      throw new Error(`Apollo search failed: ${response.status}`);
    }

    const data = await response.json();
    logger.info(`Found ${data.people?.length || 0} prospects`);
    return data.people || [];
  });
}

async function enrichPerson(personId) {
  return apolloLimiter.execute(async () => {
    const response = await fetch(`${baseUrl}/people/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify({ id: personId, reveal_personal_emails: false })
    });

    if (!response.ok) {
      logger.error('Apollo enrich failed', { personId, status: response.status });
      throw new Error(`Apollo enrich failed: ${response.status}`);
    }

    const data = await response.json();
    return mapToProspect(data.person);
  });
}

function mapToProspect(person) {
  if (!person) return null;
  return {
    id: person.id,
    name: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
    firstName: person.first_name,
    lastName: person.last_name,
    email: person.email,
    title: person.title,
    company: person.organization?.name || '',
    industry: person.organization?.industry || '',
    techStack: person.organization?.technologies || [],
    funding: person.organization?.latest_funding_round_type || '',
    fundingAmount: person.organization?.latest_funding_amount || null,
    lastFundingDate: person.organization?.last_funding_at || null,
    companySize: person.organization?.estimated_num_employees || null,
    linkedinUrl: person.linkedin_url || '',
    recentNews: '',
    status: 'new',
    createdAt: new Date().toISOString()
  };
}

async function searchAndEnrich(customQuery = {}) {
  const people = await searchProspects(customQuery);
  const prospects = [];

  for (const person of people) {
    try {
      const prospect = mapToProspect(person);
      if (prospect && prospect.email) {
        prospects.push(prospect);
      }
    } catch (err) {
      logger.warn('Failed to process prospect', { id: person.id, error: err.message });
    }
  }

  logger.info(`Processed ${prospects.length} valid prospects`);
  return prospects;
}

export { searchProspects, enrichPerson, searchAndEnrich, mapToProspect };
