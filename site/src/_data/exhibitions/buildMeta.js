export default function buildMeta({ spreadsheetId, fetchedAt = new Date().toISOString(), warnings = [], artworkSortKey, artworkSpreadsheetId }) {
  const base = {
    fetchedAt,
    sourceSpreadsheet: spreadsheetId,
    warnings: [...warnings].sort((a, b) => {
      if (a.id === b.id) {
        return a.type.localeCompare(b.type);
      }
      return String(a.id ?? '').localeCompare(String(b.id ?? ''));
    })
  };

  if (artworkSortKey) {
    base.artworkSortKey = artworkSortKey;
  }
  if (artworkSpreadsheetId) {
    base.artworkSpreadsheetId = artworkSpreadsheetId;
  }

  return base;
}
