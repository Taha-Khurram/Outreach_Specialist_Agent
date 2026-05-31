import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import { generateEmail } from '../services/ai.js';
import logger from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = resolve(__dirname, '../templates');
const EMAILS_DIR = resolve(__dirname, '../../emails');

function loadTemplate(name = 'cold-email') {
  const templatePath = resolve(TEMPLATES_DIR, `${name}.hbs`);
  const source = readFileSync(templatePath, 'utf-8');
  return Handlebars.compile(source);
}

async function generateEmails(prospects) {
  logger.info(`Generating emails for ${prospects.length} prospects`);
  const template = loadTemplate();
  const generated = [];

  for (const prospect of prospects) {
    if (prospect.status !== 'new') continue;

    try {
      const templateText = template({
        firstName: prospect.firstName,
        company: prospect.company,
        industry: prospect.industry,
        funding: prospect.funding,
        techStack: prospect.techStack?.join(', ') || 'modern technologies'
      });

      const email = await generateEmail({ prospect, template: templateText });
      const result = {
        prospectId: prospect.id,
        to: prospect.email,
        subject: email.subject,
        body: email.body,
        generatedAt: new Date().toISOString(),
        sent: false
      };

      generated.push(result);
      logger.info('Email generated', { prospectId: prospect.id, subject: email.subject });
    } catch (err) {
      logger.error('Email generation failed', { prospectId: prospect.id, error: err.message });
    }
  }

  const date = new Date().toISOString().split('T')[0];
  const outputPath = resolve(EMAILS_DIR, `emails-${date}.json`);
  writeFileSync(outputPath, JSON.stringify(generated, null, 2));
  logger.info(`Generated ${generated.length} emails, saved to ${outputPath}`);

  return generated;
}

export { generateEmails, loadTemplate };
