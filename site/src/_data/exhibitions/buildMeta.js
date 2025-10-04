export default function buildMeta({ spreadsheetId, fetchedAt = new Date().toISOString(), warnings = [] }) {
  return {
    fetchedAt,
    sourceSpreadsheet: spreadsheetId,
    warnings: [...warnings].sort((a, b) => {
      if (a.id === b.id) {
        return a.type.localeCompare(b.type);
      }
      return String(a.id).localeCompare(String(b.id));
    })
  };
}
