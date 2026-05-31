import { writeFileSync, existsSync, readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { searchAndEnrich } from '../services/apollo.js';
import { appendProspect } from '../services/sheets.js';
import logger from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROSPECTS_DIR = resolve(__dirname, '../../prospects');

function getProspectsFilePath() {
  const date = new Date().toISOString().split('T')[0];
  return resolve(PROSPECTS_DIR, `prospects-${date}.json`);
}

function loadExistingEmails() {
  const emails = [];
  try {
    for (const file of readdirSync(PROSPECTS_DIR)) {
      if (file.endsWith('.json')) {
        const data = JSON.parse(readFileSync(resolve(PROSPECTS_DIR, file), 'utf-8'));
        emails.push(...data.map(p => p.email));
      }
    }
  } catch {
    // No existing files
  }
  return new Set(emails);
}

async function discoverProspects(customQuery = {}) {
  logger.info('Starting prospect discovery...');

  const prospects = await searchAndEnrich(customQuery);
  const existingEmails = loadExistingEmails();

  const newProspects = prospects.filter(p => !existingEmails.has(p.email));
  logger.info(`Found ${newProspects.length} new prospects (${prospects.length - newProspects.length} duplicates filtered)`);

  if (newProspects.length === 0) {
    logger.info('No new prospects found');
    return [];
  }

  const filePath = getProspectsFilePath();
  let existing = [];
  if (existsSync(filePath)) {
    existing = JSON.parse(readFileSync(filePath, 'utf-8'));
  }

  const merged = [...existing, ...newProspects];
  writeFileSync(filePath, JSON.stringify(merged, null, 2));
  logger.info(`Saved ${newProspects.length} prospects to ${filePath}`);

  for (const prospect of newProspects) {
    try {
      await appendProspect(prospect);
    } catch (err) {
      logger.warn('Failed to log prospect to sheet', { id: prospect.id, error: err.message });
    }
  }

  return newProspects;
}

export { discoverProspects, getProspectsFilePath };
