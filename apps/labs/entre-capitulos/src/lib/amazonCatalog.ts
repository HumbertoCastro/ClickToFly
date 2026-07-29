import type {
  AmazonBookFormat,
  AmazonCatalogFilters,
  AmazonCatalogItem,
  AmazonCatalogMode,
  AmazonCatalogOperation,
  AmazonCatalogResult,
  AmazonCatalogSort,
  AmazonCurrentOffer,
  AmazonEdition,
  AmazonLibraryBookDraft,
  AmazonRecommendationInterests,
  AmazonSearchIndex,
  AmazonSearchParams,
} from "../amazonTypes";

const ASIN_PATTERN = /^[A-Z0-9]{10}$/;
const AMAZON_CATALOG_PATH = "/functions/v1/amazon-catalog";

type EnvironmentValue = string | boolean | undefined;
type AmazonCatalogEnvironment = Record<string, EnvironmentValue>;

export interface AmazonCatalogConfig {
  mode: AmazonCatalogMode;
  endpoint: string;
  headers: Record<string, string>;
}

export interface AmazonCatalogClientOptions extends AmazonCatalogConfig {
  fetchImpl?: typeof fetch;
  now?: () => number;
  bootstrapItems?: AmazonCatalogItem[];
  resolveHeaders?: () =>
    | Promise<Record<string, string>>
    | Record<string, string>;
}

export interface AmazonCatalogClient {
  mode: AmazonCatalogMode;
  search(params: AmazonSearchParams): Promise<AmazonCatalogResult>;
  items(asins: string[]): Promise<AmazonCatalogResult>;
  variations(asin: string): Promise<AmazonCatalogResult>;
  clearCache(): void;
}

function pause(milliseconds: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));
}

export async function loadAmazonCatalogItem(
  client: AmazonCatalogClient,
  asin: string,
): Promise<AmazonCatalogResult> {
  const itemResult = await client.items([asin]);
  const needsVariations =
    itemResult.items.length === 0 ||
    itemResult.items.some((item) => Boolean(item.parentAsin));
  if (!needsVariations) return itemResult;

  // The initial Creators quota is 1 TPS, so a possible variation lookup is
  // deliberately serialized after GetItems.
  await pause(1050);
  try {
    const variations = await client.variations(asin);
    const items = new Map(
      [...itemResult.items, ...variations.items].map((item) => [
        item.asin,
        item,
      ]),
    );
    const expirations = [
      itemResult.expiresAt,
      variations.expiresAt,
    ]
      .filter((value): value is string => Boolean(value))
      .sort(
        (left, right) => Date.parse(left) - Date.parse(right),
      );
    return {
      ...itemResult,
      mode:
        itemResult.mode === "disabled" || variations.mode === "disabled"
          ? "disabled"
          : itemResult.mode,
      items: [...items.values()],
      expiresAt: expirations[0] ?? null,
    };
  } catch (cause) {
    if (itemResult.items.length > 0) return itemResult;
    throw cause;
  }
}

interface CatalogRequest {
  operation: AmazonCatalogOperation;
  query?: string;
  asins?: string[];
  asin?: string;
  searchIndex?: AmazonSearchIndex;
  page?: number;
  category?: string;
}

interface CacheEntry {
  result: AmazonCatalogResult;
  expiresAt: number;
}

interface WireContext {
  fetchedAt: string;
  expiresAt: string | null;
  searchIndex: AmazonSearchIndex;
}

type UnknownRecord = Record<string, unknown>;

export class AmazonCatalogError extends Error {
  readonly code: string;
  readonly status: number;
  readonly retryAfterSeconds: number | null;

  constructor(
    message: string,
    options: {
      code?: string;
      status?: number;
      retryAfterSeconds?: number | null;
    } = {},
  ) {
    super(message);
    this.name = "AmazonCatalogError";
    this.code = options.code ?? "amazon_catalog_error";
    this.status = options.status ?? 0;
    this.retryAfterSeconds = options.retryAfterSeconds ?? null;
  }
}

function environmentString(
  environment: AmazonCatalogEnvironment,
  key: string,
): string {
  const value = environment[key];
  return typeof value === "string" ? value.trim() : "";
}

function catalogMode(value: string): AmazonCatalogMode {
  if (!value) return "disabled";
  if (value === "disabled" || value === "sitestripe" || value === "creators") {
    return value;
  }
  throw new AmazonCatalogError(
    "VITE_AMAZON_CATALOG_MODE deve ser disabled, sitestripe ou creators.",
    { code: "invalid_catalog_mode" },
  );
}

export function getAmazonCatalogConfig(
  environment: AmazonCatalogEnvironment = import.meta
    .env as AmazonCatalogEnvironment,
): AmazonCatalogConfig {
  const mode = catalogMode(
    environmentString(environment, "VITE_AMAZON_CATALOG_MODE").toLowerCase(),
  );
  const explicitEndpoint = environmentString(
    environment,
    "VITE_AMAZON_CATALOG_ENDPOINT",
  );
  const supabaseUrl = environmentString(environment, "VITE_SUPABASE_URL").replace(
    /\/+$/,
    "",
  );
  const endpoint =
    explicitEndpoint || (supabaseUrl ? `${supabaseUrl}${AMAZON_CATALOG_PATH}` : "");
  const anonKey = environmentString(environment, "VITE_SUPABASE_ANON_KEY");
  const headers: Record<string, string> = {};

  if (anonKey) {
    headers.apikey = anonKey;
    headers.Authorization = `Bearer ${anonKey}`;
  }

  return { mode, endpoint, headers };
}

export function isValidAsin(value: string): boolean {
  return ASIN_PATTERN.test(value.trim().toUpperCase());
}

export function isAmazonUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "amazon.com.br" ||
        url.hostname.endsWith(".amazon.com.br"))
    );
  } catch {
    return false;
  }
}

export const isAmazonProductUrl = isAmazonUrl;

export function isExpired(
  expiresAt: string | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!expiresAt) return true;
  const timestamp = Date.parse(expiresAt);
  return !Number.isFinite(timestamp) || timestamp <= now;
}

export function amazonCatalogExpirations(
  items: readonly AmazonCatalogItem[],
  resultExpiresAt?: string | null,
): string[] {
  const expirations = new Set<string>();
  const collect = (value: string | null | undefined) => {
    if (value && Number.isFinite(Date.parse(value))) expirations.add(value);
  };

  collect(resultExpiresAt);
  for (const item of items) {
    collect(item.expiresAt);
    collect(item.salesRankExpiresAt);
    collect(item.offer?.expiresAt);
    for (const edition of item.editions) {
      collect(edition.expiresAt);
      collect(edition.offer?.expiresAt);
    }
  }

  return [...expirations];
}

function isFreshOrDurable(
  expiresAt: string | null,
  catalogSource: AmazonCatalogItem["catalogSource"],
  now: number,
): boolean {
  return catalogSource === "sitestripe" && expiresAt === null
    ? true
    : !isExpired(expiresAt, now);
}

function isAmazonImageUrl(value: string): boolean {
  if (!value) return true;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "m.media-amazon.com" ||
        url.hostname.endsWith(".media-amazon.com") ||
        url.hostname.endsWith(".ssl-images-amazon.com") ||
        url.hostname.endsWith(".amazon.com.br"))
    );
  } catch {
    return false;
  }
}

function freshOffer(
  offer: AmazonCurrentOffer | null,
  now: number,
): AmazonCurrentOffer | null {
  if (
    !offer ||
    offer.currency !== "BRL" ||
    !Number.isFinite(offer.priceAmount) ||
    offer.priceAmount < 0 ||
    isExpired(offer.expiresAt, now)
  ) {
    return null;
  }

  return { ...offer };
}

function freshEdition(
  edition: AmazonEdition,
  catalogSource: AmazonCatalogItem["catalogSource"],
  now: number,
): AmazonEdition | null {
  if (
    !isValidAsin(edition.asin) ||
    !isAmazonUrl(edition.detailPageUrl) ||
    !isAmazonImageUrl(edition.imageUrl) ||
    !isFreshOrDurable(edition.expiresAt ?? null, catalogSource, now)
  ) {
    return null;
  }

  return {
    ...edition,
    offer: freshOffer(edition.offer, now),
  };
}

export function sanitizeAmazonCatalogItem(
  item: AmazonCatalogItem,
  now: number = Date.now(),
): AmazonCatalogItem | null {
  if (
    !isValidAsin(item.asin) ||
    !item.title.trim() ||
    !isAmazonUrl(item.detailPageUrl) ||
    !isAmazonImageUrl(item.imageUrl) ||
    !isFreshOrDurable(item.expiresAt, item.catalogSource, now)
  ) {
    return null;
  }

  const hasFreshRank =
    item.salesRank !== null &&
    Number.isFinite(item.salesRank) &&
    item.salesRank > 0 &&
    !isExpired(item.salesRankExpiresAt, now);
  const editions = item.editions
    .map((edition) => freshEdition(edition, item.catalogSource, now))
    .filter((edition): edition is AmazonEdition => edition !== null);

  return {
    ...item,
    authors: [...item.authors],
    languages: [...item.languages],
    categories: [...item.categories],
    categoryDetails: item.categoryDetails.map((category) => ({
      ...category,
      path: [...category.path],
    })),
    salesRank: hasFreshRank ? item.salesRank : null,
    salesRankCategory: hasFreshRank ? item.salesRankCategory : "",
    salesRankFetchedAt: hasFreshRank ? item.salesRankFetchedAt : null,
    salesRankExpiresAt: hasFreshRank ? item.salesRankExpiresAt : null,
    editions,
    offer: freshOffer(item.offer, now),
  };
}

export function getFreshCurrentOffer(
  item: AmazonCatalogItem,
  now: number = Date.now(),
): AmazonCurrentOffer | null {
  const directOffer = freshOffer(item.offer, now);
  if (directOffer) return directOffer;

  for (const edition of item.editions) {
    const offer = freshOffer(edition.offer, now);
    if (offer) return offer;
  }

  return null;
}

function cloneResult(result: AmazonCatalogResult): AmazonCatalogResult {
  return {
    ...result,
    items: result.items.map((item) => ({
      ...item,
      authors: [...item.authors],
      languages: [...item.languages],
      categories: [...item.categories],
      categoryDetails: item.categoryDetails.map((category) => ({
        ...category,
        path: [...category.path],
      })),
      editions: item.editions.map((edition) => ({
        ...edition,
        offer: edition.offer ? { ...edition.offer } : null,
      })),
      offer: item.offer ? { ...item.offer } : null,
    })),
  };
}

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value: unknown): string | null {
  const normalized = text(value);
  return normalized || null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function positiveInteger(value: unknown): number | null {
  const number = finiteNumber(value);
  return number !== null && Number.isInteger(number) && number > 0
    ? number
    : null;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .map((candidate) => text(candidate))
        .filter((candidate) => candidate.length > 0),
    ),
  ];
}

function wireFormat(value: unknown): AmazonBookFormat {
  switch (text(value).toLowerCase()) {
    case "paperback":
      return "paperback";
    case "hardcover":
      return "hardcover";
    case "kindle":
      return "kindle";
    default:
      return "unknown";
  }
}

function formatLabel(format: AmazonBookFormat): string {
  switch (format) {
    case "paperback":
      return "Livro físico";
    case "hardcover":
      return "Capa dura";
    case "kindle":
      return "Kindle";
    default:
      return "Outra edição";
  }
}

function wireSearchIndex(
  value: unknown,
  format: AmazonBookFormat,
  fallback: AmazonSearchIndex,
): AmazonSearchIndex {
  if (value === "Books" || value === "KindleStore") return value;
  return format === "kindle" ? "KindleStore" : fallback;
}

function wireCategories(
  value: unknown,
  searchIndex: AmazonSearchIndex,
): {
  categories: string[];
  categoryDetails: AmazonCatalogItem["categoryDetails"];
} {
  if (!Array.isArray(value)) {
    return { categories: [], categoryDetails: [] };
  }

  const categoryDetails = value
    .map((candidate) => {
      if (typeof candidate === "string") {
        const name = candidate.trim();
        return name
          ? { id: name, name, path: [name], searchIndex }
          : null;
      }

      const record = asRecord(candidate);
      if (!record) return null;
      const name = text(record.name);
      if (!name) return null;
      return {
        id: text(record.id) || name,
        name,
        path: stringList(record.path).length ? stringList(record.path) : [name],
        searchIndex,
      };
    })
    .filter(
      (
        candidate,
      ): candidate is AmazonCatalogItem["categoryDetails"][number] =>
        candidate !== null,
    );

  return {
    categories: [...new Set(categoryDetails.map((category) => category.name))],
    categoryDetails,
  };
}

function wireOffer(
  value: unknown,
  context: WireContext,
): AmazonCurrentOffer | null {
  const record = asRecord(value);
  if (!record) return null;

  const priceAmount =
    finiteNumber(record.priceAmount) ?? finiteNumber(record.amount);
  const currency = text(record.currency).toUpperCase();
  const fetchedAt = text(record.fetchedAt) || context.fetchedAt;
  const expiresAt = text(record.expiresAt) || context.expiresAt || "";

  if (
    priceAmount === null ||
    priceAmount < 0 ||
    currency !== "BRL" ||
    !fetchedAt ||
    !expiresAt
  ) {
    return null;
  }

  const availability = text(record.availability);
  const normalizedAvailability = normalizeText(availability);
  const explicitAvailability =
    typeof record.isAvailable === "boolean"
      ? record.isAvailable
      : !normalizedAvailability.includes("indisponivel");

  return {
    priceAmount,
    currency: "BRL",
    displayPrice:
      text(record.displayPrice) ||
      text(record.displayAmount) ||
      priceAmount.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
    savingsAmount: finiteNumber(record.savingsAmount),
    savingsPercentage: finiteNumber(record.savingsPercentage),
    isPrime:
      record.isPrime === true ||
      record.isPrimeExclusive === true,
    isAvailable: explicitAvailability,
    availability,
    seller: text(record.seller),
    condition: text(record.condition) || "Novo",
    promotion: nullableText(record.promotion) ?? nullableText(record.dealBadge),
    fetchedAt,
    expiresAt,
  };
}

function wireEditions(
  value: unknown,
  fallback: AmazonEdition,
  context: WireContext,
): AmazonEdition[] {
  if (!Array.isArray(value)) return [fallback];

  const editions = value
    .map((candidate): AmazonEdition | null => {
      const record = asRecord(candidate);
      if (!record) return null;
      const asin = text(record.asin).toUpperCase();
      const format = wireFormat(record.format);
      const detailPageUrl = text(record.detailPageUrl);
      if (!isValidAsin(asin) || !isAmazonUrl(detailPageUrl)) return null;

      return {
        asin,
        format,
        label: text(record.label) || formatLabel(format),
        detailPageUrl,
        imageUrl: text(record.imageUrl),
        offer: wireOffer(record.offer, context),
        fetchedAt: nullableText(record.fetchedAt) ?? context.fetchedAt,
        expiresAt: nullableText(record.expiresAt) ?? context.expiresAt,
      };
    })
    .filter((edition): edition is AmazonEdition => edition !== null);

  return editions.length ? editions : [fallback];
}

function normalizeWireItem(
  value: unknown,
  context: WireContext,
): AmazonCatalogItem | null {
  const record = asRecord(value);
  if (!record) return null;

  const asin = text(record.asin).toUpperCase();
  const title = text(record.title);
  const detailPageUrl = text(record.detailPageUrl);
  if (!isValidAsin(asin) || !title || !isAmazonUrl(detailPageUrl)) return null;

  const catalogSource =
    record.source === "sitestripe" ? "sitestripe" : "creators";
  const format = wireFormat(record.format);
  const searchIndex = wireSearchIndex(
    record.searchIndex,
    format,
    context.searchIndex,
  );
  const { categories, categoryDetails } = wireCategories(
    record.categories,
    searchIndex,
  );
  const languages = stringList(record.languages);
  const language =
    text(record.language) || languages[0] || (searchIndex === "Books" ? "pt" : "");
  const fetchedAt = nullableText(record.fetchedAt) ?? context.fetchedAt;
  const expiresAt = nullableText(record.expiresAt) ?? context.expiresAt;
  const offerContext = {
    ...context,
    fetchedAt: fetchedAt || context.fetchedAt,
    expiresAt,
  };
  const offer = wireOffer(record.offer, offerContext);
  const imageUrl = text(record.imageUrl);
  const selfEdition: AmazonEdition = {
    asin,
    format,
    label: formatLabel(format),
    detailPageUrl,
    imageUrl,
    offer,
    fetchedAt,
    expiresAt,
  };
  const salesRank = positiveInteger(record.salesRank);

  return {
    asin,
    parentAsin: nullableText(record.parentAsin),
    source: "amazon.com.br",
    catalogSource,
    title,
    subtitle: text(record.subtitle),
    authors: stringList(record.authors),
    publisher: text(record.publisher),
    publishedDate: text(record.publishedDate) || text(record.publicationDate),
    pageCount: positiveInteger(record.pageCount),
    language,
    description: text(record.description),
    languages: languages.length ? languages : language ? [language] : [],
    categories,
    categoryDetails,
    isbn10: text(record.isbn10) || (searchIndex === "Books" ? asin : ""),
    isbn13: text(record.isbn13),
    imageUrl,
    detailPageUrl,
    searchIndex,
    format,
    salesRank,
    salesRankCategory:
      text(record.salesRankCategory) || categoryDetails[0]?.name || "",
    salesRankFetchedAt:
      nullableText(record.salesRankFetchedAt) ??
      (salesRank === null ? null : fetchedAt),
    salesRankExpiresAt:
      nullableText(record.salesRankExpiresAt) ??
      (salesRank === null ? null : context.expiresAt),
    featured: record.featured === true,
    editions: wireEditions(record.editions, selfEdition, offerContext),
    offer,
    fetchedAt,
    expiresAt,
  };
}

function normalizeResult(
  value: unknown,
  request: CatalogRequest,
  fallbackMode: AmazonCatalogMode,
  now: number,
): AmazonCatalogResult {
  const record = asRecord(value);
  if (!record) {
    throw new AmazonCatalogError("A Amazon retornou uma resposta inválida.", {
      code: "invalid_response",
    });
  }

  const fetchedAt = text(record.fetchedAt) || new Date(now).toISOString();
  const expiresAt = nullableText(record.expiresAt);
  const mode =
    record.mode === "disabled" ||
    record.mode === "sitestripe" ||
    record.mode === "creators"
      ? record.mode
      : fallbackMode;
  const context: WireContext = {
    fetchedAt,
    expiresAt,
    searchIndex: request.searchIndex ?? "Books",
  };
  const rawItems = Array.isArray(record.items) ? record.items : [];
  const items = rawItems
    .map((item) => normalizeWireItem(item, context))
    .map((item) => (item ? sanitizeAmazonCatalogItem(item, now) : null))
    .filter((item): item is AmazonCatalogItem => item !== null);

  return {
    operation: request.operation,
    mode,
    items,
    fetchedAt,
    expiresAt,
    source: "amazon.com.br",
  };
}

async function catalogHttpError(response: Response): Promise<AmazonCatalogError> {
  let code = "amazon_catalog_request_failed";
  let message =
    response.status === 429
      ? "A Amazon atingiu o limite temporário. Tente novamente em instantes."
      : "Não foi possível consultar a Amazon agora.";
  let retryAfterSeconds: number | null = null;

  try {
    const payload = asRecord(await response.json());
    const error = asRecord(payload?.error);
    code = text(error?.code) || code;
    message = text(error?.message) || message;
    retryAfterSeconds = finiteNumber(error?.retryAfterSeconds);
  } catch {
    const retryAfter = response.headers.get("Retry-After");
    retryAfterSeconds = retryAfter ? Number.parseInt(retryAfter, 10) : null;
  }

  return new AmazonCatalogError(message, {
    code,
    status: response.status,
    retryAfterSeconds:
      retryAfterSeconds !== null && Number.isFinite(retryAfterSeconds)
        ? retryAfterSeconds
        : null,
  });
}

function requestCacheExpiry(
  result: AmazonCatalogResult,
  now: number,
): number | null {
  const timestamps: number[] = [];
  const collect = (value: string | null | undefined) => {
    if (!value) return;
    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp) && timestamp > now) timestamps.push(timestamp);
  };

  collect(result.expiresAt);
  for (const item of result.items) {
    collect(item.expiresAt);
    collect(item.salesRankExpiresAt);
    collect(item.offer?.expiresAt);
    for (const edition of item.editions) {
      collect(edition.expiresAt);
      collect(edition.offer?.expiresAt);
    }
  }

  return timestamps.length ? Math.min(...timestamps) : null;
}

function validatedSearchRequest(params: AmazonSearchParams): CatalogRequest {
  const query = params.query.trim();
  if (!query) {
    throw new AmazonCatalogError("Digite um título, autor ou ISBN para buscar.", {
      code: "invalid_query",
    });
  }

  const page = params.page ?? 1;
  if (!Number.isInteger(page) || page < 1 || page > 10) {
    throw new AmazonCatalogError("A página da busca deve estar entre 1 e 10.", {
      code: "invalid_page",
    });
  }

  return {
    operation: "search",
    query,
    searchIndex: params.searchIndex ?? "Books",
    page,
    ...(params.category?.trim() ? { category: params.category.trim() } : {}),
  };
}

function validatedItemsRequest(asins: string[]): CatalogRequest {
  const normalized = [
    ...new Set(asins.map((asin) => asin.trim().toUpperCase())),
  ];
  if (
    normalized.length < 1 ||
    normalized.length > 10 ||
    normalized.some((asin) => !isValidAsin(asin))
  ) {
    throw new AmazonCatalogError(
      "Informe de 1 a 10 ASINs válidos para consultar.",
      { code: "invalid_asins" },
    );
  }
  return { operation: "items", asins: normalized };
}

function validatedVariationsRequest(asin: string): CatalogRequest {
  const normalized = asin.trim().toUpperCase();
  if (!isValidAsin(normalized)) {
    throw new AmazonCatalogError("O ASIN informado é inválido.", {
      code: "invalid_asin",
    });
  }
  return { operation: "variations", asin: normalized };
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function localCatalogResult(
  operation: AmazonCatalogOperation,
  mode: AmazonCatalogMode,
  items: AmazonCatalogItem[],
  now: number,
): AmazonCatalogResult {
  return {
    operation,
    mode,
    items: items
      .map((item) => sanitizeAmazonCatalogItem(item, now))
      .filter((item): item is AmazonCatalogItem => item !== null),
    fetchedAt: new Date(now).toISOString(),
    expiresAt: null,
    source: "amazon.com.br",
  };
}

export function createAmazonCatalogClient(
  options: AmazonCatalogClientOptions,
): AmazonCatalogClient {
  const now = options.now ?? Date.now;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const bootstrapItems = options.bootstrapItems ?? [];
  const cache = new Map<string, CacheEntry>();
  const inFlight = new Map<string, Promise<AmazonCatalogResult>>();

  const localRequest = (request: CatalogRequest): AmazonCatalogResult => {
    const timestamp = now();
    if (options.mode === "disabled") {
      return localCatalogResult(
        request.operation,
        options.mode,
        [],
        timestamp,
      );
    }

    if (request.operation === "items") {
      const asinSet = new Set(request.asins);
      return localCatalogResult(
        request.operation,
        options.mode,
        bootstrapItems.filter((item) => asinSet.has(item.asin)),
        timestamp,
      );
    }

    if (request.operation === "variations") {
      const matches = bootstrapItems.filter(
        (item) =>
          item.asin === request.asin ||
          item.parentAsin === request.asin ||
          item.editions.some((edition) => edition.asin === request.asin),
      );
      return localCatalogResult(
        request.operation,
        options.mode,
        matches,
        timestamp,
      );
    }

    const normalizedQuery = normalizeText(request.query ?? "");
    const collectionQuery = ["livro", "livros", "todos", "*"].includes(
      normalizedQuery,
    );
    const searched = filterAmazonItems(
      bootstrapItems.filter(
        (item) => item.searchIndex === (request.searchIndex ?? "Books"),
      ),
      {
        query: collectionQuery ? undefined : request.query,
        category: request.category,
      },
      timestamp,
    );
    const offset = ((request.page ?? 1) - 1) * 10;
    return localCatalogResult(
      request.operation,
      options.mode,
      searched.slice(offset, offset + 10),
      timestamp,
    );
  };

  const remoteRequest = async (
    request: CatalogRequest,
  ): Promise<AmazonCatalogResult> => {
    if (!options.endpoint) {
      throw new AmazonCatalogError(
        "A URL pública da função amazon-catalog não foi configurada.",
        { code: "missing_endpoint" },
      );
    }
    if (typeof fetchImpl !== "function") {
      throw new AmazonCatalogError(
        "Este ambiente não oferece suporte a requisições de catálogo.",
        { code: "fetch_unavailable" },
      );
    }

    const key = JSON.stringify(request);
    const timestamp = now();
    const cached = cache.get(key);
    if (cached && cached.expiresAt > timestamp) {
      const freshItems = cached.result.items
        .map((item) => sanitizeAmazonCatalogItem(item, timestamp))
        .filter((item): item is AmazonCatalogItem => item !== null);
      return cloneResult({ ...cached.result, items: freshItems });
    }
    cache.delete(key);

    const pending = inFlight.get(key);
    if (pending) return cloneResult(await pending);

    const promise = (async () => {
      const response = await fetchImpl(options.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
          ...(options.resolveHeaders
            ? await options.resolveHeaders()
            : {}),
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw await catalogHttpError(response);

      const result = normalizeResult(
        await response.json(),
        request,
        options.mode,
        now(),
      );
      const expiresAt = requestCacheExpiry(result, now());
      if (expiresAt !== null) {
        cache.set(key, { result: cloneResult(result), expiresAt });
      }
      return result;
    })();

    inFlight.set(key, promise);
    try {
      return cloneResult(await promise);
    } finally {
      inFlight.delete(key);
    }
  };

  const execute = (request: CatalogRequest): Promise<AmazonCatalogResult> => {
    if (options.mode === "disabled") {
      return Promise.resolve(cloneResult(localRequest(request)));
    }
    if (!options.endpoint && options.bootstrapItems === undefined) {
      return Promise.reject(
        new AmazonCatalogError(
          "Cadastre links SiteStripe no servidor antes de habilitar a Livraria.",
          { code: "missing_endpoint" },
        ),
      );
    }
    return options.endpoint
      ? remoteRequest(request)
      : Promise.resolve(cloneResult(localRequest(request)));
  };

  return {
    mode: options.mode,
    search: async (params) => execute(validatedSearchRequest(params)),
    items: async (asins) => execute(validatedItemsRequest(asins)),
    variations: async (asin) => execute(validatedVariationsRequest(asin)),
    clearCache: () => cache.clear(),
  };
}

export function itemToLibraryBook(
  item: AmazonCatalogItem,
): AmazonLibraryBookDraft {
  return {
    source: "amazon",
    sourceId: item.asin,
    title: item.title,
    subtitle: item.subtitle,
    authors: [...item.authors],
    publisher: item.publisher,
    publishedDate: item.publishedDate,
    pageCount: item.pageCount,
    language: item.language || item.languages[0] || "pt",
    description: item.description,
    categories: [...item.categories],
    isbn10: item.isbn10,
    isbn13: item.isbn13,
    coverUrl: item.imageUrl,
  };
}

export const normalizeAmazonBook = itemToLibraryBook;

export function filterAmazonItems(
  items: AmazonCatalogItem[],
  filters: AmazonCatalogFilters,
  now: number = Date.now(),
): AmazonCatalogItem[] {
  const query = normalizeText(filters.query ?? "");
  const category = normalizeText(filters.category ?? "");
  const formats = new Set(filters.formats ?? []);

  return items
    .map((item) => sanitizeAmazonCatalogItem(item, now))
    .filter((item): item is AmazonCatalogItem => item !== null)
    .filter((item) => {
      const searchableText = normalizeText(
        [
          item.title,
          item.subtitle,
          ...item.authors,
          item.publisher,
          ...item.categories,
          item.isbn10,
          item.isbn13,
          item.asin,
        ].join(" "),
      );
      if (query && !searchableText.includes(query)) return false;

      if (
        category &&
        !item.categories.some((candidate) =>
          normalizeText(candidate).includes(category),
        ) &&
        !item.categoryDetails.some(
          (candidate) =>
            normalizeText(candidate.id) === category ||
            normalizeText(candidate.name).includes(category),
        )
      ) {
        return false;
      }

      if (
        formats.size &&
        !formats.has(item.format) &&
        !item.editions.some((edition) => formats.has(edition.format))
      ) {
        return false;
      }

      const offer = getFreshCurrentOffer(item, now);
      if (
        filters.minPrice !== undefined &&
        (!offer || offer.priceAmount < filters.minPrice)
      ) {
        return false;
      }
      if (
        filters.maxPrice !== undefined &&
        (!offer || offer.priceAmount > filters.maxPrice)
      ) {
        return false;
      }
      if (
        filters.minimumDiscountPercentage !== undefined &&
        (!offer ||
          (offer.savingsPercentage ?? 0) <
            filters.minimumDiscountPercentage)
      ) {
        return false;
      }
      if (filters.availableOnly && (!offer || !offer.isAvailable)) return false;

      return true;
    });
}

function compareNullableNumbers(
  left: number | null,
  right: number | null,
  direction: "asc" | "desc",
): number {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return direction === "asc" ? left - right : right - left;
}

export function sortAmazonItems(
  items: AmazonCatalogItem[],
  order: AmazonCatalogSort,
  now: number = Date.now(),
): AmazonCatalogItem[] {
  const sanitized = items
    .map((item) => sanitizeAmazonCatalogItem(item, now))
    .filter((item): item is AmazonCatalogItem => item !== null);
  const titleSort = (left: AmazonCatalogItem, right: AmazonCatalogItem) =>
    left.title.localeCompare(right.title, "pt-BR", { sensitivity: "base" });

  return [...sanitized].sort((left, right) => {
    const leftOffer = getFreshCurrentOffer(left, now);
    const rightOffer = getFreshCurrentOffer(right, now);
    let comparison = 0;

    switch (order) {
      case "sales_rank":
        comparison = compareNullableNumbers(
          left.salesRank,
          right.salesRank,
          "asc",
        );
        break;
      case "price_asc":
        comparison = compareNullableNumbers(
          leftOffer?.priceAmount ?? null,
          rightOffer?.priceAmount ?? null,
          "asc",
        );
        break;
      case "price_desc":
        comparison = compareNullableNumbers(
          leftOffer?.priceAmount ?? null,
          rightOffer?.priceAmount ?? null,
          "desc",
        );
        break;
      case "discount_desc":
        comparison = compareNullableNumbers(
          leftOffer?.savingsPercentage ?? null,
          rightOffer?.savingsPercentage ?? null,
          "desc",
        );
        break;
      case "featured":
        comparison = Number(right.featured) - Number(left.featured);
        if (comparison === 0) {
          comparison = compareNullableNumbers(
            left.salesRank,
            right.salesRank,
            "asc",
          );
        }
        break;
      case "title":
        return titleSort(left, right);
    }

    return comparison || titleSort(left, right);
  });
}

export function recommendAmazonItems(
  items: AmazonCatalogItem[],
  interests: AmazonRecommendationInterests,
  now: number = Date.now(),
): AmazonCatalogItem[] {
  const authors = new Set((interests.authors ?? []).map(normalizeText));
  const categories = new Set((interests.categories ?? []).map(normalizeText));
  const limit = Math.max(0, Math.floor(interests.limit ?? 8));
  const sanitized = items
    .map((item) => sanitizeAmazonCatalogItem(item, now))
    .filter((item): item is AmazonCatalogItem => item !== null);

  const score = (item: AmazonCatalogItem): number => {
    const authorMatches = item.authors.filter((author) =>
      authors.has(normalizeText(author)),
    ).length;
    const categoryMatches = item.categories.filter((candidate) =>
      categories.has(normalizeText(candidate)),
    ).length;
    const rankScore =
      item.salesRank === null ? 0 : Math.max(0, 2 - item.salesRank / 100_000);

    return (
      authorMatches * 6 +
      categoryMatches * 3 +
      (item.featured ? 2 : 0) +
      rankScore
    );
  };

  return [...sanitized]
    .sort(
      (left, right) =>
        score(right) - score(left) ||
        compareNullableNumbers(left.salesRank, right.salesRank, "asc") ||
        left.title.localeCompare(right.title, "pt-BR", {
          sensitivity: "base",
        }),
    )
    .slice(0, limit);
}
