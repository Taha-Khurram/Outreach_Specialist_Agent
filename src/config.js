import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(__dirname, '../.env') });

const defaultConfig = JSON.parse(
  readFileSync(resolve(__dirname, '../config/default.json'), 'utf-8')
);

export default {
  apollo: {
    apiKey: process.env.APOLLO_API_KEY,
    ...defaultConfig.apollo
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    sheetId: process.env.GOOGLE_SHEET_ID
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    ...defaultConfig.ai
  },
  email: {
    senderEmail: process.env.SENDER_EMAIL,
    senderName: process.env.SENDER_NAME,
    ...defaultConfig.email
  },
  meeting: {
    calendlyLink: process.env.CALENDLY_LINK,
    duration: parseInt(process.env.MEETING_DURATION_MINUTES || '15', 10)
  },
  schedule: defaultConfig.schedule,
  crm: defaultConfig.crm,
  agent: {
    batchSize: parseInt(process.env.PROSPECT_BATCH_SIZE || '50', 10),
    confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.8')
  }
};
