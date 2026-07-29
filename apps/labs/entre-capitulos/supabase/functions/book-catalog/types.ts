export type CatalogOperation = "search" | "collection" | "work" | "resolve";
export type CatalogSort = "relevance" | "title" | "oldest" | "newest";
export type Retailer =
  | "amazon_br"
  | "estante_virtual"
  | "mercado_livre";

export interface SearchCatalogRequest {
  operation: "search";
  query: string;
  page: number;
  language?: string;
  subject?: string;
  sort?: CatalogSort;
}

export interface CollectionCatalogRequest {
  operation: "collection";
  slug: string;
}

export interface WorkCatalogRequest {
  operation: "work";
  workKey: string;
  editionPage: number;
}

export interface ResolveCatalogRequest {
  operation: "resolve";
  isbn?: string;
  legacyAsin?: string;
  title?: string;
  author?: string;
}

export type CatalogRequest =
  | SearchCatalogRequest
  | CollectionCatalogRequest
  | WorkCatalogRequest
  | ResolveCatalogRequest;

export interface CatalogWork {
  workKey: string;
  title: string;
  authors: string[];
  firstPublishedYear: number | null;
  description: string;
  subjects: string[];
  languages: string[];
  coverUrl: string;
  editionCount: number;
  editorialText?: string;
  badge?: string;
  featured?: boolean;
}

export interface CatalogEdition {
  editionKey: string;
  isbn10: string;
  isbn13: string;
  publisher: string;
  publishedDate: string;
  language: string;
  format: string;
  pageCount: number | null;
  coverUrl: string;
}

export interface RetailerDestination {
  retailer: Retailer;
  editionKey: string | null;
  url: string;
  kind: "search" | "direct";
  affiliate: boolean;
  label: string;
}

export interface CatalogCollection {
  slug: string;
  title: string;
  description: string;
  badge: string;
  featured: boolean;
}

export interface CatalogPagination {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface CatalogResponse {
  operation: CatalogOperation;
  works: CatalogWork[];
  work?: CatalogWork | null;
  editions?: CatalogEdition[];
  destinations?: RetailerDestination[];
  collection?: CatalogCollection;
  pagination?: CatalogPagination;
  fetchedAt: string;
  expiresAt: string;
  stale: boolean;
  source: "open_library";
}

export interface WorkCandidate extends CatalogWork {
  sourceWorkKeys: string[];
  identifiers: string[];
}

export interface IdentityRule {
  action: "merge" | "separate";
  workKeyA: string;
  workKeyB: string;
  editionKey: string | null;
  method: "manual" | "same_work_key" | "shared_isbn" | "exact" | "fuzzy";
  confidence: number;
}

export interface IdentityDecision {
  matches: boolean;
  method:
    | "manual_merge"
    | "manual_separate"
    | "same_work_key"
    | "shared_isbn"
    | "exact"
    | "fuzzy"
    | "volume_conflict"
    | "blocked_variant"
    | "language_conflict"
    | "different_author"
    | "below_threshold";
  confidence: number;
}

export interface CatalogWorkDetail {
  work: CatalogWork;
  editions: CatalogEdition[];
  totalEditions: number;
  memberWorkKeys?: string[];
}

export interface DirectRetailerLink {
  workKey: string;
  editionKey: string | null;
  retailer: Retailer;
  url: string;
  affiliate: boolean;
  label: string;
  legacyAsin: string | null;
}

export interface CatalogCollectionRecord {
  collection: CatalogCollection;
  works: CatalogWork[];
}

export interface RateLimitDecision {
  allowed: boolean;
  reason?: string;
  retryAfterSeconds?: number;
}

export interface BookCatalogCacheRow {
  cache_key: string;
  operation: CatalogOperation;
  request_descriptor: Record<string, unknown>;
  response_payload: CatalogResponse;
  fetched_at: string;
  expires_at: string;
  stale_until: string;
}

export interface BookCatalogCacheWrite {
  cache_key: string;
  operation: CatalogOperation;
  request_descriptor: Record<string, unknown>;
  response_payload: CatalogResponse;
  fetched_at: string;
  expires_at: string;
  stale_until: string;
}

export interface CatalogWorkRow {
  work_key: string;
  title: string;
  authors: string[];
  first_published_year: number | null;
  description: string;
  subjects: string[];
  languages: string[];
  edition_count: number;
  cover_url: string;
}

export interface CatalogEditionRow {
  edition_key: string;
  work_key: string;
  isbn_10: string;
  isbn_13: string;
  publisher: string;
  published_date: string;
  language: string;
  format: string;
  page_count: number | null;
  cover_url: string;
}

export interface CatalogCollectionRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  badge: string;
  featured: boolean;
  sort_order: number;
}

export interface CatalogCollectionItemRow {
  collection_id: string;
  work_key: string;
  edition_key: string | null;
  editorial_text: string;
  badge: string;
  featured: boolean;
  sort_order: number;
}

export interface CatalogRetailerLinkRow {
  work_key: string;
  edition_key: string | null;
  retailer: Retailer;
  url: string;
  affiliate: boolean;
  label: string;
  legacy_asin: string | null;
}

export interface CatalogIdentityRuleRow {
  action: "merge" | "separate";
  work_key_a: string;
  work_key_b: string;
  edition_key: string | null;
  method: IdentityRule["method"];
  confidence: number | string;
}
