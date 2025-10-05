import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import EleventyFetch from '@11ty/eleventy-fetch';
import { createOAuthClient, getAccessToken } from '../google/oauthClient.js';

const REQUIRED_SHEET_ENV = ['GOOGLE_SHEETS_SPREADSHEET_ID', 'GOOGLE_SHEETS_RANGE'];

function ensureSheetEnv() {
  for (const key of REQUIRED_SHEET_ENV) {
    if (!process.env[key] || process.env[key]?.trim() === '') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

async function fetchFromFixture(fixturePath) {
  const absolutePath = resolve(process.cwd(), fixturePath);
  const fileContent = await readFile(absolutePath, 'utf8');
  return JSON.parse(fileContent);
}

export default async function fetchSheet() {
  if (process.env.TEST_EXHIBITIONS_FIXTURE) {
    return fetchFromFixture(process.env.TEST_EXHIBITIONS_FIXTURE);
  }

  ensureSheetEnv();
  const oauthClient = createOAuthClient();
  const accessToken = await getAccessToken(oauthClient);
  const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const range = encodeURIComponent(process.env.GOOGLE_SHEETS_RANGE);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;

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
