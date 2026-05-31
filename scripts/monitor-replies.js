#!/usr/bin/env node
import { monitorReplies } from '../src/workflows/reply-monitor.js';
import { handleClassifiedReplies } from '../src/workflows/reply-handler.js';
import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import logger from '../src/utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROSPECTS_DIR = resolve(__dirname, '../prospects');

function loadAllProspects() {
  try {
    const files = readdirSync(PROSPECTS_DIR).filter(f => f.endsWith('.json'));
    const all = [];
    for (const file of files) {
      const data = JSON.parse(readFileSync(resolve(PROSPECTS_DIR, file), 'utf-8'));
      all.push(...data);
    }
    return all;
  } catch {
    return [];
  }
}

async function main() {
  logger.info('[CRON] Reply monitor started');
  const classified = await monitorReplies();

  if (classified.length > 0) {
    const prospects = loadAllProspects();
    const results = await handleClassifiedReplies(classified, prospects);
    logger.info('[CRON] Replies handled', {
      total: results.length,
      actions: results.map(r => r.action)
    });
  } else {
    logger.info('[CRON] No new replies');
  }
}

main().catch(err => {
  logger.error('[CRON] Reply monitor failed', { error: err.message });
  process.exit(1);
});
