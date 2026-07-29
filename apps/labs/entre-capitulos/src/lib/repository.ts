import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { shouldBlockProductionWithoutSupabase } from "./publicConfig";
import { demoState } from "../data/demo";
import {
  fixedLocalProfiles,
  fixedProfileDefinitions,
  getFixedProfileDefinition,
} from "../data/fixedProfiles";
import type {
  AmazonBookEditionLink,
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
  saveEntry(draft: LibraryEntryDraft, entryId?: string): Promise<SaveResult>;
  deleteEntry(id: string): Promise<void>;
}

const localStateKey = "entre-capitulos.state.v1";
const localDemoStateKey = "entre-capitulos.demo-state.v3";
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

function mergeAmazonEdition(
  editions: AmazonBookEditionLink[] | undefined,
  draft: LibraryEntryDraft,
): AmazonBookEditionLink[] | undefined {
  const incoming = amazonEditionsForDraft(draft);
  if (incoming.length === 0) return editions;

  const merged = new Map(
    (editions ?? []).map((edition) => [edition.asin, edition]),
  );
  for (const edition of incoming) merged.set(edition.asin, edition);
  return [...merged.values()];
}

function amazonEditionsForDraft(
  draft: LibraryEntryDraft,
): AmazonBookEditionLink[] {
  const incoming = [
    ...(draft.amazonEdition ? [draft.amazonEdition] : []),
    ...(draft.amazonEditions ?? []),
  ];
  return [
    ...new Map(incoming.map((edition) => [edition.asin, edition])).values(),
  ];
}

function withFixedLocalProfiles(state: PersistedState): PersistedState {
  const profiles = [...state.profiles];

  fixedLocalProfiles.forEach((fixedProfile) => {
    const fixedDefinition = getFixedProfileDefinition(fixedProfile);
    const existingIndex = profiles.findIndex(
      (profile) =>
        getFixedProfileDefinition(profile)?.key === fixedDefinition?.key,
    );

    if (existingIndex >= 0) {
      profiles[existingIndex] = {
        ...profiles[existingIndex],
        name: fixedProfile.name,
        initials: fixedProfile.initials,
        color: fixedProfile.color,
        archivedAt: null,
      };
      return;
    }

    profiles.push({
      ...fixedProfile,
      id: profiles.some((profile) => profile.id === fixedProfile.id)
        ? newId()
        : fixedProfile.id,
    });
  });

  return { ...state, profiles };
}

function matchesBook(left: Book, right: LibraryEntryDraft["book"]): boolean {
  if (
    left.catalogWorkKey &&
    right.catalogWorkKey &&
    left.catalogWorkKey === right.catalogWorkKey
  ) {
    return true;
  }

  if (
    left.source === right.source &&
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
    if (stored) {
      const state = withFixedLocalProfiles(
        JSON.parse(stored) as PersistedState,
      );
      this.writeState(state);
      return state;
    }

    const initial = this.isDemo
      ? clone(demoState)
      : { profiles: clone(fixedLocalProfiles), books: [], entries: [] };
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
      if (duplicate) {
        const amazonEditions = amazonEditionsForDraft(draft);
        if (amazonEditions.length > 0) {
          const linkedBook: Book = {
            ...book,
            amazonAsins: [
              ...new Set([
                ...(book.amazonAsins ?? []),
                ...amazonEditions.map((edition) => edition.asin),
              ]),
            ],
            amazonEditions: mergeAmazonEdition(
              book.amazonEditions,
              draft,
            ),
          };
          state.books = state.books.map((item) =>
            item.id === linkedBook.id ? linkedBook : item,
          );
          state.entries = state.entries.map((entry) =>
            entry.id === duplicate.id
              ? {
                  ...entry,
                  status: "want_to_read",
                  categories: draft.categories,
                  updatedAt: now(),
                }
              : entry,
          );
          this.writeState(state);
        }
        return { entryId: duplicate.id, duplicate: true };
      }
    }

    const draftAmazonEditions = amazonEditionsForDraft(draft);
    const amazonAsins =
      draftAmazonEditions.length > 0
        ? [
            ...new Set([
              ...(book?.amazonAsins ?? []),
              ...draftAmazonEditions.map((edition) => edition.asin),
            ]),
          ]
        : book?.amazonAsins;
    const preserveExistingMetadata =
      book !== undefined &&
      draftAmazonEditions.length > 0;
    const bookValue: Book = preserveExistingMetadata
      ? {
          ...(book as Book),
          amazonAsins,
          amazonEditions: mergeAmazonEdition(
            book?.amazonEditions,
            draft,
          ),
        }
      : {
          ...draft.book,
          id: book?.id ?? draft.book.id ?? newId(),
          amazonAsins,
          amazonEditions: mergeAmazonEdition(
            book?.amazonEditions,
            draft,
          ),
          title: draft.book.title.trim(),
          authors: draft.book.authors
            .map((author) => author.trim())
            .filter(Boolean),
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
  source: "google_books" | "open_library" | "manual" | "amazon";
  source_id: string | null;
  catalog_work_key: string | null;
  catalog_edition_key: string | null;
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

interface AmazonEditionRow {
  book_id: string;
  asin: string;
  parent_asin: string | null;
  format: AmazonBookEditionLink["format"];
  is_primary: boolean;
}

function mapBook(row: BookRow, editions: AmazonEditionRow[] = []): Book {
  const amazonAsins = editions
    .filter((edition) => edition.book_id === row.id)
    .sort((left, right) => Number(right.is_primary) - Number(left.is_primary))
    .map((edition) => edition.asin);

  return {
    id: row.id,
    source: row.source,
    sourceId: row.source_id,
    catalogWorkKey: row.catalog_work_key,
    catalogEditionKey: row.catalog_edition_key,
    amazonAsins:
      amazonAsins.length > 0
        ? amazonAsins
        : row.source === "amazon" && row.source_id
          ? [row.source_id]
          : [],
    amazonEditions: editions
      .filter((edition) => edition.book_id === row.id)
      .sort(
        (left, right) =>
          Number(right.is_primary) - Number(left.is_primary),
      )
      .map((edition) => ({
        asin: edition.asin,
        parentAsin: edition.parent_asin,
        format: edition.format,
      })),
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
    const [
      profilesResult,
      booksResult,
      entriesResult,
      ratingsResult,
      amazonEditionsResult,
    ] =
      await Promise.all([
        this.client.from("profiles").select("*").order("created_at"),
        this.client.from("books").select("*").order("created_at"),
        this.client.from("library_entries").select("*").order("updated_at", {
          ascending: false,
        }),
        this.client.from("rating_scores").select("*"),
        this.client
          .from("amazon_book_editions")
          .select("book_id, asin, parent_asin, format, is_primary"),
      ]);

    const error =
      profilesResult.error ??
      booksResult.error ??
      entriesResult.error ??
      ratingsResult.error ??
      amazonEditionsResult.error;
    if (error) throw new Error(error.message);

    let profileRows = (profilesResult.data ?? []) as ProfileRow[];
    profileRows = await Promise.all(
      profileRows.map(async (profile) => {
        const definition = getFixedProfileDefinition({
          name: profile.name,
        });
        if (!definition) return profile;

        const isCurrent =
          profile.name === definition.name &&
          profile.initials === definition.initials &&
          profile.color === definition.color &&
          profile.archived_at === null;
        if (isCurrent) return profile;

        const syncResult = await this.client
          .from("profiles")
          .update({
            name: definition.name,
            initials: definition.initials,
            color: definition.color,
            archived_at: null,
          })
          .eq("id", profile.id)
          .select("*")
          .single();
        if (syncResult.error) throw new Error(syncResult.error.message);
        return syncResult.data as ProfileRow;
      }),
    );

    const missingProfiles = fixedProfileDefinitions.filter(
      (definition) =>
        !profileRows.some(
          (profile) =>
            getFixedProfileDefinition({ name: profile.name })?.key ===
            definition.key,
        ),
    );

    if (missingProfiles.length > 0) {
      const ownerId = await this.userId();
      const createResult = await this.client
        .from("profiles")
        .insert(
          missingProfiles.map((profile) => ({
            owner_id: ownerId,
            name: profile.name,
            initials: profile.initials,
            color: profile.color,
          })),
        )
        .select("*");
      if (createResult.error) throw new Error(createResult.error.message);
      profileRows = [
        ...profileRows,
        ...((createResult.data ?? []) as ProfileRow[]),
      ];
    }

    const ratings = (ratingsResult.data ?? []) as RatingRow[];
    const amazonEditions =
      (amazonEditionsResult.data ?? []) as AmazonEditionRow[];
    return {
      profiles: profileRows.map(mapProfile),
      books: ((booksResult.data ?? []) as BookRow[]).map((book) =>
        mapBook(book, amazonEditions),
      ),
      entries: ((entriesResult.data ?? []) as EntryRow[]).map((entry) =>
        mapEntry(entry, ratings),
      ),
    };
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

    if (draft.catalogWorkKey) {
      const { data, error } = await this.client
        .from("books")
        .select("*")
        .eq("catalog_work_key", draft.catalogWorkKey)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (data) return data as BookRow;
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
      catalog_work_key: draft.book.catalogWorkKey ?? null,
      catalog_edition_key: draft.book.catalogEditionKey ?? null,
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
    const draftAmazonEditions = amazonEditionsForDraft(draft);
    let book: BookRow;
    if (existingBook && draftAmazonEditions.length > 0) {
      book = existingBook;
    } else {
      const bookResult = existingBook
        ? await this.client
            .from("books")
            .update(bookPayload)
            .eq("id", existingBook.id)
            .select("*")
            .single()
        : await this.client
            .from("books")
            .insert(bookPayload)
            .select("*")
            .single();
      if (bookResult.error) throw new Error(bookResult.error.message);
      book = bookResult.data as BookRow;
    }

    if (draftAmazonEditions.length > 0) {
      const editionsResult = await this.client
        .from("amazon_book_editions")
        .select("asin, parent_asin, format, is_primary")
        .eq("book_id", book.id);
      if (editionsResult.error) throw new Error(editionsResult.error.message);

      const editions =
        (editionsResult.data ?? []) as Pick<
          AmazonEditionRow,
          "asin" | "parent_asin" | "format" | "is_primary"
        >[];
      for (const amazonEdition of draftAmazonEditions) {
        const storedEdition = editions.find(
          (edition) => edition.asin === amazonEdition.asin,
        );
        if (!storedEdition) {
          const editionResult = await this.client
            .from("amazon_book_editions")
            .insert({
              owner_id: ownerId,
              book_id: book.id,
              asin: amazonEdition.asin,
              parent_asin: amazonEdition.parentAsin,
              format: amazonEdition.format,
              is_primary: editions.length === 0,
            });
          if (editionResult.error) throw new Error(editionResult.error.message);
          editions.push({
            asin: amazonEdition.asin,
            parent_asin: amazonEdition.parentAsin,
            format: amazonEdition.format,
            is_primary: editions.length === 0,
          });
        } else if (
          storedEdition.parent_asin !== amazonEdition.parentAsin ||
          storedEdition.format !== amazonEdition.format
        ) {
          const editionResult = await this.client
            .from("amazon_book_editions")
            .update({
              parent_asin: amazonEdition.parentAsin,
              format: amazonEdition.format,
            })
            .eq("book_id", book.id)
            .eq("asin", amazonEdition.asin);
          if (editionResult.error) throw new Error(editionResult.error.message);
        }
      }
    }

    if (!editingEntry) {
      const duplicateResult = await this.client
        .from("library_entries")
        .select("id")
        .eq("profile_id", draft.profileId)
        .eq("book_id", book.id)
        .maybeSingle();
      if (duplicateResult.error) throw new Error(duplicateResult.error.message);
      if (duplicateResult.data) {
        const duplicateId = (duplicateResult.data as { id: string }).id;
        if (draftAmazonEditions.length > 0) {
          const updateDuplicate = await this.client
            .from("library_entries")
            .update({
              status: "want_to_read",
              categories: draft.categories,
            })
            .eq("id", duplicateId);
          if (updateDuplicate.error) {
            throw new Error(updateDuplicate.error.message);
          }
        }
        return {
          entryId: duplicateId,
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

export const isDemoMode =
  new URLSearchParams(window.location.search).get("demo") === "1";

export const isProductionDataConfigurationBlocked =
  shouldBlockProductionWithoutSupabase({
    isProduction: import.meta.env.PROD,
    isDemoMode,
    isSupabaseConfigured,
  });

const supabaseClient =
  isSupabaseConfigured && !isDemoMode
    ? createClient(supabaseConfig.url, supabaseConfig.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null;

export async function amazonCatalogAuthHeaders(): Promise<
  Record<string, string>
> {
  if (!supabaseClient) return {};
  const { data } = await supabaseClient.auth.getSession();
  const accessToken = data.session?.access_token;
  return accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};
}

export const bookCatalogAuthHeaders = amazonCatalogAuthHeaders;

export const repository: AppRepository = isSupabaseConfigured && !isDemoMode
  ? new SupabaseRepository(
      supabaseClient!,
      supabaseConfig.householdEmail,
    )
  : new LocalRepository();
