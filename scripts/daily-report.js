#!/usr/bin/env node
import { getDashboardStats, updateDashboard } from '../src/services/sheets.js';
import logger from '../src/utils/logger.js';

async function main() {
  logger.info('[CRON] Daily report started');
  const stats = await getDashboardStats();

  console.log('\n=== Daily Performance Report ===');
  console.log(`Total Prospects: ${stats.total}`);
  console.log(`Emails Sent:     ${stats.sent}`);
  console.log(`Replies:         ${stats.replies}`);
  console.log(`Meetings:        ${stats.meetings}`);
  console.log(`Closed Deals:    ${stats.closed}`);
  console.log(`Reply Rate:      ${stats.sent > 0 ? ((stats.replies / stats.sent) * 100).toFixed(1) : 0}%`);
  console.log(`Cost:            $0`);
  console.log('================================\n');

  await updateDashboard(stats);
  logger.info('[CRON] Daily report complete', stats);
}

main().catch(err => {
  logger.error('[CRON] Daily report failed', { error: err.message });
  process.exit(1);
});
