import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowRight,
  CircleAlert,
  LoaderCircle,
  Search,
} from "lucide-react";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import type { CatalogEdition, CatalogWork } from "../catalogTypes";
import { PublicStoreShell } from "../components/PublicStoreShell";
import {
  useApp,
  type CatalogInterestTarget,
} from "../context/AppContext";
import { runtimeBookCatalogClient } from "../lib/catalogRuntime";
import { CatalogWorkDetailPage } from "../pages/CatalogWorkDetailPage";
import { OpenLibraryBookstorePage } from "../pages/OpenLibraryBookstorePage";
import { WhereToBuyPage } from "../pages/WhereToBuyPage";
import type { JoinedEntry } from "../types";

function activeProfileEntries(
  entries: JoinedEntry[],
  profileId: string | null,
) {
  return profileId
    ? entries.filter((item) => item.profile.id === profileId)
    : [];
}

function interestTarget(search: string): CatalogInterestTarget | undefined {
  const params = new URLSearchParams(search);
  const bookId = params.get("linkBookId")?.trim() ?? "";
  const entryId = params.get("linkEntryId")?.trim() ?? "";
  return bookId && entryId ? { bookId, entryId } : undefined;
}

function targetSearch(target?: CatalogInterestTarget) {
  if (!target) return "";
  return `?${new URLSearchParams({
    linkBookId: target.bookId,
    linkEntryId: target.entryId,
  }).toString()}`;
}

export function CatalogStorefrontLayout() {
  const { authenticated, activeProfile, joinedEntries } = useApp();
  const offerCount = activeProfileEntries(
    joinedEntries,
    activeProfile?.id ?? null,
  ).filter((item) => item.entry.status === "want_to_read").length;

  return (
    <PublicStoreShell
      accountHref={
        authenticated ? (activeProfile ? "/" : "/profiles") : "/login"
      }
      accountLabel={
        activeProfile
          ? `Estante de ${activeProfile.name}`
          : authenticated
            ? "Escolher perfil"
            : "Entrar"
      }
      offerCount={offerCount}
    >
      <Outlet />
    </PublicStoreShell>
  );
}

function useWantToRead(target?: CatalogInterestTarget) {
  const {
    authenticated,
    activeProfileId,
    saveCatalogInterest,
  } = useApp();
  const navigate = useNavigate();

  return useCallback(
    async (work: CatalogWork, edition?: CatalogEdition) => {
      const returnTo =
        `/livraria/obra/${encodeURIComponent(work.workKey)}${targetSearch(target)}`;
      if (!authenticated) {
        navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }
      if (!activeProfileId) {
        navigate(`/profiles?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }

      let representativeEdition = edition ?? null;
      if (!representativeEdition) {
        try {
          representativeEdition =
            (await runtimeBookCatalogClient.work(work.workKey)).editions[0] ??
            null;
        } catch {
          // The work itself is enough to save an interest.
        }
      }
      await saveCatalogInterest(work, representativeEdition, target);
      navigate(returnTo);
    },
    [
      activeProfileId,
      authenticated,
      navigate,
      saveCatalogInterest,
      target,
    ],
  );
}

export function CatalogBookstoreRoute() {
  const { activeProfileId, joinedEntries } = useApp();
  const location = useLocation();
  const target = useMemo(
    () => interestTarget(location.search),
    [location.search],
  );
  const onWantToRead = useWantToRead(target);
  const savedWorkKeys = useMemo(
    () => [
      ...new Set(
        activeProfileEntries(joinedEntries, activeProfileId)
          .map((item) => item.book.catalogWorkKey)
          .filter((key): key is string => Boolean(key)),
      ),
    ],
    [activeProfileId, joinedEntries],
  );

  return (
    <OpenLibraryBookstorePage
      client={runtimeBookCatalogClient}
      collectionSlug="em-destaque"
      onWantToRead={onWantToRead}
      savedWorkKeys={savedWorkKeys}
      detailSearch={targetSearch(target)}
    />
  );
}

export function CatalogWorkDetailRoute() {
  const { workKey = "" } = useParams();
  const { activeProfileId, joinedEntries } = useApp();
  const location = useLocation();
  const target = useMemo(
    () => interestTarget(location.search),
    [location.search],
  );
  const onWantToRead = useWantToRead(target);
  const isSaved = activeProfileEntries(joinedEntries, activeProfileId).some(
    (item) => item.book.catalogWorkKey === workKey,
  );

  return (
    <CatalogWorkDetailPage
      key={`${workKey}${location.search}`}
      client={runtimeBookCatalogClient}
      workKey={workKey}
      onWantToRead={onWantToRead}
      isSaved={isSaved}
    />
  );
}

export function LegacyCatalogRoute() {
  const { legacyAsin = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    let ignore = false;
    Promise.resolve()
      .then(() => {
        if (!ignore) {
          setResolving(true);
          setError("");
        }
        return runtimeBookCatalogClient.resolve({ legacyAsin });
      })
      .then((result) => {
        if (ignore) return;
        if (result.work) {
          navigate(
            `/livraria/obra/${encodeURIComponent(result.work.workKey)}${location.search}`,
            { replace: true },
          );
          return;
        }
        setResolving(false);
      })
      .catch((cause) => {
        if (ignore) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível resolver este endereço antigo.",
        );
        setResolving(false);
      });

    return () => {
      ignore = true;
    };
  }, [legacyAsin, location.search, navigate]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    navigate(`/livraria?q=${encodeURIComponent(value)}`);
  }

  if (resolving) {
    return (
      <section className="legacy-catalog-state" aria-busy="true">
        <LoaderCircle className="spin" size={28} aria-hidden="true" />
        <p className="eyebrow">ENDEREÇO ANTIGO</p>
        <h1>Localizando esta obra no novo catálogo…</h1>
      </section>
    );
  }

  return (
    <section className="legacy-catalog-state">
      <CircleAlert size={30} aria-hidden="true" />
      <p className="eyebrow">BUSCA ASSISTIDA</p>
      <h1>Este código antigo ainda não tem uma obra confirmada.</h1>
      <p>
        Nada se perdeu. Busque pelo título, autor ou ISBN e escolha o resultado
        correto para continuar.
      </p>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={submitSearch}>
        <Search size={19} aria-hidden="true" />
        <label className="sr-only" htmlFor="legacy-catalog-query">
          Buscar obra
        </label>
        <input
          id="legacy-catalog-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Título, autor ou ISBN"
          autoFocus
        />
        <button className="button button--primary" type="submit">
          Buscar <ArrowRight size={16} />
        </button>
      </form>
      <Link className="text-link" to="/livraria">
        Voltar às escolhas da casa
      </Link>
    </section>
  );
}

export function WhereToBuyRoute() {
  const {
    activeProfileId,
    joinedEntries,
    saveCatalogInterest,
  } = useApp();
  const entries = useMemo(
    () =>
      activeProfileEntries(joinedEntries, activeProfileId).filter(
        (item) => item.entry.status === "want_to_read",
      ),
    [activeProfileId, joinedEntries],
  );
  const onResolved = useCallback(
    async (
      entry: JoinedEntry,
      work: CatalogWork,
      edition: CatalogEdition | null,
    ) => {
      await saveCatalogInterest(work, edition, {
        bookId: entry.book.id,
        entryId: entry.entry.id,
      });
    },
    [saveCatalogInterest],
  );

  return <WhereToBuyPage entries={entries} onResolved={onResolved} />;
}
