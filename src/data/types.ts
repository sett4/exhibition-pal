export interface Exhibition {
  id: string;
  name: string;
  venue: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO yyyy-mm-dd
  summary: string;
  story: string;
  highlights: string;
  detailUrl: string;
  overviewUrl: string;
  artworkListDriveUrl: string | null;
  relatedUrls: string[];
  standfmUrl: string | null;
  noteUrl: string | null;
  imageUrl: string | null;
}

export interface ExhibitionsData {
  exhibitions: Exhibition[];
  latestUpdate: string; // ISO timestamp representing source retrieval time
  createdAt: string; // ISO timestamp representing build time
}

export interface SheetFetchResult {
  header: string[];
  rows: string[][];
}
