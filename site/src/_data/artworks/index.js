import fetchSheet from './fetchSheet.js';
import { normalizeSheet } from './normalizeRecord.js';

export async function loadArtworks(options = {}) {
  const sheetResponse = await fetchSheet();
  return normalizeSheet(sheetResponse, options);
}

export { fetchSheet, normalizeSheet };
