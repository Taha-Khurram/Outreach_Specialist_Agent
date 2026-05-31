#!/usr/bin/env node
/**
 * Setup script: generates Google OAuth2 refresh token.
 * Run once: node scripts/setup.js
 */
import { google } from 'googleapis';
import { createServer } from 'http';
import { URL } from 'url';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/spreadsheets'
];

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth/callback';

  if (!clientId || !clientSecret) {
    console.error('Error: Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file first.');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });

  console.log('\n=== Google OAuth2 Setup ===\n');
  console.log('1. Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n2. Authorize the app and wait for redirect...\n');

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:3000`);
    if (url.pathname === '/oauth/callback') {
      const code = url.searchParams.get('code');
      if (code) {
        try {
          const { tokens } = await oauth2Client.getToken(code);
          console.log('\nSuccess! Add this to your .env file:\n');
          console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);

          // Auto-update .env if possible
          const envPath = resolve(__dirname, '../.env');
          if (existsSync(envPath)) {
            let envContent = readFileSync(envPath, 'utf-8');
            envContent = envContent.replace(
              /GOOGLE_REFRESH_TOKEN=.*/,
              `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`
            );
            writeFileSync(envPath, envContent);
            console.log('.env file updated automatically!');
          }

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Setup Complete!</h1><p>You can close this window.</p>');
        } catch (err) {
          console.error('Token exchange failed:', err.message);
          res.writeHead(500);
          res.end('Token exchange failed');
        }
      }
      setTimeout(() => process.exit(0), 1000);
    }
  });

  server.listen(3000, () => {
    console.log('Waiting for OAuth callback on http://localhost:3000 ...');
  });
}

main();
