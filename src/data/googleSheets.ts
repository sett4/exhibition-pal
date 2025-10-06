import { auth, sheets_v4 } from '@googleapis/sheets';
import type { OAuth2Client } from 'google-auth-library';
import type { SheetFetchResult } from './types.js';
import { loadGoogleSheetsConfig } from '../config/env.js';
import { getLogger } from '../lib/logger.js';

const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 500;

let cachedOAuthClient: OAuth2Client | null = null;
let cachedSheets: sheets_v4.Sheets | null = null;

/**
 * Creates or returns a memoised OAuth2 client for Google Sheets access.
 * @returns Authenticated OAuth2 client instance.
 */
function createOAuthClient(): OAuth2Client {
  if (cachedOAuthClient) {
    return cachedOAuthClient;
  }

  const config = loadGoogleSheetsConfig();
  const client = new auth.OAuth2(config.clientId, config.clientSecret, undefined);
  client.setCredentials({ refresh_token: config.refreshToken });
  cachedOAuthClient = client;
  return client;
}

/**
 * Creates or retrieves a memoised Sheets API client.
 * @returns Sheets API client bound to the shared OAuth client.
 */
function getSheetsClient(): sheets_v4.Sheets {
  if (!cachedSheets) {
    cachedSheets = new sheets_v4.Sheets({ auth: createOAuthClient() });
  }

  return cachedSheets;
}

/**
 * Awaitable helper for exponential backoff delays.
 * @param ms Milliseconds to wait.
 */
async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches raw sheet values with exponential backoff to tolerate transient failures.
 */
export async function fetchSheetValues(attempt = 1): Promise<SheetFetchResult> {
  const sheets = getSheetsClient();
  const config = loadGoogleSheetsConfig();
  const logger = getLogger();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: config.range,
    });

    const values = response.data.values ?? [];
    if (values.length === 0) {
      throw new Error('Google Sheets returned no data for configured range');
    }

    const [header, ...rows] = values;
    return {
      header: header.map((cell) => String(cell ?? '').trim()),
      rows: rows.map((row) => row.map((cell) => String(cell ?? '').trim())),
    };
  } catch (error) {
    if (attempt >= MAX_ATTEMPTS) {
      logger.error('Failed to fetch Google Sheets values', { err: error, attempt });
      throw error;
    }

    const backoff = BACKOFF_BASE_MS * 2 ** (attempt - 1);
    logger.warn('Retrying Google Sheets fetch after transient error', { attempt, backoff });
    await delay(backoff);
    return fetchSheetValues(attempt + 1);
  }
}
