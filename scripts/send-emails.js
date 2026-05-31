#!/usr/bin/env node
import { deliverEmails } from '../src/workflows/email-delivery.js';
import logger from '../src/utils/logger.js';

async function main() {
  logger.info('[CRON] Email delivery started');
  const result = await deliverEmails();
  logger.info('[CRON] Email delivery complete', result);
}

main().catch(err => {
  logger.error('[CRON] Email delivery failed', { error: err.message });
  process.exit(1);
});
