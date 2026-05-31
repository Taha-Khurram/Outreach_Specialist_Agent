import cron from 'node-cron';
import config from './config.js';
import logger from './utils/logger.js';
import { discoverProspects } from './workflows/prospect-discovery.js';
import { generateEmails } from './workflows/email-generation.js';
import { deliverEmails } from './workflows/email-delivery.js';
import { monitorReplies } from './workflows/reply-monitor.js';
import { handleClassifiedReplies } from './workflows/reply-handler.js';
import { getDashboardStats, updateDashboard } from './services/sheets.js';
import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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

async function runDiscoveryPipeline() {
  logger.info('=== Running Discovery Pipeline ===');
  try {
    const prospects = await discoverProspects();
    if (prospects.length > 0) {
      await generateEmails(prospects);
    }
    logger.info('Discovery pipeline complete', { newProspects: prospects.length });
  } catch (err) {
    logger.error('Discovery pipeline failed', { error: err.message });
  }
}

async function runEmailDelivery() {
  logger.info('=== Running Email Delivery ===');
  try {
    const result = await deliverEmails();
    logger.info('Email delivery complete', result);
  } catch (err) {
    logger.error('Email delivery failed', { error: err.message });
  }
}

async function runReplyMonitor() {
  logger.info('=== Checking Replies ===');
  try {
    const classified = await monitorReplies();
    if (classified.length > 0) {
      const prospects = loadAllProspects();
      const results = await handleClassifiedReplies(classified, prospects);
      logger.info('Reply handling complete', {
        processed: results.length,
        actions: results.map(r => r.action)
      });
    }
  } catch (err) {
    logger.error('Reply monitor failed', { error: err.message });
  }
}

async function runDailyReport() {
  logger.info('=== Generating Daily Report ===');
  try {
    const stats = await getDashboardStats();
    await updateDashboard(stats);
    logger.info('Daily report', stats);
  } catch (err) {
    logger.error('Daily report failed', { error: err.message });
  }
}

function startScheduler() {
  logger.info('Starting agent scheduler...');
  logger.info('Schedules:', config.schedule);

  cron.schedule(config.schedule.discoveryTime, runDiscoveryPipeline);
  cron.schedule(config.schedule.emailSendTime, runEmailDelivery);
  cron.schedule(config.schedule.replyCheckInterval, runReplyMonitor);
  cron.schedule(config.schedule.reportTime, runDailyReport);

  logger.info('All cron jobs scheduled. Agent is running.');
}

const command = process.argv[2];

switch (command) {
  case 'discover':
    runDiscoveryPipeline().then(() => process.exit(0));
    break;
  case 'send':
    runEmailDelivery().then(() => process.exit(0));
    break;
  case 'monitor':
    runReplyMonitor().then(() => process.exit(0));
    break;
  case 'report':
    runDailyReport().then(() => process.exit(0));
    break;
  default:
    startScheduler();
}
