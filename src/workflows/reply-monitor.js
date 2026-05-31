import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getUnreadReplies, markAsRead } from '../services/gmail.js';
import { classifyReply } from '../services/ai.js';
import logger from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = resolve(__dirname, '../../logs/monitor-state.json');

function loadState() {
  if (existsSync(STATE_FILE)) {
    return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
  }
  return { lastCheck: Date.now() - 3600000, processedIds: [] };
}

function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function monitorReplies() {
  const state = loadState();
  logger.info('Checking for new replies...', { since: new Date(state.lastCheck).toISOString() });

  const replies = await getUnreadReplies(state.lastCheck);
  const newReplies = replies.filter(r => !state.processedIds.includes(r.id));

  logger.info(`Found ${newReplies.length} new replies`);

  const classified = [];

  for (const reply of newReplies) {
    try {
      const classification = await classifyReply(reply.body);
      classified.push({
        ...reply,
        classification: classification.classification,
        confidence: classification.confidence,
        request: classification.request,
        hasQuestion: classification.hasQuestion,
        processedAt: new Date().toISOString()
      });

      await markAsRead(reply.id);
      state.processedIds.push(reply.id);
      logger.info('Reply classified', {
        from: reply.from,
        classification: classification.classification,
        confidence: classification.confidence
      });
    } catch (err) {
      logger.error('Failed to classify reply', { id: reply.id, error: err.message });
    }
  }

  // Keep only last 500 IDs to prevent unbounded growth
  if (state.processedIds.length > 500) {
    state.processedIds = state.processedIds.slice(-500);
  }

  state.lastCheck = Date.now();
  saveState(state);

  return classified;
}

export { monitorReplies };
