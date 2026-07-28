import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { demoState } from "../data/demo";
import type {
  Book,
  LibraryEntry,
  LibraryEntryDraft,
  PersistedState,
  Profile,
  RatingCriterionKey,
  RatingScores,
} from "../types";

export interface SaveResult {
  entryId: string;
  duplicate: boolean;
}

export interface AppRepository {
  readonly mode: "supabase" | "local";
  readonly isDemo: boolean;
  getSession(): Promise<boolean>;
  signIn(password: string): Promise<void>;
  signOut(): Promise<void>;
  loadState(): Promise<PersistedState>;
  saveProfile(input: Pick<Profile, "name" | "initials" | "color">, id?: string): Promise<Profile>;
  archiveProfile(id: string, archived: boolean): Promise<void>;
  saveEntry(draft: LibraryEntryDraft, entryId?: string): Promise<SaveResult>;
  deleteEntry(id: string): Promise<void>;
}

const localStateKey = "entre-capitulos.state.v1";
const localDemoStateKey = "entre-capitulos.demo-state.v1";
const localPasswordKey = "entre-capitulos.password.v1";
const localSessionKey = "entre-capitulos.session.v1";

function now(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

async function hashPassword(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function matchesBook(left: Book, right: LibraryEntryDraft["book"]): boolean {
  if (
    left.source === "google_books" &&
    right.source === "google_books" &&
    left.sourceId &&
    right.sourceId
  ) {
    return left.sourceId === right.sourceId;
  }

  if (left.isbn13 && right.isbn13) return left.isbn13 === right.isbn13;

  return (
    left.title.toLocaleLowerCase("pt-BR") ===
      right.title.toLocaleLowerCase("pt-BR") &&
    left.authors[0]?.toLocaleLowerCase("pt-BR") ===
      right.authors[0]?.toLocaleLowerCase("pt-BR")
  );
}

class LocalRepository implements AppRepository {
  readonly mode = "local" as const;
  readonly isDemo = new URLSearchParams(window.location.search).get("demo") === "1";

  private get storageKey(): string {
    return this.isDemo ? localDemoStateKey : localStateKey;
  }

  private readState(): PersistedState {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) return JSON.parse(stored) as PersistedState;

    const initial = this.isDemo
      ? clone(demoState)
      : { profiles: [], books: [], entries: [] };
    this.writeState(initial);
    return initial;
  }

  private writeState(state: PersistedState): void {
    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  async getSession(): Promise<boolean> {
    return this.isDemo || localStorage.getItem(localSessionKey) === "active";
  }

  async signIn(password: string): Promise<void> {
    if (this.isDemo) {
      localStorage.setItem(localSessionKey, "active");
      return;
    }

    if (password.length < 6) {
      throw new Error("Use uma senha da casa com pelo menos 6 caracteres.");
    }

    const hash = await hashPassword(password);
    const storedHash = localStorage.getItem(localPasswordKey);
    if (storedHash && storedHash !== hash) {
      throw new Error("Senha incorreta. Tente novamente.");
    }

    if (!storedHash) localStorage.setItem(localPasswordKey, hash);
    localStorage.setItem(localSessionKey, "active");
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(localSessionKey);
  }

  async loadState(): Promise<PersistedState> {
    return clone(this.readState());
  }

  async saveProfile(
    input: Pick<Profile, "name" | "initials" | "color">,
    id?: string,
  ): Promise<Profile> {
    const state = this.readState();
    const existing = id
      ? state.profiles.find((profile) => profile.id === id)
      : undefined;
    const profile: Profile = {
      id: existing?.id ?? newId(),
      name: input.name.trim(),
      initials: input.initials.trim().toUpperCase(),
      color: input.color,
      archivedAt: existing?.archivedAt ?? null,
      createdAt: existing?.createdAt ?? now(),
    };

    state.profiles = existing
      ? state.profiles.map((item) => (item.id === profile.id ? profile : item))
      : [...state.profiles, profile];
    this.writeState(state);
    return profile;
  }

  async archiveProfile(id: string, archived: boolean): Promise<void> {
    const state = this.readState();
    state.profiles = state.profiles.map((profile) =>
      profile.id === id
        ? { ...profile, archivedAt: archived ? now() : null }
        : profile,
    );
    this.writeState(state);
  }

  async saveEntry(
    draft: LibraryEntryDraft,
    entryId?: string,
  ): Promise<SaveResult> {
    const state = this.readState();
    const editingEntry = entryId
      ? state.entries.find((entry) => entry.id === entryId)
      : undefined;
    let book = editingEntry
      ? state.books.find((item) => item.id === editingEntry.bookId)
      : state.books.find((item) => matchesBook(item, draft.book));

    if (!editingEntry && book) {
      const duplicate = state.entries.find(
        (entry) =>
          entry.profileId === draft.profileId && entry.bookId === book?.id,
      );
      if (duplicate) return { entryId: duplicate.id, duplicate: true };
    }

    const bookValue: Book = {
      ...draft.book,
      id: book?.id ?? draft.book.id ?? newId(),
      title: draft.book.title.trim(),
      authors: draft.book.authors.map((author) => author.trim()).filter(Boolean),
      createdAt: book?.createdAt ?? now(),
    };
    book = bookValue;

    state.books = state.books.some((item) => item.id === bookValue.id)
      ? state.books.map((item) => (item.id === bookValue.id ? bookValue : item))
      : [...state.books, bookValue];

    const timestamp = now();
    const entry: LibraryEntry = {
      id: editingEntry?.id ?? newId(),
      profileId: draft.profileId,
      bookId: bookValue.id,
      status: draft.status,
      categories: draft.categories,
      startedAt: draft.startedAt,
      endedAt: draft.endedAt,
      currentPage: draft.currentPage,
      review: draft.review.trim(),
      storySummary: draft.storySummary.trim(),
      containsSpoilers: draft.containsSpoilers,
      ratings: draft.ratings,
      createdAt: editingEntry?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    state.entries = editingEntry
      ? state.entries.map((item) => (item.id === entry.id ? entry : item))
      : [...state.entries, entry];
    this.writeState(state);
    return { entryId: entry.id, duplicate: false };
  }

  async deleteEntry(id: string): Promise<void> {
    const state = this.readState();
    state.entries = state.entries.filter((entry) => entry.id !== id);
    this.writeState(state);
  }
}

interface ProfileRow {
  id: string;
  name: string;
  initials: string;
  color: string;
  archived_at: string | null;
  created_at: string;
}

interface BookRow {
  id: string;
  source: "google_books" | "manual";
  source_id: string | null;
  title: string;
  subtitle: string;
  authors: string[];
  publisher: string;
  published_date: string;
  page_count: number | null;
  language: string;
  description: string;
  categories: string[];
  isbn_10: string;
  isbn_13: string;
  cover_url: string;
  created_at: string;
}

interface EntryRow {
  id: string;
  profile_id: string;
  book_id: string;
  status: LibraryEntry["status"];
  categories: string[];
  started_at: string | null;
  ended_at: string | null;
  current_page: number | null;
  review: string;
  story_summary: string;
  contains_spoilers: boolean;
  created_at: string;
  updated_at: string;
}

interface RatingRow {
  entry_id: string;
  criterion: RatingCriterionKey;
  score: number;
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    color: row.color,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
  };
}

function mapBook(row: BookRow): Book {
  return {
    id: row.id,
    source: row.source,
    sourceId: row.source_id,
    title: row.title,
    subtitle: row.subtitle ?? "",
    authors: row.authors ?? [],
    publisher: row.publisher ?? "",
    publishedDate: row.published_date ?? "",
    pageCount: row.page_count,
    language: row.language ?? "",
    description: row.description ?? "",
    categories: row.categories ?? [],
    isbn10: row.isbn_10 ?? "",
    isbn13: row.isbn_13 ?? "",
    coverUrl: row.cover_url ?? "",
    createdAt: row.created_at,
  };
}

function mapEntry(row: EntryRow, ratings: RatingRow[]): LibraryEntry {
  const scores: RatingScores = {};
  ratings
    .filter((rating) => rating.entry_id === row.id)
    .forEach((rating) => {
      scores[rating.criterion] = rating.score;
    });

  return {
    id: row.id,
    profileId: row.profile_id,
    bookId: row.book_id,
    status: row.status,
    categories: row.categories ?? [],
    startedAt: row.started_at ?? "",
    endedAt: row.ended_at ?? "",
    currentPage: row.current_page,
    review: row.review ?? "",
    storySummary: row.story_summary ?? "",
    containsSpoilers: row.contains_spoilers,
    ratings: scores,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class SupabaseRepository implements AppRepository {
  readonly mode = "supabase" as const;
  readonly isDemo = false;

  constructor(
    private readonly client: SupabaseClient,
    private readonly householdEmail: string,
  ) {}

  private async userId(): Promise<string> {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (!user) throw new Error("Sua sessão expirou. Entre novamente.");
    return user.id;
  }

  async getSession(): Promise<boolean> {
    const {
      data: { session },
    } = await this.client.auth.getSession();
    return Boolean(session);
  }

  async signIn(password: string): Promise<void> {
    const { error } = await this.client.auth.signInWithPassword({
      email: this.householdEmail,
      password,
    });
    if (error) throw new Error("Senha incorreta. Tente novamente.");
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async loadState(): Promise<PersistedState> {
    const [profilesResult, booksResult, entriesResult, ratingsResult] =
      await Promise.all([
        this.client.from("profiles").select("*").order("created_at"),
        this.client.from("books").select("*").order("created_at"),
        this.client.from("library_entries").select("*").order("updated_at", {
          ascending: false,
        }),
        this.client.from("rating_scores").select("*"),
      ]);

    const error =
      profilesResult.error ??
      booksResult.error ??
      entriesResult.error ??
      ratingsResult.error;
    if (error) throw new Error(error.message);

    const ratings = (ratingsResult.data ?? []) as RatingRow[];
    return {
      profiles: ((profilesResult.data ?? []) as ProfileRow[]).map(mapProfile),
      books: ((booksResult.data ?? []) as BookRow[]).map(mapBook),
      entries: ((entriesResult.data ?? []) as EntryRow[]).map((entry) =>
        mapEntry(entry, ratings),
      ),
    };
  }

  async saveProfile(
    input: Pick<Profile, "name" | "initials" | "color">,
    id?: string,
  ): Promise<Profile> {
    const ownerId = await this.userId();
    const payload = {
      owner_id: ownerId,
      name: input.name.trim(),
      initials: input.initials.trim().toUpperCase(),
      color: input.color,
    };
    const query = id
      ? this.client.from("profiles").update(payload).eq("id", id)
      : this.client.from("profiles").insert(payload);
    const { data, error } = await query.select("*").single();
    if (error) throw new Error(error.message);
    return mapProfile(data as ProfileRow);
  }

  async archiveProfile(id: string, archived: boolean): Promise<void> {
    const { error } = await this.client
      .from("profiles")
      .update({ archived_at: archived ? now() : null })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  private async findBook(
    draft: LibraryEntryDraft["book"],
    editingBookId?: string,
  ): Promise<BookRow | null> {
    if (editingBookId) {
      const { data, error } = await this.client
        .from("books")
        .select("*")
        .eq("id", editingBookId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as BookRow | null;
    }

    if (draft.sourceId) {
      const { data, error } = await this.client
        .from("books")
        .select("*")
        .eq("source", draft.source)
        .eq("source_id", draft.sourceId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (data) return data as BookRow;
    }

    if (draft.isbn13) {
      const { data, error } = await this.client
        .from("books")
        .select("*")
        .eq("isbn_13", draft.isbn13)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (data) return data as BookRow;
    }

    return null;
  }

  async saveEntry(
    draft: LibraryEntryDraft,
    entryId?: string,
  ): Promise<SaveResult> {
    const ownerId = await this.userId();
    let editingEntry: EntryRow | null = null;
    if (entryId) {
      const result = await this.client
        .from("library_entries")
        .select("*")
        .eq("id", entryId)
        .single();
      if (result.error) throw new Error(result.error.message);
      editingEntry = result.data as EntryRow;
    }

    const existingBook = await this.findBook(
      draft.book,
      editingEntry?.book_id,
    );
    const bookPayload = {
      owner_id: ownerId,
      source: draft.book.source,
      source_id: draft.book.sourceId,
      title: draft.book.title.trim(),
      subtitle: draft.book.subtitle.trim(),
      authors: draft.book.authors.map((author) => author.trim()).filter(Boolean),
      publisher: draft.book.publisher.trim(),
      published_date: draft.book.publishedDate.trim(),
      page_count: draft.book.pageCount,
      language: draft.book.language.trim(),
      description: draft.book.description.trim(),
      categories: draft.book.categories,
      isbn_10: draft.book.isbn10.trim(),
      isbn_13: draft.book.isbn13.trim(),
      cover_url: draft.book.coverUrl.trim(),
    };
    const bookResult = existingBook
      ? await this.client
          .from("books")
          .update(bookPayload)
          .eq("id", existingBook.id)
          .select("*")
          .single()
      : await this.client.from("books").insert(bookPayload).select("*").single();
    if (bookResult.error) throw new Error(bookResult.error.message);
    const book = bookResult.data as BookRow;

    if (!editingEntry) {
      const duplicateResult = await this.client
        .from("library_entries")
        .select("id")
        .eq("profile_id", draft.profileId)
        .eq("book_id", book.id)
        .maybeSingle();
      if (duplicateResult.error) throw new Error(duplicateResult.error.message);
      if (duplicateResult.data) {
        return {
          entryId: (duplicateResult.data as { id: string }).id,
          duplicate: true,
        };
      }
    }

    const entryPayload = {
      owner_id: ownerId,
      profile_id: draft.profileId,
      book_id: book.id,
      status: draft.status,
      categories: draft.categories,
      started_at: draft.startedAt || null,
      ended_at: draft.endedAt || null,
      current_page: draft.currentPage,
      review: draft.review.trim(),
      story_summary: draft.storySummary.trim(),
      contains_spoilers: draft.containsSpoilers,
    };
    const entryResult = editingEntry
      ? await this.client
          .from("library_entries")
          .update(entryPayload)
          .eq("id", editingEntry.id)
          .select("*")
          .single()
      : await this.client
          .from("library_entries")
          .insert(entryPayload)
          .select("*")
          .single();
    if (entryResult.error) throw new Error(entryResult.error.message);
    const savedEntry = entryResult.data as EntryRow;

    const deleteRatings = await this.client
      .from("rating_scores")
      .delete()
      .eq("entry_id", savedEntry.id);
    if (deleteRatings.error) throw new Error(deleteRatings.error.message);

    const ratingRows = Object.entries(draft.ratings)
      .filter((entry): entry is [RatingCriterionKey, number] =>
        Number.isInteger(entry[1]),
      )
      .map(([criterion, score]) => ({
        owner_id: ownerId,
        entry_id: savedEntry.id,
        criterion,
        score,
      }));
    if (ratingRows.length > 0) {
      const insertRatings = await this.client
        .from("rating_scores")
        .insert(ratingRows);
      if (insertRatings.error) throw new Error(insertRatings.error.message);
    }

    return { entryId: savedEntry.id, duplicate: false };
  }

  async deleteEntry(id: string): Promise<void> {
    const { error } = await this.client
      .from("library_entries")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}

export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL?.trim() ?? "",
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "",
  householdEmail: import.meta.env.VITE_HOUSEHOLD_EMAIL?.trim() ?? "",
};

export const isSupabaseConfigured = Boolean(
  supabaseConfig.url &&
    supabaseConfig.anonKey &&
    supabaseConfig.householdEmail,
);

const isDemoMode =
  new URLSearchParams(window.location.search).get("demo") === "1";

export const repository: AppRepository = isSupabaseConfigured && !isDemoMode
  ? new SupabaseRepository(
      createClient(supabaseConfig.url, supabaseConfig.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
      }),
      supabaseConfig.householdEmail,
    )
  : new LocalRepository();
