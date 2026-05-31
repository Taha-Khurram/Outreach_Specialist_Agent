import { google } from 'googleapis';
import config from '../config.js';
import logger from '../utils/logger.js';
import { getAuth } from './gmail.js';

const sheets = google.sheets({ version: 'v4', auth: getAuth() });
const { sheetId } = config.google;
const { sheetTabs } = config.crm;

async function appendProspect(prospect) {
  const values = [[
    new Date().toISOString(),
    prospect.id,
    prospect.name,
    prospect.email,
    prospect.title,
    prospect.company,
    prospect.industry,
    prospect.techStack?.join(', ') || '',
    prospect.funding,
    prospect.status
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${sheetTabs.prospects}!A:J`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  });

  logger.info('Prospect logged to sheet', { prospectId: prospect.id });
}

async function logInteraction({ prospectId, type, subject, status, notes }) {
  const values = [[
    new Date().toISOString(),
    prospectId,
    type,
    subject,
    status,
    notes || ''
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${sheetTabs.interactions}!A:F`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  });
}

async function updateProspectStatus(prospectId, newStatus) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetTabs.prospects}!A:J`
  });

  const rows = response.data.values || [];
  let rowIndex = -1;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === prospectId) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    logger.warn('Prospect not found in sheet', { prospectId });
    return false;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetTabs.prospects}!J${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[newStatus]] }
  });

  logger.info('Status updated', { prospectId, newStatus });
  return true;
}

async function getDashboardStats() {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetTabs.prospects}!A:J`
  });

  const rows = response.data.values || [];
  const stats = { sent: 0, replies: 0, meetings: 0, closed: 0, total: 0 };

  for (let i = 1; i < rows.length; i++) {
    const status = rows[i][9];
    stats.total++;
    if (status === 'contacted') stats.sent++;
    if (status === 'replied') stats.replies++;
    if (status === 'meeting') stats.meetings++;
    if (status === 'closed') stats.closed++;
  }

  return stats;
}

async function updateDashboard(stats) {
  const values = [[
    new Date().toISOString(),
    stats.total,
    stats.sent,
    stats.replies,
    stats.meetings,
    stats.closed,
    stats.total > 0 ? `${((stats.replies / stats.sent) * 100).toFixed(1)}%` : '0%',
    '$0'
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${sheetTabs.dashboard}!A:H`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  });
}

export { appendProspect, logInteraction, updateProspectStatus, getDashboardStats, updateDashboard };
