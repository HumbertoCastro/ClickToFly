import type { BookCatalogConfig } from "./config.ts";
import { isbnPair } from "./isbn.ts";
import {
  canonicalEditionKey,
  canonicalWorkKey,
  coverUrlFromId,
  descriptionText,
  editionLanguage,
  languageCode,
  normalizedFormat,
  object,
  text,
  texts,
} from "./sanitize.ts";
import type {
  CatalogEdition,
  CatalogSort,
  CatalogWorkDetail,
  SearchCatalogRequest,
  WorkCandidate,
} from "./types.ts";

type Fetcher = typeof fetch;

export interface OpenLibraryRequestGateLike {
  wait(): Promise<void>;
}

type Clock = () => number;
type Sleeper = (milliseconds: number) => Promise<void>;

const IDENTIFIED_REQUEST_INTERVAL_MS = 334;

export class OpenLibraryRequestGate implements OpenLibraryRequestGateLike {
  private nextStartAt = 0;
  private tail: Promise<void> = Promise.resolve();

  constructor(
    private readonly minimumIntervalMs = IDENTIFIED_REQUEST_INTERVAL_MS,
    private readonly now: Clock = () => Date.now(),
    private readonly sleep: Sleeper = (milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds)),
  ) {}

  wait(): Promise<void> {
    const turn = this.tail.then(async () => {
      const delay = Math.max(0, this.nextStartAt - this.now());
      if (delay > 0) await this.sleep(delay);
      this.nextStartAt = Math.max(this.nextStartAt, this.now()) +
        this.minimumIntervalMs;
    });
    this.tail = turn.catch(() => undefined);
    return turn;
  }
}

const globalOpenLibraryRequestGate = new OpenLibraryRequestGate();

export class OpenLibraryError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "OpenLibraryError";
  }

  get temporary(): boolean {
    return this.status === 0 || this.status === 408 || this.status === 429 ||
      this.status >= 500;
  }
}

interface SearchDocumentResult {
  work: WorkCandidate;
  edition?: CatalogEdition;
}

export interface OpenLibrarySearchResult {
  works: WorkCandidate[];
  representativeEditions: Map<string, CatalogEdition>;
  total: number;
}

function numberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const candidate = Number(value);
  return Number.isFinite(candidate) ? candidate : null;
}

function integerValue(
  value: unknown,
  minimum: number,
  maximum: number,
): number | null {
  const candidate = numberValue(value);
  return candidate !== null &&
      Number.isSafeInteger(candidate) &&
      candidate >= minimum &&
      candidate <= maximum
    ? candidate
    : null;
}

function publicationYear(value: unknown): number | null {
  return integerValue(value, 1000, 2200);
}

function pageCount(value: unknown): number | null {
  return integerValue(value, 1, Number.MAX_SAFE_INTEGER);
}

function first(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : undefined;
}

function nestedEdition(value: unknown): Record<string, unknown> | undefined {
  const editions = object(value);
  return object(first(editions?.docs));
}

function normalizeSearchEdition(
  value: Record<string, unknown> | undefined,
): CatalogEdition | undefined {
  if (!value) return undefined;
  const editionKey = canonicalEditionKey(value.key);
  if (!editionKey) return undefined;
  const isbn = isbnPair(value.isbn);
  return {
    editionKey,
    isbn10: isbn.isbn10,
    isbn13: isbn.isbn13,
    publisher: text(first(value.publisher), 300),
    publishedDate: text(first(value.publish_date), 100),
    language: editionLanguage(value.language),
    format: normalizedFormat(value.physical_format),
    pageCount: pageCount(
      value.number_of_pages ?? value.number_of_pages_median,
    ),
    coverUrl: coverUrlFromId(
      Array.isArray(value.cover_i) ? first(value.cover_i) : value.cover_i,
    ),
  };
}

export function normalizeSearchDocument(
  value: unknown,
): SearchDocumentResult | null {
  const document = object(value);
  if (!document) return null;
  const workKey = canonicalWorkKey(document.key);
  const title = text(document.title, 500);
  if (!workKey || !title) return null;

  const editionDocument = nestedEdition(document.editions);
  const edition = normalizeSearchEdition(editionDocument);
  const identifiers = [
    ...texts(document.isbn, 100, 30),
    ...texts(editionDocument?.isbn, 20, 30),
  ];
  const languages = texts(document.language, 30, 20)
    .map(languageCode)
    .filter(Boolean);
  const firstPublishedYear = publicationYear(document.first_publish_year);
  const editionCount = Math.max(
    0,
    integerValue(document.edition_count, 0, Number.MAX_SAFE_INTEGER) ?? 0,
  );

  return {
    work: {
      workKey,
      title,
      authors: texts(document.author_name, 20, 300),
      firstPublishedYear,
      description: "",
      subjects: texts(document.subject, 50, 300),
      languages: [...new Set(languages)],
      coverUrl: coverUrlFromId(document.cover_i) || edition?.coverUrl || "",
      editionCount,
      sourceWorkKeys: [workKey],
      identifiers,
    },
    ...(edition ? { edition } : {}),
  };
}

function normalizeEdition(value: unknown): CatalogEdition | null {
  const edition = object(value);
  if (!edition) return null;
  const editionKey = canonicalEditionKey(edition.key);
  if (!editionKey) return null;
  const isbn = isbnPair([
    ...texts(edition.isbn_10, 20, 30),
    ...texts(edition.isbn_13, 20, 30),
  ]);
  return {
    editionKey,
    isbn10: isbn.isbn10,
    isbn13: isbn.isbn13,
    publisher: text(first(edition.publishers), 300),
    publishedDate: text(
      edition.publish_date ?? edition.published_date,
      100,
    ),
    language: editionLanguage(edition.languages ?? edition.language),
    format: normalizedFormat(
      edition.physical_format ?? edition.physicalFormat,
    ),
    pageCount: pageCount(
      edition.number_of_pages ?? edition.number_of_pages_median,
    ),
    coverUrl: coverUrlFromId(first(edition.covers)),
  };
}

function escapedQualifier(value: string): string {
  return value.replace(/[\\"]/g, "\\$&");
}

const LANGUAGE_SEARCH_ALIASES: Record<string, string> = {
  pt: "por",
  en: "eng",
  es: "spa",
  fr: "fre",
  de: "ger",
  it: "ita",
};

function sortParameter(sort: CatalogSort | undefined): string | null {
  if (sort === "newest") return "new";
  if (sort === "oldest") return "old";
  return null;
}

export class OpenLibraryClient {
  constructor(
    private readonly config: BookCatalogConfig,
    private readonly fetcher: Fetcher = fetch,
    private readonly requestGate: OpenLibraryRequestGateLike =
      globalOpenLibraryRequestGate,
  ) {}

  private async requestJson(
    path: string,
    query: Record<string, string | number | undefined> = {},
  ): Promise<unknown> {
    const url = new URL(
      path,
      `${this.config.openLibraryBaseUrl.replace(/\/$/, "")}/`,
    );
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
    url.searchParams.set("email", this.config.openLibraryContactEmail);

    await this.requestGate.wait();
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.openLibraryTimeoutMs,
    );
    try {
      const response = await this.fetcher(url, {
        signal: controller.signal,
        headers: {
          accept: "application/json",
          "user-agent": this.config.openLibraryUserAgent,
          from: this.config.openLibraryContactEmail,
        },
      });
      if (!response.ok) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "");
        throw new OpenLibraryError(
          `Open Library respondeu ${response.status}.`,
          response.status,
          Number.isFinite(retryAfter) && retryAfter > 0
            ? Math.ceil(retryAfter)
            : undefined,
        );
      }
      try {
        return await response.json();
      } catch {
        throw new OpenLibraryError(
          "A Open Library retornou JSON inválido.",
          502,
        );
      }
    } catch (caught) {
      if (caught instanceof OpenLibraryError) throw caught;
      throw new OpenLibraryError(
        caught instanceof DOMException && caught.name === "AbortError"
          ? "A consulta à Open Library excedeu o tempo limite."
          : "Não foi possível acessar a Open Library.",
        caught instanceof DOMException && caught.name === "AbortError"
          ? 408
          : 0,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async search(
    request: SearchCatalogRequest,
  ): Promise<OpenLibrarySearchResult> {
    const qualifiers = [request.query];
    if (request.language) {
      const language =
        LANGUAGE_SEARCH_ALIASES[request.language] ?? request.language;
      qualifiers.push(`language:${escapedQualifier(language)}`);
    }
    if (request.subject) {
      qualifiers.push(`subject:"${escapedQualifier(request.subject)}"`);
    }

    const raw = object(await this.requestJson("/search.json", {
      q: qualifiers.join(" "),
      page: request.page,
      limit: 18,
      fields: [
        "key",
        "title",
        "author_name",
        "first_publish_year",
        "edition_count",
        "cover_i",
        "language",
        "subject",
        "isbn",
        "editions",
        "editions.key",
        "editions.isbn",
        "editions.publisher",
        "editions.publish_date",
        "editions.language",
        "editions.number_of_pages_median",
        "editions.cover_i",
        "editions.physical_format",
      ].join(","),
      sort: sortParameter(request.sort) ?? undefined,
      lang: request.language?.slice(0, 2),
    }));
    const documents = Array.isArray(raw?.docs) ? raw.docs : [];
    const normalized = documents
      .map(normalizeSearchDocument)
      .filter((item): item is SearchDocumentResult => item !== null);
    if (request.sort === "title") {
      normalized.sort((left, right) =>
        left.work.title.localeCompare(right.work.title, "pt-BR")
      );
    }
    const representativeEditions = new Map<string, CatalogEdition>();
    for (const result of normalized) {
      if (result.edition) {
        representativeEditions.set(result.work.workKey, result.edition);
      }
    }
    return {
      works: normalized.map((result) => result.work),
      representativeEditions,
      total: Math.max(
        0,
        Math.floor(
          numberValue(raw?.numFound ?? raw?.num_found ?? raw?.num_found_exact) ??
            normalized.length,
        ),
      ),
    };
  }

  async work(
    workKey: string,
    editionPage: number,
  ): Promise<CatalogWorkDetail> {
    const canonical = canonicalWorkKey(workKey);
    if (!/^OL[0-9]+W$/.test(canonical)) {
      throw new OpenLibraryError("Obra não encontrada na Open Library.", 404);
    }
    const offset = (editionPage - 1) * 12;
    const [workRaw, editionsRaw, searchRaw] = await Promise.all([
      this.requestJson(`/works/${canonical}.json`),
      this.requestJson(`/works/${canonical}/editions.json`, {
        limit: 12,
        offset,
      }),
      this.requestJson("/search.json", {
        q: `key:/works/${canonical}`,
        limit: 1,
        fields:
          "key,title,author_name,first_publish_year,edition_count,cover_i,language,subject,isbn",
      }),
    ]);

    const workRecord = object(workRaw) ?? {};
    const editionRecord = object(editionsRaw) ?? {};
    const searchRecord = object(searchRaw) ?? {};
    const searchDocument = normalizeSearchDocument(
      first(searchRecord.docs),
    )?.work;
    const editions = (Array.isArray(editionRecord.entries)
      ? editionRecord.entries
      : [])
      .map(normalizeEdition)
      .filter((edition): edition is CatalogEdition => edition !== null);
    const totalEditions = Math.max(
      editions.length,
      integerValue(editionRecord.size, 0, Number.MAX_SAFE_INTEGER) ??
        searchDocument?.editionCount ??
        editions.length,
    );
    const covers = Array.isArray(workRecord.covers) ? workRecord.covers : [];
    const work: CatalogWorkDetail["work"] = {
      workKey: canonical,
      title:
        text(workRecord.title, 500) || searchDocument?.title || "Obra sem título",
      authors: searchDocument?.authors ?? [],
      firstPublishedYear: searchDocument?.firstPublishedYear ?? null,
      description: descriptionText(workRecord.description),
      subjects: texts(workRecord.subjects, 50, 300),
      languages: searchDocument?.languages ?? [
        ...new Set(editions.map((edition) => edition.language).filter(Boolean)),
      ],
      coverUrl:
        coverUrlFromId(first(covers)) ||
        searchDocument?.coverUrl ||
        editions.find((edition) => edition.coverUrl)?.coverUrl ||
        "",
      editionCount: totalEditions,
    };
    return { work, editions, totalEditions };
  }

  async resolve(input: {
    isbn?: string;
    title?: string;
    author?: string;
  }): Promise<{
    work: WorkCandidate | null;
    editions: CatalogEdition[];
  }> {
    const query = input.isbn
      ? `isbn:${input.isbn}`
      : [
        input.title ? `title:"${escapedQualifier(input.title)}"` : "",
        input.author ? `author:"${escapedQualifier(input.author)}"` : "",
      ].filter(Boolean).join(" ");
    if (!query) return { work: null, editions: [] };
    const result = await this.search({
      operation: "search",
      query,
      page: 1,
      sort: "relevance",
    });
    const work = result.works[0] ?? null;
    const edition = work
      ? result.representativeEditions.get(work.workKey)
      : undefined;
    return {
      work,
      editions: edition ? [edition] : [],
    };
  }
}
