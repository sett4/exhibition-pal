import 'dotenv/config';
import { google } from 'googleapis';

const REQUIRED_ENV = [
  'GOOGLE_SHEETS_CLIENT_ID',
  'GOOGLE_SHEETS_CLIENT_SECRET',
  'GOOGLE_SHEETS_REFRESH_TOKEN'
];

export function ensureGoogleOAuthEnv(env = process.env) {
  for (const key of REQUIRED_ENV) {
    const value = env[key];
    if (!value || value.trim() === '') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

export function createOAuthClient(env = process.env) {
  ensureGoogleOAuthEnv(env);
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_SHEETS_CLIENT_ID,
    env.GOOGLE_SHEETS_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: env.GOOGLE_SHEETS_REFRESH_TOKEN });
  return oauth2Client;
}

export async function getAccessToken(existingClient) {
  const client = existingClient ?? createOAuthClient();
  const { token } = await client.getAccessToken();
  if (!token) {
    throw new Error('Failed to obtain Google API access token');
  }
  return token;
}
