import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import EleventyFetch from '@11ty/eleventy-fetch';
import { google } from 'googleapis';

const REQUIRED_ENV = [
  'GOOGLE_SHEETS_CLIENT_ID',
  'GOOGLE_SHEETS_CLIENT_SECRET',
  'GOOGLE_SHEETS_REFRESH_TOKEN',
  'GOOGLE_SHEETS_ARTWORK_SPREADSHEET_ID',
  'GOOGLE_SHEETS_ARTWORK_RANGE'
];

function ensureEnv() {
  for (const key of REQUIRED_ENV) {
    if (!process.env[key] || process.env[key]?.trim() === '') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

async function getAccessToken() {
  ensureEnv();
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_SHEETS_CLIENT_ID,
    process.env.GOOGLE_SHEETS_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_SHEETS_REFRESH_TOKEN });
  const { token } = await oauth2Client.getAccessToken();
  if (!token) {
    throw new Error('Failed to obtain Google Sheets access token for artworks');
  }
  return token;
}

async function fetchFromFixture(fixturePath) {
  const absolutePath = resolve(process.cwd(), fixturePath);
  const fileContent = await readFile(absolutePath, 'utf8');
  return JSON.parse(fileContent);
}

export default async function fetchSheet() {
  if (process.env.TEST_ARTWORKS_FIXTURE) {
    return fetchFromFixture(process.env.TEST_ARTWORKS_FIXTURE);
  }

  const accessToken = await getAccessToken();
  const sheetId = process.env.GOOGLE_SHEETS_ARTWORK_SPREADSHEET_ID;
  const range = encodeURIComponent(process.env.GOOGLE_SHEETS_ARTWORK_RANGE);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?fields=range,majorDimension,values&quotaUser=exhibition-pal-artworks`;

  return EleventyFetch(url, {
    duration: '1h',
    type: 'json',
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });
}
