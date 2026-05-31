import { google } from 'googleapis';
import config from '../config.js';
import logger from '../utils/logger.js';
import { gmailLimiter } from '../utils/rate-limiter.js';

const { clientId, clientSecret, redirectUri, refreshToken } = config.google;

function getAuth() {
  const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  auth.setCredentials({ refresh_token: refreshToken });
  return auth;
}

const gmail = google.gmail({ version: 'v1', auth: getAuth() });

async function sendEmail({ to, subject, body, prospectId, taskId }) {
  return gmailLimiter.execute(async () => {
    const headers = [
      `To: ${to}`,
      `From: ${config.email.senderName} <${config.email.senderEmail}>`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      `X-Task-ID: ${taskId || Date.now()}`,
      `X-Prospect-ID: ${prospectId || 'unknown'}`
    ].join('\r\n');

    const fullBody = body + config.email.unsubscribeText;
    const message = `${headers}\r\n\r\n${fullBody}`;
    const encodedMessage = Buffer.from(message).toString('base64url');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage }
    });

    logger.info('Email sent', { to, messageId: response.data.id, prospectId });
    return response.data;
  });
}

async function getUnreadReplies(afterTimestamp) {
  const query = afterTimestamp
    ? `is:unread after:${Math.floor(afterTimestamp / 1000)}`
    : 'is:unread label:inbox';

  const response = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 50
  });

  if (!response.data.messages) return [];

  const messages = [];
  for (const msg of response.data.messages) {
    const full = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'full'
    });
    messages.push(parseMessage(full.data));
  }

  return messages;
}

function parseMessage(message) {
  const headers = message.payload?.headers || [];
  const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  let body = '';
  if (message.payload?.body?.data) {
    body = Buffer.from(message.payload.body.data, 'base64url').toString('utf-8');
  } else if (message.payload?.parts) {
    const textPart = message.payload.parts.find(p => p.mimeType === 'text/plain');
    if (textPart?.body?.data) {
      body = Buffer.from(textPart.body.data, 'base64url').toString('utf-8');
    }
  }

  return {
    id: message.id,
    threadId: message.threadId,
    from: getHeader('From'),
    to: getHeader('To'),
    subject: getHeader('Subject'),
    date: getHeader('Date'),
    body,
    prospectId: getHeader('X-Prospect-ID'),
    taskId: getHeader('X-Task-ID')
  };
}

async function markAsRead(messageId) {
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: { removeLabelIds: ['UNREAD'] }
  });
}

async function replyToThread({ threadId, to, subject, body }) {
  return gmailLimiter.execute(async () => {
    const headers = [
      `To: ${to}`,
      `From: ${config.email.senderName} <${config.email.senderEmail}>`,
      `Subject: Re: ${subject}`,
      `In-Reply-To: ${threadId}`,
      'Content-Type: text/plain; charset=utf-8'
    ].join('\r\n');

    const message = `${headers}\r\n\r\n${body}`;
    const encodedMessage = Buffer.from(message).toString('base64url');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage, threadId }
    });

    logger.info('Reply sent', { to, threadId });
    return response.data;
  });
}

export { sendEmail, getUnreadReplies, markAsRead, replyToThread, getAuth };
