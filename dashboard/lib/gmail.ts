import { google } from 'googleapis';

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  senderEmail: string;
  senderName: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

function createOAuth2Client(clientId: string, clientSecret: string, refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'https://developers.google.com/oauthplayground');
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

function buildRawEmail(from: string, to: string, subject: string, body: string): string {
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    body,
  ];
  const raw = lines.join('\r\n');
  return Buffer.from(raw).toString('base64url');
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
