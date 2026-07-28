import type { BookSearchResult } from "../types";

interface GoogleIndustryIdentifier {
  type?: string;
  identifier?: string;
}

interface GoogleVolume {
  id?: string;
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: GoogleIndustryIdentifier[];
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    language?: string;
  };
}

interface GoogleVolumeResponse {
  items?: GoogleVolume[];
}

const GOOGLE_BOOKS_ENDPOINT = "https://www.googleapis.com/books/v1/volumes";

export function buildGoogleBooksQuery(query: string): string {
  const compact = query.replace(/[-\s]/g, "");
  if (/^(?:\d{9}[\dXx]|\d{13})$/.test(compact)) {
    return `isbn:${compact.toUpperCase()}`;
  }
  return query.trim();
}

function cleanDescription(value = ""): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function normalizeCover(value = ""): string {
  return value.replace(/^http:\/\//, "https://").replace("&edge=curl", "");
}

function identifier(
  identifiers: GoogleIndustryIdentifier[] | undefined,
  type: "ISBN_10" | "ISBN_13",
): string {
  return (
    identifiers?.find((candidate) => candidate.type === type)?.identifier ?? ""
  );
}

export function normalizeGoogleVolume(
  volume: GoogleVolume,
): BookSearchResult | null {
  const info = volume.volumeInfo;
  if (!volume.id || !info?.title || !info.authors?.length) return null;

  return {
    source: "google_books",
    sourceId: volume.id,
    title: info.title.trim(),
    subtitle: info.subtitle?.trim() ?? "",
    authors: info.authors.map((author) => author.trim()).filter(Boolean),
    publisher: info.publisher?.trim() ?? "",
    publishedDate: info.publishedDate?.trim() ?? "",
    pageCount:
      typeof info.pageCount === "number" && info.pageCount > 0
        ? info.pageCount
        : null,
    language: info.language?.trim() ?? "",
    description: cleanDescription(info.description),
    categories: [...new Set(info.categories?.map((item) => item.trim()) ?? [])],
    isbn10: identifier(info.industryIdentifiers, "ISBN_10"),
    isbn13: identifier(info.industryIdentifiers, "ISBN_13"),
    coverUrl: normalizeCover(
      info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail,
    ),
  };
}

export async function searchGoogleBooks(
  query: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<BookSearchResult[]> {
  if (!apiKey) {
    throw new Error(
      "A busca automática precisa da variável VITE_GOOGLE_BOOKS_API_KEY.",
    );
  }

  const url = new URL(GOOGLE_BOOKS_ENDPOINT);
  url.searchParams.set("q", buildGoogleBooksQuery(query));
  url.searchParams.set("printType", "books");
  url.searchParams.set("maxResults", "12");
  url.searchParams.set("projection", "full");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, { signal });
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(
        "O catálogo atingiu o limite temporário. Tente novamente em instantes.",
      );
    }
    throw new Error("Não foi possível consultar o catálogo agora.");
  }

  const payload = (await response.json()) as GoogleVolumeResponse;
  return (payload.items ?? [])
    .map(normalizeGoogleVolume)
    .filter((book): book is BookSearchResult => book !== null);
}
