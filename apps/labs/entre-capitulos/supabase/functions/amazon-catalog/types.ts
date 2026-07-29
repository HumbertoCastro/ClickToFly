export type AmazonCatalogMode = "disabled" | "sitestripe" | "creators";
export type AmazonOperation = "search" | "items" | "variations";
export type AmazonSearchIndex = "Books" | "KindleStore";
export type AmazonBookFormat =
  | "kindle"
  | "paperback"
  | "hardcover"
  | "audiobook"
  | "other";

export interface AmazonCatalogRequest {
  operation: AmazonOperation;
  query?: string;
  asins?: string[];
  asin?: string;
  searchIndex: AmazonSearchIndex;
  page: number;
  category?: string;
}

export interface AmazonCategory {
  id: string;
  name: string;
  salesRank: number | null;
}

export interface AmazonCurrentOffer {
  amount: number;
  currency: "BRL";
  displayAmount: string;
  savingBasisAmount: number | null;
  savingBasisDisplayAmount: string | null;
  savingsAmount: number | null;
  savingsPercentage: number | null;
  seller: string | null;
  availability: string | null;
  isAvailable: boolean;
  condition: string | null;
  isBuyBoxWinner: boolean;
  isPrimeExclusive: boolean;
  dealBadge: string | null;
  dealStartsAt: string | null;
  dealEndsAt: string | null;
  fetchedAt: string;
  expiresAt: string;
}

export interface AmazonVariationAttribute {
  name: string;
  value: string;
}

export interface AmazonCatalogItem {
  asin: string;
  parentAsin: string | null;
  title: string;
  authors: string[];
  publisher: string | null;
  publicationDate: string | null;
  languages: string[];
  pageCount: number | null;
  isbn10: string | null;
  isbn13: string | null;
  format: AmazonBookFormat;
  categories: AmazonCategory[];
  imageUrl: string | null;
  detailPageUrl: string;
  offer: AmazonCurrentOffer | null;
  salesRank: number | null;
  salesRankFetchedAt: string | null;
  salesRankExpiresAt: string | null;
  variationAttributes: AmazonVariationAttribute[];
  featured: boolean;
  source: "creators" | "sitestripe";
  fetchedAt: string;
  expiresAt: string | null;
}

export interface AmazonCatalogResponse {
  operation: AmazonOperation;
  mode: AmazonCatalogMode;
  items: AmazonCatalogItem[];
  fetchedAt: string;
  expiresAt: string | null;
  source: "amazon.com.br";
}

export interface RateLimitDecision {
  allowed: boolean;
  reason?: string;
  retryAfterSeconds?: number;
}

export interface AmazonCacheRow {
  cache_key: string;
  operation: AmazonOperation;
  metadata_payload: unknown[] | null;
  metadata_fetched_at: string | null;
  metadata_expires_at: string | null;
  commerce_payload: Record<string, unknown> | null;
  commerce_fetched_at: string | null;
  commerce_expires_at: string | null;
}

export interface CacheWrite {
  cache_key: string;
  operation: AmazonOperation;
  metadata_payload: AmazonCatalogItem[];
  metadata_fetched_at: string;
  metadata_expires_at: string;
  commerce_payload: Record<string, CommerceCacheValue>;
  commerce_fetched_at: string;
  commerce_expires_at: string;
}

export interface CommerceCacheValue {
  offer: AmazonCurrentOffer | null;
  salesRank: number | null;
  salesRankFetchedAt: string | null;
  salesRankExpiresAt: string | null;
}

export interface EditorialItemRow {
  asin: string;
  parent_asin: string | null;
  affiliate_url: string;
  title: string;
  authors: string[];
  publisher: string;
  publication_date: string;
  format: AmazonBookFormat;
  category: string;
  sort_order: number;
  updated_at: string;
  collection_id: string;
}

export interface EditorialCollectionRow {
  id: string;
  slug: string;
  title: string;
  search_index: AmazonSearchIndex;
  category: string;
  sort_order: number;
}
