import { config as loadEnvFromFile } from 'dotenv';

export interface GoogleSheetsConfig {
  refreshToken: string;
  spreadsheetId: string;
  range: string;
  clientId?: string;
  clientSecret?: string;
  tokenUrl: string;
}

let cachedConfig: GoogleSheetsConfig | null = null;

const DEFAULT_RANGE = 'Exhibitions!A:O';
const DEFAULT_TOKEN_URL = 'https://oauth2.googleapis.com/token';

/**
 * Reads a required environment variable and returns the trimmed value.
 * @param name Name of the variable to resolve.
 * @throws {Error} When the variable is missing or blank.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

/**
 * Loads and memoises Google Sheets configuration from environment variables.
 * dotenv is initialised on the first call to harmonise local and CI environments.
 */
export function loadGoogleSheetsConfig(): GoogleSheetsConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  loadEnvFromFile();

  const refreshToken = requireEnv('GOOGLE_SHEETS_REFRESH_TOKEN');
  const spreadsheetId = requireEnv('GOOGLE_SHEETS_SPREADSHEET_ID');
  const range = process.env.GOOGLE_SHEETS_RANGE?.trim() || DEFAULT_RANGE;
  const clientId = process.env.GOOGLE_SHEETS_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_SHEETS_CLIENT_SECRET?.trim();
  const tokenUrl = process.env.GOOGLE_SHEETS_TOKEN_URL?.trim() || DEFAULT_TOKEN_URL;

  cachedConfig = {
    refreshToken,
    spreadsheetId,
    range,
    clientId: clientId || undefined,
    clientSecret: clientSecret || undefined,
    tokenUrl,
  };

  return cachedConfig;
}
