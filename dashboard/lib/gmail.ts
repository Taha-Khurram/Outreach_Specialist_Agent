import { google } from 'googleapis';

interface GmailAuth {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

interface SendEmailParams extends GmailAuth {
  to: string;
  subject: string;
  body: string;
  senderEmail: string;
  senderName: string;
}

interface ReplyToThreadParams extends GmailAuth {
  threadId: string;
  to: string;
  subject: string;
  body: string;
  senderEmail: string;
  senderName: string;
}

export interface ParsedMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
}

function createOAuth2Client(clientId: string, clientSecret: string, refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'https://developers.google.com/oauthplayground');
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

function buildRawEmail(from: string, to: string, subject: string, body: string, threadId?: string): string {
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
  ];
  if (threadId) {
    lines.push(`In-Reply-To: ${threadId}`);
    lines.push(`References: ${threadId}`);
  }
  lines.push('', body);
  return Buffer.from(lines.join('\r\n')).toString('base64url');
}

export async function sendEmail({ to, subject, body, senderEmail, senderName, clientId, clientSecret, refreshToken }: SendEmailParams) {
  const auth = createOAuth2Client(clientId, clientSecret, refreshToken);
  const gmail = google.gmail({ version: 'v1', auth });

  const from = senderName ? `${senderName} <${senderEmail}>` : senderEmail;
  const raw = buildRawEmail(from, to, subject, body);

  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  return {
    messageId: result.data.id,
    threadId: result.data.threadId,
  };
}

export async function getUnreadReplies({ clientId, clientSecret, refreshToken }: GmailAuth, afterTimestamp?: number): Promise<ParsedMessage[]> {
  const auth = createOAuth2Client(clientId, clientSecret, refreshToken);
  const gmail = google.gmail({ version: 'v1', auth });

  let query = 'is:unread label:inbox';
  if (afterTimestamp) {
    query += ` after:${Math.floor(afterTimestamp / 1000)}`;
  }

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 50,
  });

  const messages = listRes.data.messages || [];
  const parsed: ParsedMessage[] = [];

  for (const msg of messages) {
    const full = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id!,
      format: 'full',
    });

    const headers = full.data.payload?.headers || [];
    const getHeader = (name: string) => headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

    let body = '';
    const payload = full.data.payload;
    if (payload?.body?.data) {
      body = Buffer.from(payload.body.data, 'base64url').toString('utf-8');
    } else if (payload?.parts) {
      const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64url').toString('utf-8');
      }
    }

    parsed.push({
      id: full.data.id || '',
      threadId: full.data.threadId || '',
      from: getHeader('From'),
      to: getHeader('To'),
      subject: getHeader('Subject'),
      body,
      date: getHeader('Date'),
    });
  }

  return parsed;
}

export async function markAsRead({ clientId, clientSecret, refreshToken }: GmailAuth, messageId: string) {
  const auth = createOAuth2Client(clientId, clientSecret, refreshToken);
  const gmail = google.gmail({ version: 'v1', auth });

  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: { removeLabelIds: ['UNREAD'] },
  });
}

export async function replyToThread({ threadId, to, subject, body, senderEmail, senderName, clientId, clientSecret, refreshToken }: ReplyToThreadParams) {
  const auth = createOAuth2Client(clientId, clientSecret, refreshToken);
  const gmail = google.gmail({ version: 'v1', auth });

  const from = senderName ? `${senderName} <${senderEmail}>` : senderEmail;
  const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
  const raw = buildRawEmail(from, to, replySubject, body, threadId);

  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw, threadId },
  });

  return {
    messageId: result.data.id,
    threadId: result.data.threadId,
  };
}

export async function checkBounces({ clientId, clientSecret, refreshToken }: GmailAuth, afterTimestamp?: number): Promise<{ email: string; reason: string }[]> {
  const auth = createOAuth2Client(clientId, clientSecret, refreshToken);
  const gmail = google.gmail({ version: 'v1', auth });

  let query = 'from:mailer-daemon@google.com OR from:postmaster';
  if (afterTimestamp) {
    query += ` after:${Math.floor(afterTimestamp / 1000)}`;
  }

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 20,
  });

  const messages = listRes.data.messages || [];
  const bounces: { email: string; reason: string }[] = [];

  for (const msg of messages) {
    const full = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id!,
      format: 'full',
    });

    let body = '';
    const payload = full.data.payload;
    if (payload?.body?.data) {
      body = Buffer.from(payload.body.data, 'base64url').toString('utf-8');
    } else if (payload?.parts) {
      const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64url').toString('utf-8');
      }
    }

    const emailMatch = body.match(/(?:was not delivered to|could not be delivered to|rejected by)\s+([^\s<]+@[^\s>]+)/i)
      || body.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

    if (emailMatch) {
      const reason = body.includes('does not exist') ? 'invalid_address'
        : body.includes('quota') ? 'mailbox_full'
        : body.includes('blocked') ? 'blocked'
        : 'unknown';
      bounces.push({ email: emailMatch[1].toLowerCase(), reason });
    }
  }

  return bounces;
}
