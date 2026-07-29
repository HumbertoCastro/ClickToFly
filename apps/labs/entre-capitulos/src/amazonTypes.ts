export type AmazonCatalogMode = "disabled" | "sitestripe" | "creators";

export type AmazonSearchIndex = "Books" | "KindleStore";

export type AmazonBookFormat =
  | "paperback"
  | "hardcover"
  | "kindle"
  | "unknown";

export type AmazonCatalogOperation = "search" | "items" | "variations";

export type AmazonCatalogSort =
  | "featured"
  | "sales_rank"
  | "price_asc"
  | "price_desc"
  | "discount_desc"
  | "title";

export interface AmazonCurrentOffer {
  priceAmount: number;
  currency: "BRL";
  displayPrice: string;
  savingsAmount: number | null;
  savingsPercentage: number | null;
  isPrime: boolean;
  isAvailable: boolean;
  availability: string;
  seller: string;
  condition: string;
  promotion: string | null;
  fetchedAt: string;
  expiresAt: string;
}

export interface AmazonEdition {
  asin: string;
  format: AmazonBookFormat;
  label: string;
  detailPageUrl: string;
  imageUrl: string;
  offer: AmazonCurrentOffer | null;
  fetchedAt?: string | null;
  expiresAt?: string | null;
}

export interface AmazonCategory {
  id: string;
  name: string;
  path: string[];
  searchIndex: AmazonSearchIndex;
}

export interface AmazonCatalogItem {
  asin: string;
  parentAsin: string | null;
  source: "amazon.com.br";
  catalogSource: "creators" | "sitestripe";
  title: string;
  subtitle: string;
  authors: string[];
  publisher: string;
  publishedDate: string;
  pageCount: number | null;
  language: string;
  description: string;
  languages: string[];
  categories: string[];
  categoryDetails: AmazonCategory[];
  isbn10: string;
  isbn13: string;
  imageUrl: string;
  detailPageUrl: string;
  searchIndex: AmazonSearchIndex;
  format: AmazonBookFormat;
  salesRank: number | null;
  salesRankCategory: string;
  salesRankFetchedAt: string | null;
  salesRankExpiresAt: string | null;
  featured: boolean;
  editions: AmazonEdition[];
  offer: AmazonCurrentOffer | null;
  fetchedAt: string | null;
  expiresAt: string | null;
}

export interface AmazonSearchParams {
  query: string;
  searchIndex?: AmazonSearchIndex;
  page?: number;
  category?: string;
}

export interface AmazonCatalogFilters {
  query?: string;
  category?: string;
  formats?: AmazonBookFormat[];
  minPrice?: number;
  maxPrice?: number;
  minimumDiscountPercentage?: number;
  availableOnly?: boolean;
}

export interface AmazonRecommendationInterests {
  authors?: string[];
  categories?: string[];
  limit?: number;
}

export interface AmazonCatalogResult {
  operation: AmazonCatalogOperation;
  mode: AmazonCatalogMode;
  items: AmazonCatalogItem[];
  fetchedAt: string;
  expiresAt: string | null;
  source: "amazon.com.br";
}

export interface AmazonLibraryBookDraft {
  source: "amazon";
  sourceId: string;
  title: string;
  subtitle: string;
  authors: string[];
  publisher: string;
  publishedDate: string;
  pageCount: number | null;
  language: string;
  description: string;
  categories: string[];
  isbn10: string;
  isbn13: string;
  coverUrl: string;
}
