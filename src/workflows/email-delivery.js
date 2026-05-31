import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { sendEmail } from '../services/gmail.js';
import { logInteraction, updateProspectStatus } from '../services/sheets.js';
import { gmailLimiter } from '../utils/rate-limiter.js';
import config from '../config.js';
import logger from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EMAILS_DIR = resolve(__dirname, '../../emails');

async function deliverEmails() {
  const files = readdirSync(EMAILS_DIR).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    logger.info('No email files to process');
    return { sent: 0, failed: 0 };
  }

  const latest = files.sort().pop();
  const filePath = resolve(EMAILS_DIR, latest);
  const emails = JSON.parse(readFileSync(filePath, 'utf-8'));

  const unsent = emails.filter(e => !e.sent);
  logger.info(`Found ${unsent.length} unsent emails`);

  let sent = 0;
  let failed = 0;

  for (const email of unsent) {
    if (!gmailLimiter.canProceed(config.email.dailyLimit)) {
      logger.warn('Daily email limit reached, stopping');
      break;
    }

    try {
      const result = await sendEmail({
        to: email.to,
        subject: email.subject,
        body: email.body,
        prospectId: email.prospectId,
        taskId: `outreach-${Date.now()}`
      });

      email.sent = true;
      email.sentAt = new Date().toISOString();
      email.messageId = result.id;
      sent++;

      await updateProspectStatus(email.prospectId, 'contacted');
      await logInteraction({
        prospectId: email.prospectId,
        type: 'email_sent',
        subject: email.subject,
        status: 'contacted',
        notes: `Message ID: ${result.id}`
      });
    } catch (err) {
      failed++;
      email.error = err.message;
      logger.error('Email delivery failed', { to: email.to, error: err.message });
    }
  }

  writeFileSync(filePath, JSON.stringify(emails, null, 2));
  logger.info(`Delivery complete: ${sent} sent, ${failed} failed`);
  return { sent, failed };
}

export { deliverEmails };
