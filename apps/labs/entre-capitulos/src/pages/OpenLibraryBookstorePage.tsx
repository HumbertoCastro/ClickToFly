import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CircleAlert,
  Filter,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type {
  CatalogCollection,
  CatalogSort,
  CatalogWork,
} from "../catalogTypes";
import { CatalogWorkCard } from "../components/CatalogWorkCard";
import { OpenLibraryDisclosure } from "../components/OpenLibraryDisclosure";
import {
  createBookCatalogClient,
  getBookCatalogConfig,
} from "../lib/bookCatalog";

type CatalogClient = ReturnType<typeof createBookCatalogClient>;

export interface OpenLibraryBookstorePageProps {
  client?: CatalogClient;
  collectionSlug?: string;
  collectionTitle?: string;
  collectionDescription?: string;
  onWantToRead?: (work: CatalogWork) => Promise<void> | void;
  savedWorkKeys?: readonly string[];
  detailSearch?: string;
}

interface PaginationView {
  page: number;
  total: number;
  totalPages: number;
}

interface CatalogLoadState {
  requestKey: string;
  works: CatalogWork[];
  collection: CatalogCollection | null;
  pagination: PaginationView;
  stale: boolean;
  error: string;
}

const sortOptions: Array<{ value: CatalogSort; label: string }> = [
  { value: "relevance", label: "Mais relevantes" },
  { value: "title", label: "Título A–Z" },
  { value: "oldest", label: "Publicados primeiro" },
  { value: "newest", label: "Mais recentes primeiro" },
];

const emptyWorks: CatalogWork[] = [];

function positiveInteger(value: unknown, fallback: number) {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
    ? value
    : fallback;
}

function nonNegativeInteger(value: unknown, fallback: number) {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0
    ? value
    : fallback;
}

function paginationView(
  value: unknown,
  fallbackPage: number,
  visibleCount: number,
): PaginationView {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const page = positiveInteger(record.page, fallbackPage);
  const total = nonNegativeInteger(
    record.total ?? record.totalItems,
    visibleCount,
  );
  const totalPages = positiveInteger(
    record.totalPages,
    Math.max(1, Math.ceil(total / 18)),
  );
  return { page, total, totalPages };
}

function normalizedPage(value: string | null) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function normalizedSort(value: string | null): CatalogSort {
  return sortOptions.some((option) => option.value === value)
    ? (value as CatalogSort)
    : "relevance";
}

function labelFromLanguage(value: string) {
  const labels: Record<string, string> = {
    por: "Português",
    pt: "Português",
    eng: "Inglês",
    en: "Inglês",
    spa: "Espanhol",
    es: "Espanhol",
    fra: "Francês",
    fr: "Francês",
    ita: "Italiano",
    it: "Italiano",
    deu: "Alemão",
    ger: "Alemão",
    de: "Alemão",
  };
  return labels[value.toLocaleLowerCase("pt-BR")] ?? value.toUpperCase();
}

function CatalogSkeleton() {
  return (
    <div
      className="book-catalog-grid book-catalog-grid--loading"
      aria-label="Carregando catálogo de obras"
      aria-busy="true"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <div className="catalog-work-skeleton" key={index}>
          <span />
          <i />
          <i />
          <i />
        </div>
      ))}
    </div>
  );
}

function CatalogHeroBook({
  work,
  index,
}: {
  work: CatalogWork;
  index: number;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasCover = Boolean(work.coverUrl) && !imageFailed;

  return (
    <div
      className={`book-catalog-hero__book book-catalog-hero__book--${index + 1}${hasCover ? "" : " is-placeholder"}`}
    >
      {hasCover ? (
        <img
          src={work.coverUrl}
          alt=""
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span>{work.title}</span>
      )}
    </div>
  );
}

export function OpenLibraryBookstorePage({
  client,
  collectionSlug = "destaques",
  collectionTitle = "Escolhas para atravessar histórias",
  collectionDescription = "Uma seleção da casa para quem prefere escolher com tempo, contexto e muitas portas de entrada.",
  onWantToRead,
  savedWorkKeys = [],
  detailSearch = "",
}: OpenLibraryBookstorePageProps) {
  const [fallbackClient] = useState<CatalogClient | null>(() => {
    if (client) return null;
    try {
      return createBookCatalogClient(getBookCatalogConfig());
    } catch {
      return null;
    }
  });
  const catalogClient = client ?? fallbackClient;
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const page = normalizedPage(searchParams.get("page"));
  const language = searchParams.get("idioma")?.trim() ?? "";
  const subject = searchParams.get("assunto")?.trim() ?? "";
  const sort = normalizedSort(searchParams.get("ordem"));
  const [reloadKey, setReloadKey] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loadState, setLoadState] = useState<CatalogLoadState>({
    requestKey: "",
    works: [],
    collection: null,
    pagination: { page: 1, total: 0, totalPages: 1 },
    stale: false,
    error: "",
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const filterCloseRef = useRef<HTMLButtonElement>(null);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLElement>(null);
  const requestKey = query
    ? ["search", query, page, language, subject, sort, reloadKey].join(
        "\u0000",
      )
    : ["collection", collectionSlug, reloadKey].join("\u0000");
  const requestMatches = loadState.requestKey === requestKey;
  const loading = Boolean(catalogClient) && !requestMatches;
  const catalogWorks = requestMatches ? loadState.works : emptyWorks;
  const works = useMemo(
    () =>
      query
        ? catalogWorks
        : catalogWorks.filter(
            (work) =>
              (!language || work.languages.includes(language)) &&
              (!subject || work.subjects.includes(subject)),
          ),
    [catalogWorks, language, query, subject],
  );
  const pagination = requestMatches
    ? loadState.pagination
    : { page, total: 0, totalPages: 1 };
  const error = !catalogClient
    ? "O endereço público do catálogo ainda não foi configurado neste ambiente."
    : requestMatches
      ? loadState.error
      : "";
  const savedKeys = useMemo(() => new Set(savedWorkKeys), [savedWorkKeys]);

  useEffect(() => {
    let ignore = false;

    if (!catalogClient) return;

    const request = query
      ? catalogClient.search({
          query,
          page,
          language: language || undefined,
          subject: subject || undefined,
          sort,
        })
      : catalogClient.collection(collectionSlug);

    request
      .then((result) => {
        if (ignore) return;
        const resultWorks = result.works;
        setLoadState({
          requestKey,
          works: resultWorks,
          collection:
            result.operation === "collection" ? result.collection : null,
          pagination: paginationView(
            result.pagination,
            query ? page : 1,
            resultWorks.length,
          ),
          stale: result.stale,
          error: "",
        });
      })
      .catch((caught: unknown) => {
        if (ignore) return;
        setLoadState({
          requestKey,
          works: [],
          collection: null,
          pagination: { page, total: 0, totalPages: 1 },
          stale: false,
          error:
            caught instanceof Error && caught.message
              ? caught.message
              : "Não foi possível consultar o catálogo agora.",
        });
      });

    return () => {
      ignore = true;
    };
  }, [
    catalogClient,
    collectionSlug,
    language,
    page,
    query,
    requestKey,
    sort,
    subject,
  ]);

  useEffect(() => {
    if (!filtersOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    filterCloseRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFiltersOpen(false);
        filterTriggerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = filterPanelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [filtersOpen]);

  const languages = useMemo(
    () =>
      [...new Set(catalogWorks.flatMap((work) => work.languages))]
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right, "pt-BR")),
    [catalogWorks],
  );
  const subjects = useMemo(
    () =>
      [...new Set(catalogWorks.flatMap((work) => work.subjects))]
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right, "pt-BR"))
        .slice(0, 36),
    [catalogWorks],
  );
  const heroWorks = works.slice(0, 3);
  const activeFilterCount = Number(Boolean(language)) + Number(Boolean(subject));

  function updateParam(name: string, value: string, resetPage = true) {
    const nextParams = new URLSearchParams(searchParams);
    if (value) nextParams.set(name, value);
    else nextParams.delete(name);
    if (resetPage) nextParams.delete("page");
    setSearchParams(nextParams);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = searchInputRef.current?.value.trim() ?? "";
    const nextParams = new URLSearchParams(searchParams);

    if (nextQuery) nextParams.set("q", nextQuery);
    else nextParams.delete("q");
    nextParams.delete("page");
    setSearchParams(nextParams);
  }

  function resetFilters() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("idioma");
    nextParams.delete("assunto");
    nextParams.delete("page");
    setSearchParams(nextParams);
  }

  function goToPage(nextPage: number) {
    const safePage = Math.min(
      Math.max(1, nextPage),
      Math.max(1, pagination.totalPages),
    );
    const nextParams = new URLSearchParams(searchParams);
    if (safePage === 1) nextParams.delete("page");
    else nextParams.set("page", String(safePage));
    setSearchParams(nextParams);
    requestAnimationFrame(() =>
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      }),
    );
  }

  function renderFilterControls(mobile = false) {
    return (
      <>
        <label className="book-catalog-filter">
          <span>Idioma</span>
          <select
            id={mobile ? "catalog-language-mobile" : "catalog-language"}
            value={language}
            onChange={(event) => updateParam("idioma", event.target.value)}
          >
            <option value="">Todos os idiomas</option>
            {language && !languages.includes(language) && (
              <option value={language}>{labelFromLanguage(language)}</option>
            )}
            {languages.map((value) => (
              <option key={value} value={value}>
                {labelFromLanguage(value)}
              </option>
            ))}
          </select>
        </label>

        <label className="book-catalog-filter">
          <span>Assunto</span>
          <select
            id={mobile ? "catalog-subject-mobile" : "catalog-subject"}
            value={subject}
            onChange={(event) => updateParam("assunto", event.target.value)}
          >
            <option value="">Todos os assuntos</option>
            {subject && !subjects.includes(subject) && (
              <option value={subject}>{subject}</option>
            )}
            {subjects.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        {activeFilterCount > 0 && (
          <button
            className="book-catalog-filter__reset"
            type="button"
            onClick={resetFilters}
          >
            Limpar filtros
          </button>
        )}
      </>
    );
  }

  return (
    <div className="book-catalog-page">
      <section className="book-catalog-hero">
        <div className="book-catalog-hero__copy">
          <p className="catalog-eyebrow">LIVRARIA · CATÁLOGO ABERTO</p>
          <h1>
            Livros têm muitas formas de <em>chegar até você.</em>
          </h1>
          <p>
            Descubra a obra primeiro. Depois, compare suas edições e escolha em
            qual livraria continuar o caminho.
          </p>

          <form
            className="book-catalog-search"
            role="search"
            onSubmit={handleSearch}
          >
            <Search size={22} aria-hidden="true" />
            <label className="sr-only" htmlFor="book-catalog-search-input">
              Buscar livros, autores ou ISBN
            </label>
            <input
              key={query}
              ref={searchInputRef}
              id="book-catalog-search-input"
              defaultValue={query}
              placeholder="Título, autora, autor ou ISBN"
            />
            <button type="submit">Explorar catálogo</button>
          </form>

          <div className="book-catalog-hero__footnote">
            <span>
              <BookOpenCheck size={16} aria-hidden="true" />
              Obras agrupadas, edições preservadas
            </span>
            <a
              href="https://openlibrary.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Dados do Open Library
              <ArrowRight size={14} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="book-catalog-hero__visual" aria-hidden="true">
          <span className="book-catalog-hero__edition">
            CADERNO Nº 02 · ROTAS DE LEITURA
          </span>
          <div className="book-catalog-hero__orbit" />
          <div className="book-catalog-hero__books">
            {heroWorks.map((work, index) => (
              <CatalogHeroBook
                key={work.workKey}
                work={work}
                index={index}
              />
            ))}
            {heroWorks.length === 0 && (
              <>
                <div className="book-catalog-hero__book book-catalog-hero__book--1 is-placeholder">
                  <span>Obras que atravessam</span>
                </div>
                <div className="book-catalog-hero__book book-catalog-hero__book--2 is-placeholder">
                  <span>Edições que contam</span>
                </div>
                <div className="book-catalog-hero__book book-catalog-hero__book--3 is-placeholder">
                  <span>Novas descobertas</span>
                </div>
              </>
            )}
          </div>
          <blockquote>“A mesma história pode morar em muitas capas.”</blockquote>
        </div>
      </section>

      <section className="book-catalog-section" ref={resultsRef}>
        <header className="book-catalog-section__header">
          <div>
            <p className="catalog-eyebrow">
              {query
                ? `RESULTADOS PARA “${query}”`
                : loadState.collection?.badge || "CURADORIA DA CASA"}
            </p>
            <h2>
              {query
                ? "Obras encontradas"
                : loadState.collection?.title || collectionTitle}
            </h2>
            <p>
              {loading
                ? "Abrindo o catálogo…"
                : query
                  ? `${pagination.total} ${
                      pagination.total === 1
                        ? "obra encontrada"
                        : "obras encontradas"
                    }`
                  : loadState.collection?.description ||
                    collectionDescription}
            </p>
          </div>

          <div className="book-catalog-section__actions">
            <label className="book-catalog-sort">
              <span>Ordenar</span>
              <select
                value={sort}
                onChange={(event) =>
                  updateParam("ordem", event.target.value)
                }
                disabled={!query}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              ref={filterTriggerRef}
              className="book-catalog-filter-trigger"
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-haspopup="dialog"
            >
              <SlidersHorizontal size={17} aria-hidden="true" />
              Filtros
              {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
            </button>
          </div>
        </header>

        {loadState.stale && !loading && (
          <div className="book-catalog-stale" role="note">
            <Sparkles size={17} aria-hidden="true" />
            <p>
              <strong>Uma versão preservada do catálogo.</strong> O Open Library
              está temporariamente indisponível; estes dados podem ter sido
              consultados anteriormente.
            </p>
          </div>
        )}

        <div className="book-catalog-layout">
          <aside className="book-catalog-filters" aria-label="Filtros do catálogo">
            <div className="book-catalog-filters__heading">
              <Filter size={15} aria-hidden="true" />
              <span>Refine a descoberta</span>
              {activeFilterCount > 0 && <strong>{activeFilterCount}</strong>}
            </div>
            {renderFilterControls()}
            <OpenLibraryDisclosure compact />
          </aside>

          <div className="book-catalog-results" aria-live="polite">
            {loading ? (
              <CatalogSkeleton />
            ) : error ? (
              <div className="book-catalog-state book-catalog-state--error">
                <CircleAlert size={30} aria-hidden="true" />
                <p className="catalog-eyebrow">CONSULTA INTERROMPIDA</p>
                <h3>O catálogo não abriu desta vez.</h3>
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => setReloadKey((value) => value + 1)}
                >
                  <RefreshCcw size={17} aria-hidden="true" />
                  Tentar novamente
                </button>
              </div>
            ) : works.length === 0 ? (
              <div className="book-catalog-state">
                <Search size={30} aria-hidden="true" />
                <p className="catalog-eyebrow">NENHUMA OBRA NESTA ESTANTE</p>
                <h3>Vamos procurar por outro caminho.</h3>
                <p>
                  Experimente um título mais curto, o nome de quem escreveu ou
                  um ISBN sem espaços.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    resetFilters();
                    searchInputRef.current?.focus();
                  }}
                >
                  Ajustar a busca
                </button>
              </div>
            ) : (
              <>
                <div className="book-catalog-grid">
                  {works.map((work, index) => (
                    <CatalogWorkCard
                      key={work.workKey}
                      work={work}
                      onWantToRead={onWantToRead}
                      isSaved={savedKeys.has(work.workKey)}
                      priority={index < 4}
                      detailSearch={detailSearch}
                      editorialLabel={
                        !query
                          ? work.badge ||
                            (work.featured ? "Destaque" : "Da curadoria")
                          : undefined
                      }
                    />
                  ))}
                </div>

                {query && pagination.totalPages > 1 && (
                  <nav
                    className="book-catalog-pagination"
                    aria-label="Páginas do catálogo"
                  >
                    <button
                      type="button"
                      onClick={() => goToPage(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      <ArrowLeft size={16} aria-hidden="true" />
                      Anterior
                    </button>
                    <span>
                      Página <strong>{pagination.page}</strong> de{" "}
                      {pagination.totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => goToPage(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Próxima
                      <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {filtersOpen && (
        <div
          className="book-catalog-filter-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="book-catalog-filter-title"
        >
          <button
            className="book-catalog-filter-dialog__scrim"
            type="button"
            aria-label="Fechar filtros"
            onClick={() => {
              setFiltersOpen(false);
              filterTriggerRef.current?.focus();
            }}
          />
          <section
            ref={filterPanelRef}
            className="book-catalog-filter-dialog__panel"
          >
            <header>
              <div>
                <p className="catalog-eyebrow">CATÁLOGO</p>
                <h2 id="book-catalog-filter-title">Refinar descoberta</h2>
              </div>
              <button
                ref={filterCloseRef}
                type="button"
                aria-label="Fechar filtros"
                onClick={() => {
                  setFiltersOpen(false);
                  filterTriggerRef.current?.focus();
                }}
              >
                <X size={21} aria-hidden="true" />
              </button>
            </header>
            <div className="book-catalog-filter-dialog__content">
              {renderFilterControls(true)}
            </div>
            <footer>
              <button
                type="button"
                onClick={() => {
                  setFiltersOpen(false);
                  filterTriggerRef.current?.focus();
                }}
              >
                Ver resultados
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

export const BookCatalogPage = OpenLibraryBookstorePage;
