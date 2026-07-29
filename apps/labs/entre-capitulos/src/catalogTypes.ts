export type CatalogOperation = "collection" | "search" | "work" | "resolve";

export type CatalogSort = "relevance" | "title" | "oldest" | "newest";

export type CatalogRetailer =
  | "amazon_br"
  | "estante_virtual"
  | "mercado_livre";

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
  retailer: CatalogRetailer;
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
  badge?: string;
  featured?: boolean;
}

export interface CatalogPagination {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface CatalogSearchParams {
  query: string;
  page?: number;
  language?: string;
  subject?: string;
  sort?: CatalogSort;
}

export interface CatalogResolveParams {
  isbn?: string;
  legacyAsin?: string;
  title?: string;
  author?: string;
}

interface CatalogResponseBase<TOperation extends CatalogOperation> {
  operation: TOperation;
  works: CatalogWork[];
  fetchedAt: string;
  expiresAt: string | null;
  stale: boolean;
  source: "open_library";
}

export interface CatalogCollectionResult
  extends CatalogResponseBase<"collection"> {
  collection: CatalogCollection;
  pagination: CatalogPagination;
}

export interface CatalogSearchResult extends CatalogResponseBase<"search"> {
  pagination: CatalogPagination;
}

export interface CatalogWorkResult extends CatalogResponseBase<"work"> {
  work: CatalogWork;
  editions: CatalogEdition[];
  destinations: RetailerDestination[];
  pagination: CatalogPagination;
}

export interface CatalogResolveResult extends CatalogResponseBase<"resolve"> {
  work: CatalogWork | null;
  editions: CatalogEdition[];
  destinations: RetailerDestination[];
}

export type CatalogResponse =
  | CatalogCollectionResult
  | CatalogSearchResult
  | CatalogWorkResult
  | CatalogResolveResult;

export interface CatalogIdentityCandidate {
  workKey?: string;
  title: string;
  authors: string[];
  isbns?: string[];
}

export type CatalogIdentityMethod =
  | "work_key"
  | "isbn"
  | "normalized_title"
  | "fuzzy_title"
  | "blocked"
  | "none";

export interface CatalogIdentityDecision {
  match: boolean;
  method: CatalogIdentityMethod;
  confidence: number;
  reason: string;
}

export interface RetailerSearchInput {
  editionKey?: string | null;
  isbn13?: string;
  isbn10?: string;
  title: string;
  authors?: string[];
}
