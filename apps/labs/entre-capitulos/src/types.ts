export type BookStatus =
  | "want_to_read"
  | "reading"
  | "completed"
  | "abandoned";

export type RatingCriterionKey =
  | "writing_quality"
  | "engagement"
  | "theme"
  | "characters"
  | "plot"
  | "pacing"
  | "originality"
  | "world_building"
  | "emotional_impact"
  | "ending";

export type RatingScores = Partial<Record<RatingCriterionKey, number>>;

export interface Profile {
  id: string;
  name: string;
  initials: string;
  color: string;
  archivedAt: string | null;
  createdAt: string;
}

export type StoredAmazonBookFormat =
  | "kindle"
  | "paperback"
  | "hardcover"
  | "audiobook"
  | "other";

export interface AmazonBookEditionLink {
  asin: string;
  parentAsin: string | null;
  format: StoredAmazonBookFormat;
}

export type BookSource =
  | "google_books"
  | "open_library"
  | "manual"
  | "amazon";

export interface Book {
  id: string;
  source: BookSource;
  sourceId: string | null;
  catalogWorkKey?: string | null;
  catalogEditionKey?: string | null;
  amazonAsins?: string[];
  amazonEditions?: AmazonBookEditionLink[];
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
  createdAt: string;
}

export interface LibraryEntry {
  id: string;
  profileId: string;
  bookId: string;
  status: BookStatus;
  categories: string[];
  startedAt: string;
  endedAt: string;
  currentPage: number | null;
  review: string;
  storySummary: string;
  containsSpoilers: boolean;
  ratings: RatingScores;
  createdAt: string;
  updatedAt: string;
}

export interface BookSearchResult
  extends Omit<Book, "id" | "createdAt" | "source"> {
  source: "google_books" | "open_library";
}

export interface LibraryEntryDraft {
  profileId: string;
  book: Omit<Book, "id" | "createdAt"> & { id?: string };
  amazonEdition?: AmazonBookEditionLink;
  amazonEditions?: AmazonBookEditionLink[];
  status: BookStatus;
  categories: string[];
  startedAt: string;
  endedAt: string;
  currentPage: number | null;
  review: string;
  storySummary: string;
  containsSpoilers: boolean;
  ratings: RatingScores;
}

export interface JoinedEntry {
  entry: LibraryEntry;
  book: Book;
  profile: Profile;
  averageRating: number | null;
}

export type ProfileContext = string | null;

export interface PersistedState {
  profiles: Profile[];
  books: Book[];
  entries: LibraryEntry[];
}
