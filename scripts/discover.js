#!/usr/bin/env node
import { discoverProspects } from '../src/workflows/prospect-discovery.js';
import { generateEmails } from '../src/workflows/email-generation.js';
import logger from '../src/utils/logger.js';

async function main() {
  logger.info('[CRON] Prospect discovery started');
  const prospects = await discoverProspects();

  if (prospects.length > 0) {
    logger.info(`[CRON] Generating emails for ${prospects.length} new prospects`);
    await generateEmails(prospects);
  }

  logger.info('[CRON] Discovery job complete');
}

main().catch(err => {
  logger.error('[CRON] Discovery failed', { error: err.message });
  process.exit(1);
});
