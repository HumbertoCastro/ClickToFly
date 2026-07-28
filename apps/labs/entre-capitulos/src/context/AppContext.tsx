import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { sortFixedProfiles } from "../data/fixedProfiles";
import { calculateAverageRating } from "../lib/rating";
import { repository } from "../lib/repository";
import type {
  JoinedEntry,
  LibraryEntryDraft,
  PersistedState,
  Profile,
  ProfileContext,
} from "../types";

interface AppContextValue {
  authenticated: boolean;
  loading: boolean;
  error: string;
  mode: "supabase" | "local";
  isDemo: boolean;
  profiles: Profile[];
  joinedEntries: JoinedEntry[];
  activeProfileId: ProfileContext;
  activeProfile: Profile | null;
  signIn(password: string): Promise<void>;
  signOut(): Promise<void>;
  selectProfile(profileId: ProfileContext): void;
  saveEntry(draft: LibraryEntryDraft, entryId?: string): Promise<{
    entryId: string;
    duplicate: boolean;
  }>;
  deleteEntry(id: string): Promise<void>;
  refresh(): Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);
const activeProfileKey = "entre-capitulos.active-profile.v1";

const emptyState: PersistedState = {
  profiles: [],
  books: [],
  entries: [],
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [state, setState] = useState<PersistedState>(emptyState);
  const [activeProfileId, setActiveProfileId] = useState<ProfileContext>(
    () => localStorage.getItem(activeProfileKey),
  );

  const refresh = useCallback(async () => {
    try {
      const nextState = await repository.loadState();
      setState(nextState);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível carregar a estante.",
      );
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void repository
      .getSession()
      .then(async (hasSession) => {
        if (!mounted) return;
        setAuthenticated(hasSession);
        if (hasSession) await refresh();
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [refresh]);

  const profiles = useMemo(
    () =>
      sortFixedProfiles(
        state.profiles.filter((profile) => !profile.archivedAt),
      ),
    [state.profiles],
  );
  const joinedEntries = useMemo(
    () =>
      state.entries
        .map((entry) => {
          const book = state.books.find((item) => item.id === entry.bookId);
          const profile = state.profiles.find(
            (item) => item.id === entry.profileId,
          );
          if (!book || !profile) return null;
          return {
            entry,
            book,
            profile,
            averageRating: calculateAverageRating(entry.ratings),
          };
        })
        .filter((item): item is JoinedEntry => item !== null)
        .sort(
          (left, right) =>
            new Date(right.entry.updatedAt).getTime() -
            new Date(left.entry.updatedAt).getTime(),
        ),
    [state],
  );

  const activeProfile =
    profiles.find((profile) => profile.id === activeProfileId) ?? null;

  async function signIn(password: string) {
    setLoading(true);
    setError("");
    try {
      await repository.signIn(password);
      setAuthenticated(true);
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await repository.signOut();
    setAuthenticated(false);
    setState(emptyState);
    setActiveProfileId(null);
    localStorage.removeItem(activeProfileKey);
  }

  function selectProfile(profileId: ProfileContext) {
    setActiveProfileId(profileId);
    if (profileId) localStorage.setItem(activeProfileKey, profileId);
    else localStorage.removeItem(activeProfileKey);
  }

  async function saveEntry(draft: LibraryEntryDraft, entryId?: string) {
    const result = await repository.saveEntry(draft, entryId);
    await refresh();
    return result;
  }

  async function deleteEntry(id: string) {
    await repository.deleteEntry(id);
    await refresh();
  }

  return (
    <AppContext.Provider
      value={{
        authenticated,
        loading,
        error,
        mode: repository.mode,
        isDemo: repository.isDemo,
        profiles,
        joinedEntries,
        activeProfileId,
        activeProfile,
        signIn,
        signOut,
        selectProfile,
        saveEntry,
        deleteEntry,
        refresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// The provider and its hook intentionally share this module.
// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp precisa estar dentro de AppProvider.");
  return context;
}
