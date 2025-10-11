import { getLogger } from "../../lib/logger.js";
import {
  createArtworkViewModel,
  type ArtworkSource,
  type ArtworkViewModel,
} from "../entities/artwork.js";

const logger = getLogger();

export const EXPECTED_ARTWORK_HEADERS = [
  "入力日",
  "展示会ID",
  "作品ID",
  "展覧会名",
  "展示ID",
  "アーティスト名",
  "作品名",
  "作品詳細",
  "その他",
  "作品紹介（Google Drive URL）",
  "参照URL",
  "音声化（stand fm url）",
  "記事化（Note url）",
  "image",
] as const;

const COLUMN_INDEX = {
  inputDate: 0,
  exhibitionId: 1,
  artworkId: 2,
  exhibitionName: 3,
  displayId: 4,
  artistName: 5,
  artworkName: 6,
  artworkDetail: 7,
  other: 8,
  artworkDriveUrl: 9,
  referenceUrl: 10,
  standfmUrl: 11,
  noteUrl: 12,
  image: 13,
} as const;

type ColumnKey = keyof typeof COLUMN_INDEX;

export interface BuildArtworksDataOptions {
  knownExhibitionIds?: Set<string>;
}

export interface BuildArtworksDataResult {
  artworks: ArtworkViewModel[];
  artworksByExhibitionId: Record<string, ArtworkViewModel[]>;
}

/**
 * 指定された列キーに対応するセル値を取得し、前後の空白を取り除いた文字列を返す。
 *
 * @param row 現在処理中の行データ。
 * @param key 取得したい列を表すキー。
 * @returns 列の文字列値。値が未定義の場合は空文字。
 */
function getCell(row: string[], key: ColumnKey): string {
  const value = row[COLUMN_INDEX[key]];
  return String(value ?? "").trim();
}

/**
 * 空文字列を null に変換し、それ以外はそのまま返す。
 *
 * @param value 判定対象の文字列。
 * @returns 空文字列の場合は null、それ以外は同じ文字列。
 */
function toNullableString(value: string): string | null {
  return value.length === 0 ? null : value;
}

/**
 * スプレッドシートのヘッダー行が想定通りか検証する。
 *
 * @param header 取得したヘッダー行。
 * @throws ヘッダーの列数または列名が想定と異なる場合。
 */
export function ensureArtworkHeaderMatches(header: string[]): void {
  if (header.length !== EXPECTED_ARTWORK_HEADERS.length) {
    throw new Error(
      `Unexpected header length for artwork sheet. Expected ${EXPECTED_ARTWORK_HEADERS.length} columns but received ${header.length}`
    );
  }

  EXPECTED_ARTWORK_HEADERS.forEach((expected, index) => {
    if (header[index] !== expected) {
      throw new Error(
        `Unexpected column at index ${index}: expected "${expected}" but received "${header[index]}"`
      );
    }
  });
}

/**
 * スプレッドシートの行データをアートワークのソースモデルへ変換する。
 *
 * @param row 1 行分のセル値。
 * @returns 必須列がそろっていれば `ArtworkSource`、不足している場合は null。
 */
export function mapRowToArtworkSource(row: string[]): ArtworkSource | null {
  const artworkId = toNullableString(getCell(row, "artworkId"));
  const exhibitionId = toNullableString(getCell(row, "exhibitionId"));
  const displayId = toNullableString(getCell(row, "displayId"));
  const artistName = toNullableString(getCell(row, "artistName"));
  const artworkName = toNullableString(getCell(row, "artworkName"));

  if (!artworkId || !exhibitionId || !artworkName || !artistName) {
    logger.warn("Skipping artwork row with missing required fields", {
      artworkId,
      exhibitionId,
      displayId,
      artistName,
      artworkName,
    });
    return null;
  }

  return {
    artworkId,
    exhibitionId,
    displayId,
    artistName,
    artworkName,
    artworkDetail: toNullableString(getCell(row, "artworkDetail")),
    standfmUrl: toNullableString(getCell(row, "standfmUrl")),
    noteUrl: toNullableString(getCell(row, "noteUrl")),
  };
}

/**
 * 展示会 ID ごとにアートワークをグループ化し、既知の展示会 ID が指定されている場合は空配列を保証する。
 *
 * @param artworks 変換済みアートワーク一覧。
 * @param knownExhibitionIds 既知の展示会 ID セット。指定されている場合、存在しない ID でもキーを追加する。
 * @returns 展示会 ID をキーにしたアートワークの連想配列。
 */
export function groupArtworksByExhibitionId(
  artworks: ArtworkViewModel[],
  knownExhibitionIds?: Set<string>
): Record<string, ArtworkViewModel[]> {
  const grouped: Record<string, ArtworkViewModel[]> = {};

  for (const artwork of artworks) {
    if (!grouped[artwork.exhibitionId]) {
      grouped[artwork.exhibitionId] = [];
    }
    grouped[artwork.exhibitionId].push(artwork);
  }

  for (const exhibitionId of Object.keys(grouped)) {
    grouped[exhibitionId].sort((a, b) => a.artworkId.localeCompare(b.artworkId));
  }

  if (knownExhibitionIds) {
    for (const id of knownExhibitionIds) {
      if (!grouped[id]) {
        grouped[id] = [];
      }
    }
  }

  return grouped;
}

/**
 * シートデータを検証・変換し、作品一覧と展示会 ID ごとのグループを作成する。
 *
 * @param header スプレッドシートのヘッダー行。
 * @param rows 作品データの行配列。
 * @param options 既知の展示会 ID など、変換時の追加オプション。
 * @returns 変換済みアートワーク配列と、展示会 ID ごとのグループ化結果。
 */
export function buildArtworksData(
  header: string[],
  rows: string[][],
  options: BuildArtworksDataOptions = {}
): BuildArtworksDataResult {
  ensureArtworkHeaderMatches(header);

  const artworks: ArtworkViewModel[] = [];

  rows.forEach((row, index) => {
    try {
      const source = mapRowToArtworkSource(row);
      if (!source) {
        return;
      }
      const viewModel = createArtworkViewModel(source);
      artworks.push(viewModel);
    } catch (error) {
      logger.error("Failed to transform artwork row", {
        error,
        rowNumber: index + 2,
      });
      throw error;
    }
  });

  if (options.knownExhibitionIds) {
    for (const artwork of artworks) {
      if (!options.knownExhibitionIds.has(artwork.exhibitionId)) {
        logger.error("Artwork references non-existent exhibition", {
          exhibitionId: artwork.exhibitionId,
          artworkId: artwork.artworkId,
        });
        throw new Error(
          `Artwork ${artwork.artworkId} references unknown exhibition ${artwork.exhibitionId}`
        );
      }
    }
  }

  const artworksByExhibitionId = groupArtworksByExhibitionId(artworks, options.knownExhibitionIds);

  return {
    artworks,
    artworksByExhibitionId,
  };
}
