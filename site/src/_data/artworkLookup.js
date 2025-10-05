import fetchExhibitionsSheet from './exhibitions/fetchSheet.js';
import { normalizeSheet as normalizeExhibitions } from './exhibitions/normalizeRecord.js';
import { loadArtworks } from './artworks/index.js';

function logWarnings(warnings = [], scope = 'artworks-sync') {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  warnings.forEach((warning) => {
    console.warn(
      JSON.stringify({
        level: 'WARN',
        scope,
        ...warning
      })
    );
  });
}

async function generateLookup() {
  const syncedAt = new Date().toISOString();
  const [exhibitionSheet, artworksData] = await Promise.all([
    fetchExhibitionsSheet(),
    loadArtworks({ syncedAt })
  ]);

  const normalization = await normalizeExhibitions(exhibitionSheet, { artworks: artworksData.records });

  logWarnings(artworksData.warnings, 'artworks-sync');
  logWarnings(normalization.warnings, 'exhibitions-sync');

  const lookup = {};
  normalization.records.forEach((record) => {
    (record.artworkList ?? []).forEach((artwork) => {
      lookup[artwork.artworkId] = {
        exhibitionId: record.id,
        artwork
      };
    });
  });

  return lookup;
}

let cachedLookupPromise;

export default function artworkLookup() {
  if (!cachedLookupPromise) {
    cachedLookupPromise = generateLookup();
  }
  return cachedLookupPromise;
}

export function resetArtworkLookupCache() {
  cachedLookupPromise = undefined;
}
