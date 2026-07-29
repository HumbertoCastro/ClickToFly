import type {
  CatalogCollection,
  CatalogCollectionResult,
  CatalogEdition,
  CatalogIdentityCandidate,
  CatalogIdentityDecision,
  CatalogOperation,
  CatalogPagination,
  CatalogResolveParams,
  CatalogResolveResult,
  CatalogResponse,
  CatalogRetailer,
  CatalogSearchParams,
  CatalogSearchResult,
  CatalogSort,
  CatalogWork,
  CatalogWorkResult,
  RetailerDestination,
  RetailerSearchInput,
} from "../catalogTypes";

const BOOK_CATALOG_PATH = "/functions/v1/book-catalog";
const ISBN_10_PATTERN = /^\d{9}[\dX]$/;
const ISBN_13_PATTERN = /^\d{13}$/;
const LEGACY_ASIN_PATTERN = /^[A-Z0-9]{10}$/;
const COLLECTION_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IDENTITY_THRESHOLD = 0.86;
const MAX_QUERY_LENGTH = 200;
const MAX_KEY_LENGTH = 160;
const DEFAULT_SEARCH_CACHE_MS = 24 * 60 * 60 * 1_000;
const DEFAULT_DETAIL_CACHE_MS = 7 * 24 * 60 * 60 * 1_000;
const STALE_CACHE_MS = 5 * 60 * 1_000;

type EnvironmentValue = string | boolean | undefined;
export type BookCatalogEnvironment = Record<string, EnvironmentValue>;
const browserBookCatalogEnvironment: BookCatalogEnvironment = {
  VITE_BOOK_CATALOG_ENDPOINT: import.meta.env.VITE_BOOK_CATALOG_ENDPOINT,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
};
export type BookCatalogHeaderResolver = () =>
  | Promise<Record<string, string>>
  | Record<string, string>;

export interface BookCatalogConfig {
  endpoint: string;
  headers: Record<string, string>;
}

export interface BookCatalogClientOptions extends BookCatalogConfig {
  fetchImpl?: typeof fetch;
  now?: () => number;
  resolveHeaders?: BookCatalogHeaderResolver;
}

export interface BookCatalogClient {
  collection(slug: string): Promise<CatalogCollectionResult>;
  search(params: CatalogSearchParams): Promise<CatalogSearchResult>;
  work(workKey: string, editionPage?: number): Promise<CatalogWorkResult>;
  resolve(params: CatalogResolveParams): Promise<CatalogResolveResult>;
  clearCache(): void;
}

type UnknownRecord = Record<string, unknown>;

type CatalogRequest =
  | { operation: "collection"; slug: string }
  | {
      operation: "search";
      query: string;
      page: number;
      language?: string;
      subject?: string;
      sort?: CatalogSort;
    }
  | { operation: "work"; workKey: string; editionPage: number }
  | {
      operation: "resolve";
      isbn?: string;
      legacyAsin?: string;
      title?: string;
      author?: string;
    };

interface CacheEntry {
  result: CatalogResponse;
  expiresAt: number;
}

export class BookCatalogError extends Error {
  readonly code: string;
  readonly status: number;
  readonly retryAfterSeconds: number | null;

  constructor(
    message: string,
    options: {
      code?: string;
      status?: number;
      retryAfterSeconds?: number | null;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "BookCatalogError";
    this.code = options.code ?? "book_catalog_error";
    this.status = options.status ?? 0;
    this.retryAfterSeconds = options.retryAfterSeconds ?? null;
  }
}

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function cleanText(value: unknown, maximumLength = 10_000): string {
  if (typeof value !== "string") return "";
  return value
    .split("\u0000")
    .join("")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, maximumLength);
}

function decodeHtmlEntities(value: string): string {
  const entities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value
    .replace(
      /&(#x[\da-f]+|#\d+|amp|apos|gt|lt|nbsp|quot);/gi,
      (entity, code: string) => {
        if (code[0] !== "#") return entities[code.toLowerCase()] ?? entity;
        const radix = code[1]?.toLowerCase() === "x" ? 16 : 10;
        const digits = radix === 16 ? code.slice(2) : code.slice(1);
        const point = Number.parseInt(digits, radix);
        return Number.isFinite(point) && point > 0 && point <= 0x10ffff
          ? String.fromCodePoint(point)
          : "";
      },
    )
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

export function sanitizeDescription(value: unknown): string {
  const description = cleanText(value, 20_000)
    .replace(/<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]*>/g, "");
  return decodeHtmlEntities(description).trim().slice(0, 12_000);
}

function uniqueStringList(
  value: unknown,
  maximumItems = 50,
  maximumLength = 160,
): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const candidate of value) {
    const item = cleanText(candidate, maximumLength);
    const identity = item.toLocaleLowerCase("pt-BR");
    if (!item || seen.has(identity)) continue;
    seen.add(identity);
    result.push(item);
    if (result.length >= maximumItems) break;
  }

  return result;
}

function finiteInteger(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value)
    ? value
    : null;
}

function safeHttpsUrl(value: unknown): string {
  const candidate = cleanText(value, 2_048);
  if (!candidate) return "";

  try {
    const url = new URL(candidate.replace(/^http:\/\//i, "https://"));
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      !url.hostname
    ) {
      return "";
    }
    return url.href;
  } catch {
    return "";
  }
}

function normalizedKey(value: unknown): string {
  return cleanText(value, MAX_KEY_LENGTH).replace(/^\/+|\/+$/g, "");
}

function canonicalWorkKey(value: unknown): string {
  return normalizedKey(value).replace(/^works\//i, "");
}

function canonicalEditionKey(value: unknown): string {
  return normalizedKey(value).replace(/^books\//i, "");
}

function catalogWork(value: unknown): CatalogWork | null {
  const record = asRecord(value);
  if (!record) return null;

  const workKey = canonicalWorkKey(record.workKey);
  const title = cleanText(record.title, 500);
  if (!workKey || !title) return null;

  const year = finiteInteger(record.firstPublishedYear);
  const editionCount = finiteInteger(record.editionCount);

  return {
    workKey,
    title,
    authors: uniqueStringList(record.authors, 20, 200),
    firstPublishedYear:
      year !== null && year >= 1 && year <= 9_999 ? year : null,
    description: sanitizeDescription(record.description),
    subjects: uniqueStringList(record.subjects),
    languages: uniqueStringList(record.languages, 30, 35),
    coverUrl: safeHttpsUrl(record.coverUrl),
    editionCount:
      editionCount !== null && editionCount >= 0 ? editionCount : 0,
    editorialText: sanitizeDescription(record.editorialText),
    badge: cleanText(record.badge, 100),
    featured: record.featured === true,
  };
}

export function sanitizeCatalogWork(value: unknown): CatalogWork | null {
  return catalogWork(value);
}

export function normalizeIsbn(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/^ISBN(?:-1[03])?:?\s*/i, "")
    .replace(/[\s-]/g, "");
}

export function isbn10CheckDigit(value: string): string | null {
  const normalized = normalizeIsbn(value);
  const body = normalized.length === 10 ? normalized.slice(0, 9) : normalized;
  if (!/^\d{9}$/.test(body)) return null;
  const sum = [...body].reduce(
    (total, digit, index) => total + Number(digit) * (10 - index),
    0,
  );
  const remainder = (11 - (sum % 11)) % 11;
  return remainder === 10 ? "X" : String(remainder);
}

export function isbn13CheckDigit(value: string): string | null {
  const normalized = normalizeIsbn(value);
  const body = normalized.length === 13 ? normalized.slice(0, 12) : normalized;
  if (!/^\d{12}$/.test(body)) return null;
  const sum = [...body].reduce(
    (total, digit, index) =>
      total + Number(digit) * (index % 2 === 0 ? 1 : 3),
    0,
  );
  return String((10 - (sum % 10)) % 10);
}

export function isValidIsbn10(value: string): boolean {
  const normalized = normalizeIsbn(value);
  return (
    ISBN_10_PATTERN.test(normalized) &&
    isbn10CheckDigit(normalized) === normalized.at(-1)
  );
}

export function isValidIsbn13(value: string): boolean {
  const normalized = normalizeIsbn(value);
  return (
    ISBN_13_PATTERN.test(normalized) &&
    isbn13CheckDigit(normalized) === normalized.at(-1)
  );
}

export function isValidIsbn(value: string): boolean {
  return isValidIsbn10(value) || isValidIsbn13(value);
}

export function isbn10To13(value: string): string | null {
  const normalized = normalizeIsbn(value);
  if (!isValidIsbn10(normalized)) return null;
  const body = `978${normalized.slice(0, 9)}`;
  const checkDigit = isbn13CheckDigit(body);
  return checkDigit === null ? null : `${body}${checkDigit}`;
}

function validIsbnOrEmpty(value: unknown, length: 10 | 13): string {
  const candidate = cleanText(value, 30);
  if (!candidate) return "";
  const normalized = normalizeIsbn(candidate);
  return length === 10
    ? isValidIsbn10(normalized)
      ? normalized
      : ""
    : isValidIsbn13(normalized)
      ? normalized
      : "";
}

function catalogEdition(value: unknown): CatalogEdition | null {
  const record = asRecord(value);
  if (!record) return null;

  const editionKey = canonicalEditionKey(record.editionKey);
  if (!editionKey) return null;
  const pageCount = finiteInteger(record.pageCount);

  return {
    editionKey,
    isbn10: validIsbnOrEmpty(record.isbn10, 10),
    isbn13: validIsbnOrEmpty(record.isbn13, 13),
    publisher: cleanText(record.publisher, 300),
    publishedDate: cleanText(record.publishedDate, 40),
    language: cleanText(record.language, 35),
    format: cleanText(record.format, 100),
    pageCount: pageCount !== null && pageCount > 0 ? pageCount : null,
    coverUrl: safeHttpsUrl(record.coverUrl),
  };
}

export function sanitizeCatalogEdition(
  value: unknown,
): CatalogEdition | null {
  return catalogEdition(value);
}

const RETAILER_HOSTS: Record<CatalogRetailer, readonly string[]> = {
  amazon_br: ["amazon.com.br"],
  estante_virtual: ["estantevirtual.com.br"],
  mercado_livre: ["mercadolivre.com.br"],
};

function isAllowedHost(hostname: string, allowedRoots: readonly string[]) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return allowedRoots.some(
    (root) => normalized === root || normalized.endsWith(`.${root}`),
  );
}

export function isRetailerUrl(
  retailer: CatalogRetailer,
  value: string,
): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      isAllowedHost(url.hostname, RETAILER_HOSTS[retailer])
    );
  } catch {
    return false;
  }
}

function catalogRetailer(value: unknown): CatalogRetailer | null {
  return value === "amazon_br" ||
    value === "estante_virtual" ||
    value === "mercado_livre"
    ? value
    : null;
}

export function sanitizeRetailerDestination(
  value: unknown,
): RetailerDestination | null {
  const record = asRecord(value);
  const retailer = catalogRetailer(record?.retailer);
  const url = cleanText(record?.url, 4_096);
  const kind =
    record?.kind === "direct" || record?.kind === "search"
      ? record.kind
      : null;
  if (!record || !retailer || !kind || !isRetailerUrl(retailer, url)) {
    return null;
  }

  return {
    retailer,
    editionKey: normalizedKey(record.editionKey) || null,
    url,
    kind,
    affiliate: record.affiliate === true,
    label:
      cleanText(record.label, 120) ||
      (kind === "direct" ? "Ver esta edição na loja" : "Buscar na loja"),
  };
}

export interface CatalogEditionIdentity {
  catalogEditionKey?: string | null;
  isbn10?: string | null;
  isbn13?: string | null;
  legacyAsins?: readonly string[];
}

function amazonAsinFromDestination(
  destination: RetailerDestination,
): string {
  if (
    destination.retailer !== "amazon_br" ||
    destination.kind !== "direct" ||
    !isRetailerUrl("amazon_br", destination.url)
  ) {
    return "";
  }
  const pathname = new URL(destination.url).pathname;
  return (
    pathname.match(/\/dp\/([A-Z0-9]{10})(?:\/|$)/i)?.[1]?.toUpperCase() ??
    pathname.match(/\/gp\/product\/([A-Z0-9]{10})(?:\/|$)/i)?.[1]?.toUpperCase() ??
    ""
  );
}

export function matchCatalogEdition(
  identity: CatalogEditionIdentity,
  editions: readonly CatalogEdition[],
  destinations: readonly RetailerDestination[] = [],
): CatalogEdition | null {
  const isbn13 = normalizeIsbn(identity.isbn13 ?? "");
  if (isValidIsbn13(isbn13)) {
    const match = editions.find(
      (edition) => normalizeIsbn(edition.isbn13) === isbn13,
    );
    if (match) return match;
  }

  const isbn10 = normalizeIsbn(identity.isbn10 ?? "");
  if (isValidIsbn10(isbn10)) {
    const match = editions.find(
      (edition) => normalizeIsbn(edition.isbn10) === isbn10,
    );
    if (match) return match;
  }

  if (identity.catalogEditionKey) {
    const match = editions.find(
      (edition) => edition.editionKey === identity.catalogEditionKey,
    );
    if (match) return match;
  }

  const legacyAsins = new Set(
    (identity.legacyAsins ?? [])
      .map((asin) => asin.trim().toUpperCase())
      .filter((asin) => LEGACY_ASIN_PATTERN.test(asin)),
  );
  if (legacyAsins.size === 0) return null;

  const destination = destinations.find(
    (candidate) =>
      candidate.editionKey &&
      legacyAsins.has(amazonAsinFromDestination(candidate)),
  );
  return destination?.editionKey
    ? editions.find(
        (edition) => edition.editionKey === destination.editionKey,
      ) ?? null
    : null;
}

function searchTerm(input: RetailerSearchInput): string {
  const isbn13 = normalizeIsbn(input.isbn13 ?? "");
  if (isValidIsbn13(isbn13)) return isbn13;
  const isbn10 = normalizeIsbn(input.isbn10 ?? "");
  if (isValidIsbn10(isbn10)) return isbn10;
  return [cleanText(input.title, 500), ...(input.authors ?? []).slice(0, 1)]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function buildRetailerSearchUrl(
  retailer: CatalogRetailer,
  input: RetailerSearchInput,
): string {
  const term = searchTerm(input);
  if (!term) {
    throw new BookCatalogError(
      "Informe um ISBN ou título para criar o destino de compra.",
      { code: "invalid_retailer_search" },
    );
  }

  switch (retailer) {
    case "amazon_br":
      return `https://www.amazon.com.br/s?k=${encodeURIComponent(term)}`;
    case "estante_virtual":
      return `https://www.estantevirtual.com.br/busca?q=${encodeURIComponent(term)}`;
    case "mercado_livre":
      return `https://lista.mercadolivre.com.br/${encodeURIComponent(term)}`;
  }
}

export function buildRetailerDestinations(
  input: RetailerSearchInput,
): RetailerDestination[] {
  return (
    ["amazon_br", "estante_virtual", "mercado_livre"] as const
  ).map((retailer) => ({
    retailer,
    editionKey: normalizedKey(input.editionKey) || null,
    url: buildRetailerSearchUrl(retailer, input),
    kind: "search",
    affiliate: false,
    label: "Buscar na loja",
  }));
}

function catalogCollection(value: unknown): CatalogCollection | null {
  const record = asRecord(value);
  if (!record) return null;
  const slug = cleanText(record.slug, 100).toLocaleLowerCase("pt-BR");
  const title = cleanText(record.title, 300);
  if (!COLLECTION_SLUG_PATTERN.test(slug) || !title) return null;
  return {
    slug,
    title,
    description: sanitizeDescription(record.description),
    badge: cleanText(record.badge, 100),
    featured: record.featured === true,
  };
}

function catalogPagination(
  value: unknown,
  defaults: { page: number; pageSize: number; total: number },
): CatalogPagination {
  const record = asRecord(value);
  const page = finiteInteger(record?.page);
  const pageSize = finiteInteger(record?.pageSize);
  const total = finiteInteger(record?.total);
  return {
    page: page !== null && page > 0 ? page : defaults.page,
    pageSize:
      pageSize !== null && pageSize > 0 ? pageSize : defaults.pageSize,
    total: total !== null && total >= 0 ? total : defaults.total,
    hasMore: record?.hasMore === true,
  };
}

function isoTimestamp(value: unknown, fallback: string): string {
  const candidate = cleanText(value, 60);
  return candidate && Number.isFinite(Date.parse(candidate))
    ? new Date(candidate).toISOString()
    : fallback;
}

function nullableIsoTimestamp(value: unknown): string | null {
  const candidate = cleanText(value, 60);
  return candidate && Number.isFinite(Date.parse(candidate))
    ? new Date(candidate).toISOString()
    : null;
}

function sanitizeCatalogResponse(
  value: unknown,
  request: CatalogRequest,
  now: number,
): CatalogResponse {
  const record = asRecord(value);
  if (
    !record ||
    record.operation !== request.operation ||
    record.source !== "open_library"
  ) {
    throw new BookCatalogError(
      "O catálogo retornou uma resposta incompatível.",
      { code: "invalid_response" },
    );
  }

  const works = (Array.isArray(record.works) ? record.works : [])
    .map(catalogWork)
    .filter((work): work is CatalogWork => work !== null);
  const editions = (Array.isArray(record.editions) ? record.editions : [])
    .map(catalogEdition)
    .filter((edition): edition is CatalogEdition => edition !== null);
  const destinations = (
    Array.isArray(record.destinations) ? record.destinations : []
  )
    .map(sanitizeRetailerDestination)
    .filter(
      (destination): destination is RetailerDestination =>
        destination !== null,
    );
  const fetchedAt = isoTimestamp(
    record.fetchedAt,
    new Date(now).toISOString(),
  );
  const base = {
    works,
    fetchedAt,
    expiresAt: nullableIsoTimestamp(record.expiresAt),
    stale: record.stale === true,
    source: "open_library" as const,
  };

  switch (request.operation) {
    case "collection": {
      const collection = catalogCollection(record.collection);
      if (!collection) {
        throw new BookCatalogError(
          "A coleção retornada pelo catálogo é inválida.",
          { code: "invalid_response" },
        );
      }
      return {
        ...base,
        operation: "collection",
        collection,
        pagination: catalogPagination(record.pagination, {
          page: 1,
          pageSize: works.length,
          total: works.length,
        }),
      };
    }
    case "search":
      return {
        ...base,
        operation: "search",
        pagination: catalogPagination(record.pagination, {
          page: request.page,
          pageSize: works.length,
          total: works.length,
        }),
      };
    case "work": {
      const work = catalogWork(record.work);
      if (!work) {
        throw new BookCatalogError(
          "A obra retornada pelo catálogo é inválida.",
          { code: "invalid_response" },
        );
      }
      return {
        ...base,
        operation: "work",
        work,
        editions,
        destinations,
        pagination: catalogPagination(record.pagination, {
          page: request.editionPage,
          pageSize: editions.length,
          total: editions.length,
        }),
      };
    }
    case "resolve":
      return {
        ...base,
        operation: "resolve",
        work: record.work === null ? null : catalogWork(record.work),
        editions,
        destinations,
      };
  }
}

function environmentString(
  environment: BookCatalogEnvironment,
  key: string,
): string {
  const value = environment[key];
  return typeof value === "string" ? value.trim() : "";
}

function isValidCatalogEndpoint(value: string): boolean {
  try {
    const url = new URL(value);
    const localHost =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1";
    return (
      (url.protocol === "https:" || (url.protocol === "http:" && localHost)) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function getBookCatalogConfig(
  environment: BookCatalogEnvironment = browserBookCatalogEnvironment,
): BookCatalogConfig {
  const explicitEndpoint = environmentString(
    environment,
    "VITE_BOOK_CATALOG_ENDPOINT",
  );
  const supabaseUrl = environmentString(
    environment,
    "VITE_SUPABASE_URL",
  ).replace(/\/+$/, "");
  const endpoint =
    explicitEndpoint || (supabaseUrl ? `${supabaseUrl}${BOOK_CATALOG_PATH}` : "");
  if (!endpoint) {
    throw new BookCatalogError(
      "VITE_BOOK_CATALOG_ENDPOINT ou VITE_SUPABASE_URL é obrigatório para consultar o catálogo.",
      { code: "missing_endpoint" },
    );
  }
  if (!isValidCatalogEndpoint(endpoint)) {
    throw new BookCatalogError(
      "A URL pública da função book-catalog é inválida.",
      { code: "invalid_endpoint" },
    );
  }

  const anonKey = environmentString(environment, "VITE_SUPABASE_ANON_KEY");
  const headers: Record<string, string> = {};
  if (anonKey) {
    headers.apikey = anonKey;
    headers.Authorization = `Bearer ${anonKey}`;
  }

  return { endpoint: endpoint.replace(/\/+$/, ""), headers };
}

export function createBookCatalogAuthHeaderResolver(
  resolveAccessToken: () =>
    | Promise<string | null | undefined>
    | string
    | null
    | undefined,
): BookCatalogHeaderResolver {
  return async () => {
    const accessToken = cleanText(await resolveAccessToken(), 8_192);
    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return headers;
  };
}

function validatedCollectionRequest(slug: string): CatalogRequest {
  const normalized = slug.trim().toLocaleLowerCase("pt-BR");
  if (!COLLECTION_SLUG_PATTERN.test(normalized)) {
    throw new BookCatalogError("A coleção informada é inválida.", {
      code: "invalid_collection",
    });
  }
  return { operation: "collection", slug: normalized };
}

function validatedSearchRequest(params: CatalogSearchParams): CatalogRequest {
  const query = cleanText(params.query, MAX_QUERY_LENGTH);
  if (!query) {
    throw new BookCatalogError("Digite um título, autor ou ISBN para buscar.", {
      code: "invalid_query",
    });
  }
  const page = params.page ?? 1;
  if (!Number.isInteger(page) || page < 1 || page > 100) {
    throw new BookCatalogError("A página da busca deve estar entre 1 e 100.", {
      code: "invalid_page",
    });
  }
  const language = cleanText(params.language, 35);
  const subject = cleanText(params.subject, 160);
  const sort = params.sort;
  if (
    sort !== undefined &&
    sort !== "relevance" &&
    sort !== "title" &&
    sort !== "oldest" &&
    sort !== "newest"
  ) {
    throw new BookCatalogError("A ordenação informada é inválida.", {
      code: "invalid_sort",
    });
  }
  return {
    operation: "search",
    query,
    page,
    ...(language ? { language } : {}),
    ...(subject ? { subject } : {}),
    ...(sort ? { sort } : {}),
  };
}

function validatedWorkRequest(
  workKey: string,
  editionPage = 1,
): CatalogRequest {
  const normalized = canonicalWorkKey(workKey);
  if (!normalized) {
    throw new BookCatalogError("A chave da obra é obrigatória.", {
      code: "invalid_work_key",
    });
  }
  if (!Number.isInteger(editionPage) || editionPage < 1 || editionPage > 1_000) {
    throw new BookCatalogError(
      "A página de edições deve estar entre 1 e 1000.",
      { code: "invalid_page" },
    );
  }
  return { operation: "work", workKey: normalized, editionPage };
}

function validatedResolveRequest(params: CatalogResolveParams): CatalogRequest {
  const isbn = normalizeIsbn(params.isbn ?? "");
  const legacyAsin = cleanText(params.legacyAsin, 10).toUpperCase();
  const title = cleanText(params.title, 500);
  const author = cleanText(params.author, 300);

  if (isbn && !isValidIsbn(isbn)) {
    throw new BookCatalogError("O ISBN informado é inválido.", {
      code: "invalid_isbn",
    });
  }
  if (legacyAsin && !LEGACY_ASIN_PATTERN.test(legacyAsin)) {
    throw new BookCatalogError("O ASIN legado informado é inválido.", {
      code: "invalid_legacy_asin",
    });
  }
  if (!isbn && !legacyAsin && !title) {
    throw new BookCatalogError(
      "Informe ISBN, ASIN legado ou título para localizar a obra.",
      { code: "invalid_resolve_query" },
    );
  }

  return {
    operation: "resolve",
    ...(isbn ? { isbn } : {}),
    ...(legacyAsin ? { legacyAsin } : {}),
    ...(title ? { title } : {}),
    ...(author ? { author } : {}),
  };
}

async function catalogHttpError(response: Response): Promise<BookCatalogError> {
  let code = "book_catalog_request_failed";
  let message =
    response.status === 429
      ? "O catálogo atingiu o limite temporário. Tente novamente em instantes."
      : response.status === 401 || response.status === 403
        ? "Sua sessão não permite realizar esta consulta."
        : response.status === 404
          ? "A obra solicitada não foi encontrada."
          : "Não foi possível consultar o catálogo agora.";
  let retryAfterSeconds: number | null = null;

  try {
    const payload = asRecord(await response.json());
    const error = asRecord(payload?.error);
    code = cleanText(error?.code, 100) || code;
    message = cleanText(error?.message, 500) || message;
    const wireRetryAfter = error?.retryAfterSeconds;
    if (
      typeof wireRetryAfter === "number" &&
      Number.isFinite(wireRetryAfter) &&
      wireRetryAfter >= 0
    ) {
      retryAfterSeconds = wireRetryAfter;
    }
  } catch {
    // The status-specific fallback above is safe for non-JSON responses.
  }

  if (retryAfterSeconds === null) {
    const header = response.headers.get("Retry-After");
    const parsed = header ? Number.parseInt(header, 10) : Number.NaN;
    retryAfterSeconds = Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }

  return new BookCatalogError(message, {
    code,
    status: response.status,
    retryAfterSeconds,
  });
}

function cloneResponse<T extends CatalogResponse>(result: T): T {
  return JSON.parse(JSON.stringify(result)) as T;
}

function cacheExpiry(
  result: CatalogResponse,
  operation: CatalogOperation,
  now: number,
): number {
  if (result.stale) return now + STALE_CACHE_MS;
  if (result.expiresAt) {
    const serverExpiry = Date.parse(result.expiresAt);
    if (Number.isFinite(serverExpiry) && serverExpiry > now) return serverExpiry;
  }
  return (
    now +
    (operation === "search" || operation === "collection"
      ? DEFAULT_SEARCH_CACHE_MS
      : DEFAULT_DETAIL_CACHE_MS)
  );
}

export function createBookCatalogClient(
  options: BookCatalogClientOptions,
): BookCatalogClient {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const now = options.now ?? Date.now;
  const cache = new Map<string, CacheEntry>();
  const inFlight = new Map<string, Promise<CatalogResponse>>();

  const requestCatalog = async <TResult extends CatalogResponse>(
    request: CatalogRequest,
  ): Promise<TResult> => {
    if (!options.endpoint || !isValidCatalogEndpoint(options.endpoint)) {
      throw new BookCatalogError(
        "A URL pública da função book-catalog não foi configurada.",
        { code: "missing_endpoint" },
      );
    }
    if (typeof fetchImpl !== "function") {
      throw new BookCatalogError(
        "Este ambiente não oferece suporte a requisições de catálogo.",
        { code: "fetch_unavailable" },
      );
    }

    const key = JSON.stringify(request);
    const timestamp = now();
    const cached = cache.get(key);
    if (cached && cached.expiresAt > timestamp) {
      return cloneResponse(cached.result) as TResult;
    }
    cache.delete(key);

    const pending = inFlight.get(key);
    if (pending) return cloneResponse((await pending) as TResult);

    const execute = (async (): Promise<CatalogResponse> => {
      let response: Response;
      try {
        response = await fetchImpl(options.endpoint, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...options.headers,
            ...(options.resolveHeaders ? await options.resolveHeaders() : {}),
          },
          body: JSON.stringify(request),
        });
      } catch (cause) {
        if (cause instanceof BookCatalogError) throw cause;
        throw new BookCatalogError(
          "Não foi possível conectar ao catálogo agora.",
          { code: "network_error", cause },
        );
      }

      if (!response.ok) throw await catalogHttpError(response);

      let payload: unknown;
      try {
        payload = await response.json();
      } catch (cause) {
        throw new BookCatalogError(
          "O catálogo retornou uma resposta inválida.",
          { code: "invalid_response", status: response.status, cause },
        );
      }

      const result = sanitizeCatalogResponse(
        payload,
        request,
        now(),
      );
      cache.set(key, {
        result: cloneResponse(result),
        expiresAt: cacheExpiry(result, request.operation, now()),
      });
      return result;
    })();

    inFlight.set(key, execute);
    try {
      return cloneResponse((await execute) as TResult);
    } finally {
      inFlight.delete(key);
    }
  };

  return {
    collection: async (slug) =>
      requestCatalog<CatalogCollectionResult>(
        validatedCollectionRequest(slug),
      ),
    search: async (params) =>
      requestCatalog<CatalogSearchResult>(validatedSearchRequest(params)),
    work: async (workKey, editionPage) =>
      requestCatalog<CatalogWorkResult>(
        validatedWorkRequest(workKey, editionPage),
      ),
    resolve: async (params) =>
      requestCatalog<CatalogResolveResult>(validatedResolveRequest(params)),
    clearCache: () => cache.clear(),
  };
}

function baseNormalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[’'`´]/g, "")
    .replace(/&/g, " e ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const EDITION_MARKER_PATTERN =
  /\b(?:\d+\s*[ªºao]?\s*)?(?:edicao|ed)(?:\s+(?:comemorativa|especial|revista|atualizada|ilustrada))?\b|\b(?:capa\s+dura|brochura|ebook|kindle)\b/giu;

export function normalizeTitle(value: string): string {
  return baseNormalize(value)
    .replace(EDITION_MARKER_PATTERN, " ")
    .replace(/^(?:a|o|as|os|um|uma|uns|umas)\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

const AUTHOR_CONNECTORS = new Set([
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
]);

export function normalizeAuthor(value: string): string {
  return baseNormalize(value)
    .split(" ")
    .filter((token) => token && !AUTHOR_CONNECTORS.has(token))
    .sort((left, right) => left.localeCompare(right, "pt-BR"))
    .join(" ");
}

function levenshteinDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitution =
        previous[rightIndex - 1] +
        (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1);
      current[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        substitution,
      );
    }
    previous = current;
  }
  return previous[right.length];
}

export function textSimilarity(left: string, right: string): number {
  const normalizedLeft = normalizeTitle(left);
  const normalizedRight = normalizeTitle(right);
  if (!normalizedLeft || !normalizedRight) return 0;
  if (normalizedLeft === normalizedRight) return 1;
  const distance = levenshteinDistance(normalizedLeft, normalizedRight);
  return Math.max(
    0,
    1 - distance / Math.max(normalizedLeft.length, normalizedRight.length),
  );
}

const SPECIAL_IDENTITY_BLOCKERS = [
  ["adaptacao", /\badaptacao\b/u],
  ["resumo", /\bresumo\b/u],
  ["guia", /\bguia\b/u],
  ["box", /\bbox\b/u],
  ["livro_de_atividades", /\blivro\s+de\s+atividades\b/u],
] as const;

function romanToInteger(value: string): number | null {
  if (/^\d+$/.test(value)) return Number.parseInt(value, 10);
  const romanValues: Record<string, number> = {
    i: 1,
    v: 5,
    x: 10,
    l: 50,
    c: 100,
  };
  let total = 0;
  let previous = 0;
  for (const character of [...value.toLowerCase()].reverse()) {
    const current = romanValues[character];
    if (!current) return null;
    total += current < previous ? -current : current;
    previous = current;
  }
  return total > 0 ? total : null;
}

export function identityBlockers(value: string): string[] {
  const normalized = baseNormalize(value);
  const blockers: string[] = SPECIAL_IDENTITY_BLOCKERS.filter(([, pattern]) =>
    pattern.test(normalized),
  ).map(([name]) => name);
  const volume = normalized.match(
    /\b(?:vol(?:ume)?|livro|tomo)\s*([0-9]+|[ivxlc]+)\b/u,
  );
  const volumeNumber = volume ? romanToInteger(volume[1]) : null;
  if (volumeNumber !== null) blockers.push(`volume:${volumeNumber}`);
  return blockers;
}

function normalizedWorkKey(value: string | undefined): string {
  return canonicalWorkKey(value).toUpperCase();
}

function normalizedValidIsbns(values: string[] | undefined): Set<string> {
  return new Set(
    (values ?? [])
      .map(normalizeIsbn)
      .filter((isbn) => isValidIsbn(isbn)),
  );
}

function authorsMatch(left: string[], right: string[]): boolean {
  const normalizedLeft = new Set(left.map(normalizeAuthor).filter(Boolean));
  return right
    .map(normalizeAuthor)
    .filter(Boolean)
    .some((author) => normalizedLeft.has(author));
}

function blockedIdentityReason(
  leftTitle: string,
  rightTitle: string,
): string | null {
  const left = identityBlockers(leftTitle);
  const right = identityBlockers(rightTitle);
  const leftSpecial = left.filter((item) => !item.startsWith("volume:"));
  const rightSpecial = right.filter((item) => !item.startsWith("volume:"));
  if (leftSpecial.length || rightSpecial.length) {
    return "Marcadores de adaptação, resumo, guia, box ou atividades exigem revisão manual.";
  }

  const leftVolume = left.find((item) => item.startsWith("volume:"));
  const rightVolume = right.find((item) => item.startsWith("volume:"));
  if (leftVolume && rightVolume && leftVolume !== rightVolume) {
    return "Os títulos indicam volumes diferentes.";
  }
  return null;
}

export function assessWorkIdentity(
  left: CatalogIdentityCandidate,
  right: CatalogIdentityCandidate,
): CatalogIdentityDecision {
  const leftWorkKey = normalizedWorkKey(left.workKey);
  const rightWorkKey = normalizedWorkKey(right.workKey);
  if (leftWorkKey && leftWorkKey === rightWorkKey) {
    return {
      match: true,
      method: "work_key",
      confidence: 1,
      reason: "Os registros pertencem à mesma Work key do Open Library.",
    };
  }

  const leftIsbns = normalizedValidIsbns(left.isbns);
  const sharedIsbn = [...normalizedValidIsbns(right.isbns)].some((isbn) =>
    leftIsbns.has(isbn),
  );
  if (sharedIsbn) {
    return {
      match: true,
      method: "isbn",
      confidence: 1,
      reason: "Os registros compartilham um ISBN válido.",
    };
  }

  const blockedReason = blockedIdentityReason(left.title, right.title);
  if (blockedReason) {
    return {
      match: false,
      method: "blocked",
      confidence: 0,
      reason: blockedReason,
    };
  }

  if (!authorsMatch(left.authors, right.authors)) {
    return {
      match: false,
      method: "none",
      confidence: 0,
      reason: "Nenhum autor identificado coincide.",
    };
  }

  const similarity = textSimilarity(left.title, right.title);
  if (similarity === 1) {
    return {
      match: true,
      method: "normalized_title",
      confidence: 1,
      reason: "Título normalizado e autor coincidem.",
    };
  }
  if (similarity >= IDENTITY_THRESHOLD) {
    return {
      match: true,
      method: "fuzzy_title",
      confidence: similarity,
      reason: "Título semelhante e autor coincidem.",
    };
  }
  return {
    match: false,
    method: "none",
    confidence: similarity,
    reason: "A similaridade do título ficou abaixo de 0,86.",
  };
}

export function shouldGroupWorks(
  left: CatalogIdentityCandidate,
  right: CatalogIdentityCandidate,
): boolean {
  return assessWorkIdentity(left, right).match;
}
