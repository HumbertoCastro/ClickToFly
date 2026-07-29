import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookmarkPlus,
  BookOpen,
  CalendarDays,
  Check,
  CircleAlert,
  FileText,
  Languages,
  Library,
  RefreshCcw,
} from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type {
  CatalogEdition,
  CatalogWork,
  RetailerDestination,
} from "../catalogTypes";
import { OpenLibraryDisclosure } from "../components/OpenLibraryDisclosure";
import { RetailerDestinations } from "../components/RetailerDestinations";
import {
  createBookCatalogClient,
  getBookCatalogConfig,
} from "../lib/bookCatalog";

type CatalogClient = ReturnType<typeof createBookCatalogClient>;

export interface CatalogWorkDetailPageProps {
  client?: CatalogClient;
  workKey?: string;
  onWantToRead?: (
    work: CatalogWork,
    representativeEdition?: CatalogEdition,
  ) => Promise<void> | void;
  isSaved?: boolean;
}

interface PaginationView {
  page: number;
  total: number;
  totalPages: number;
}

interface DetailLoadState {
  requestKey: string;
  work: CatalogWork | null;
  editions: CatalogEdition[];
  destinations: RetailerDestination[];
  pagination: PaginationView;
  stale: boolean;
  error: string;
}

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
  return {
    page,
    total,
    totalPages: positiveInteger(
      record.totalPages,
      Math.max(1, Math.ceil(total / 12)),
    ),
  };
}

function normalizedPage(value: string | null) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function languageLabel(value: string) {
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

function formatLabel(value: string) {
  const normalized = value.toLocaleLowerCase("pt-BR");
  const labels: Record<string, string> = {
    paperback: "Brochura",
    hardcover: "Capa dura",
    ebook: "Livro digital",
    kindle: "Livro digital",
    audiobook: "Audiolivro",
    audio: "Audiolivro",
    mass_market_paperback: "Edição de bolso",
    pocket: "Edição de bolso",
    unknown: "Formato não informado",
  };
  return labels[normalized] ?? value;
}

function publicationLabel(value: string) {
  if (!value) return "Data não informada";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    new Date(`${value}T12:00:00`),
  );
}

function DetailSkeleton() {
  return (
    <div
      className="catalog-work-detail catalog-work-detail--loading"
      aria-busy="true"
    >
      <span className="catalog-detail-skeleton catalog-detail-skeleton--cover" />
      <div>
        <span className="catalog-detail-skeleton catalog-detail-skeleton--eyebrow" />
        <span className="catalog-detail-skeleton catalog-detail-skeleton--title" />
        <span className="catalog-detail-skeleton catalog-detail-skeleton--copy" />
        <span className="catalog-detail-skeleton catalog-detail-skeleton--copy" />
      </div>
      <span className="sr-only">Abrindo os detalhes da obra</span>
    </div>
  );
}

interface EditionCardProps {
  edition: CatalogEdition;
  work: CatalogWork;
  destinations: readonly RetailerDestination[];
  priority?: boolean;
}

function CatalogEditionCard({
  edition,
  work,
  destinations,
  priority = false,
}: EditionCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const identifiers = [edition.isbn13, edition.isbn10].filter(Boolean);
  const editionDestinations = destinations.filter(
    (destination) =>
      destination.editionKey === edition.editionKey ||
      destination.editionKey === null,
  );

  return (
    <article className="catalog-edition-card">
      <div className="catalog-edition-card__summary">
        <div className="catalog-edition-card__cover">
          {edition.coverUrl && !imageFailed ? (
            <img
              src={edition.coverUrl}
              alt={`Capa da edição ${edition.publisher || edition.editionKey} de ${work.title}`}
              loading={priority ? "eager" : "lazy"}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span aria-hidden="true">
              <BookOpen size={28} />
            </span>
          )}
        </div>

        <div className="catalog-edition-card__copy">
          <p className="catalog-edition-card__kicker">
            {edition.language
              ? languageLabel(edition.language)
              : "Idioma não informado"}
          </p>
          <h3>{edition.publisher || "Editora não informada"}</h3>
          <p>
            {formatLabel(edition.format)} ·{" "}
            {publicationLabel(edition.publishedDate)}
          </p>

          <dl className="catalog-edition-card__facts">
            {edition.pageCount ? (
              <div>
                <dt>Páginas</dt>
                <dd>{edition.pageCount}</dd>
              </div>
            ) : null}
            {identifiers.length > 0 ? (
              <div>
                <dt>ISBN</dt>
                <dd>{identifiers.join(" · ")}</dd>
              </div>
            ) : (
              <div>
                <dt>Identificador</dt>
                <dd>{edition.editionKey}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <RetailerDestinations
        destinations={editionDestinations}
        title="Encontrar esta edição"
        compact
      />
    </article>
  );
}

export function CatalogWorkDetailPage({
  client,
  workKey: providedWorkKey,
  onWantToRead,
  isSaved = false,
}: CatalogWorkDetailPageProps) {
  const [fallbackClient] = useState<CatalogClient | null>(() => {
    if (client) return null;
    try {
      return createBookCatalogClient(getBookCatalogConfig());
    } catch {
      return null;
    }
  });
  const catalogClient = client ?? fallbackClient;
  const params = useParams<{ workKey?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const workKey = (providedWorkKey ?? params.workKey ?? "").trim();
  const editionPage = normalizedPage(searchParams.get("edicoes"));
  const [reloadKey, setReloadKey] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedWorkKey, setSavedWorkKey] = useState(
    isSaved ? workKey : "",
  );
  const [saveError, setSaveError] = useState("");
  const [loadState, setLoadState] = useState<DetailLoadState>({
    requestKey: "",
    work: null,
    editions: [],
    destinations: [],
    pagination: { page: editionPage, total: 0, totalPages: 1 },
    stale: false,
    error: "",
  });
  const requestKey = `${workKey}\u0000${editionPage}\u0000${reloadKey}`;
  const requestMatches = loadState.requestKey === requestKey;
  const loading = Boolean(workKey && catalogClient) && !requestMatches;
  const work = requestMatches ? loadState.work : null;
  const detailError = !workKey
    ? "O endereço desta obra não contém um identificador válido."
    : !catalogClient
      ? "O endereço público do catálogo ainda não foi configurado neste ambiente."
      : requestMatches
        ? loadState.error
        : "";
  const saved = isSaved || savedWorkKey === workKey;

  useEffect(() => {
    if (!workKey || !catalogClient) return;

    let ignore = false;

    catalogClient
      .work(workKey, editionPage)
      .then((result) => {
        if (ignore) return;
        setLoadState({
          requestKey,
          work: result.work,
          editions: result.editions,
          destinations: result.destinations,
          pagination: paginationView(
            result.pagination,
            editionPage,
            result.editions.length,
          ),
          stale: result.stale,
          error: result.work
            ? ""
            : "Esta obra não foi localizada no catálogo.",
        });
      })
      .catch((caught: unknown) => {
        if (ignore) return;
        setLoadState({
          requestKey,
          work: null,
          editions: [],
          destinations: [],
          pagination: { page: editionPage, total: 0, totalPages: 1 },
          stale: false,
          error:
            caught instanceof Error && caught.message
              ? caught.message
              : "Não foi possível consultar esta obra agora.",
        });
      });

    return () => {
      ignore = true;
    };
  }, [catalogClient, editionPage, requestKey, workKey]);

  const languages = useMemo(
    () =>
      work
        ? [...new Set([...work.languages, ...loadState.editions.map((edition) => edition.language)])]
            .filter(Boolean)
            .map(languageLabel)
        : [],
    [loadState.editions, work],
  );
  const coverUrl =
    work?.coverUrl ||
    loadState.editions.find((edition) => edition.coverUrl)?.coverUrl ||
    "";
  const representativeEdition = loadState.editions[0];

  async function handleWantToRead() {
    if (!work || !onWantToRead || saving || saved) return;
    setSaving(true);
    setSaveError("");

    try {
      await onWantToRead(work, representativeEdition);
      setSavedWorkKey(work.workKey);
    } catch {
      setSaveError("Não foi possível guardar esta obra na sua lista.");
    } finally {
      setSaving(false);
    }
  }

  function goToEditionPage(nextPage: number) {
    const safePage = Math.min(
      Math.max(1, nextPage),
      Math.max(1, loadState.pagination.totalPages),
    );
    const nextParams = new URLSearchParams(searchParams);
    if (safePage === 1) nextParams.delete("edicoes");
    else nextParams.set("edicoes", String(safePage));
    setSearchParams(nextParams);
    requestAnimationFrame(() =>
      document
        .getElementById("catalog-editions")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  if (loading) return <DetailSkeleton />;

  if (!work) {
    return (
      <div className="catalog-work-detail">
        <Link className="catalog-detail-back" to="/livraria">
          <ArrowLeft size={17} aria-hidden="true" />
          Voltar para a livraria
        </Link>
        <section className="book-catalog-state book-catalog-state--error catalog-detail-error">
          <CircleAlert size={31} aria-hidden="true" />
          <p className="catalog-eyebrow">OBRA NÃO ENCONTRADA</p>
          <h1>Esta história não abriu por aqui.</h1>
          <p>
            {detailError ||
              "O registro pode ter mudado ou ainda não fazer parte do catálogo."}
          </p>
          <div>
            {workKey && (
              <button
                type="button"
                onClick={() => setReloadKey((value) => value + 1)}
              >
                <RefreshCcw size={17} aria-hidden="true" />
                Consultar novamente
              </button>
            )}
            <Link to="/livraria">Explorar outras obras</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="catalog-work-detail">
      <nav className="catalog-detail-breadcrumb" aria-label="Caminho da página">
        <Link to="/livraria">Livraria</Link>
        <span aria-hidden="true">/</span>
        <span>{work.title}</span>
      </nav>

      {loadState.stale && (
        <div className="book-catalog-stale" role="note">
          <RefreshCcw size={16} aria-hidden="true" />
          <p>
            Exibindo os últimos dados preservados desta obra enquanto o catálogo
            aberto se reconecta.
          </p>
        </div>
      )}

      <section className="catalog-detail-hero">
        <div className="catalog-detail-cover">
          <span className="catalog-detail-cover__index">
            OBRA · {work.workKey}
          </span>
          <div className="catalog-detail-cover__book">
            {coverUrl && !imageFailed ? (
              <img
                src={coverUrl}
                alt={`Capa de ${work.title}`}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <span className="catalog-detail-cover__fallback">
                <small>ENTRE CAPÍTULOS</small>
                <strong>{work.title}</strong>
                <span>{work.authors[0] ?? "Uma obra para descobrir"}</span>
              </span>
            )}
          </div>
          <p>Capa bibliográfica vinculada ao Open Library.</p>
        </div>

        <div className="catalog-detail-copy">
          <p className="catalog-eyebrow">
            {work.subjects[0] ?? "OBRA NO CATÁLOGO"}
          </p>
          <h1>{work.title}</h1>
          <p className="catalog-detail-copy__author">
            por{" "}
            <strong>
              {work.authors.length > 0
                ? work.authors.join(", ")
                : "autoria não informada"}
            </strong>
          </p>

          <dl className="catalog-detail-facts">
            {work.firstPublishedYear ? (
              <div>
                <dt>
                  <CalendarDays size={15} aria-hidden="true" />
                  Primeira publicação
                </dt>
                <dd>{work.firstPublishedYear}</dd>
              </div>
            ) : null}
            <div>
              <dt>
                <Library size={15} aria-hidden="true" />
                Edições
              </dt>
              <dd>{work.editionCount}</dd>
            </div>
            {languages.length > 0 ? (
              <div>
                <dt>
                  <Languages size={15} aria-hidden="true" />
                  Idiomas
                </dt>
                <dd>{languages.join(", ")}</dd>
              </div>
            ) : null}
          </dl>

          {work.subjects.length > 0 && (
            <div className="catalog-detail-subjects" aria-label="Assuntos">
              {work.subjects.slice(0, 6).map((subject) => (
                <span key={subject}>{subject}</span>
              ))}
            </div>
          )}

          <div className="catalog-detail-save">
            {onWantToRead ? (
              <button
                type="button"
                className={saved ? "is-saved" : ""}
                onClick={handleWantToRead}
                disabled={saving || saved}
              >
                {saved ? (
                  <Check size={18} aria-hidden="true" />
                ) : (
                  <BookmarkPlus size={18} aria-hidden="true" />
                )}
                {saved
                  ? "Está na sua lista"
                  : saving
                    ? "Guardando…"
                    : "Quero ler"}
              </button>
            ) : (
              <Link
                to={`/login?returnTo=${encodeURIComponent(
                  `/livraria/obra/${work.workKey}`,
                )}`}
              >
                <BookmarkPlus size={18} aria-hidden="true" />
                Entrar para guardar
              </Link>
            )}
            <p>
              A obra vai para sua lista; você poderá escolher uma edição depois.
            </p>
            {saveError && <span role="status">{saveError}</span>}
          </div>
        </div>
      </section>

      <section className="catalog-detail-editorial">
        <article>
          <span className="catalog-detail-editorial__number">01</span>
          <p className="catalog-eyebrow">SOBRE A OBRA</p>
          <h2>Antes da primeira página</h2>
          {work.description ? (
            <p>{work.description}</p>
          ) : (
            <p>
              A sinopse ainda não foi registrada no catálogo. As edições abaixo
              ajudam a reconhecer publicação, idioma e formato.
            </p>
          )}
        </article>
        <OpenLibraryDisclosure />
      </section>

      <section className="catalog-editions" id="catalog-editions">
        <header className="catalog-editions__heading">
          <div>
            <p className="catalog-eyebrow">EDIÇÕES DA OBRA</p>
            <h2>A mesma história, em outras formas</h2>
            <p>
              Cada registro preserva seus próprios ISBNs, idioma, editora e
              formato.
            </p>
          </div>
          <span>
            <FileText size={17} aria-hidden="true" />
            {loadState.pagination.total}{" "}
            {loadState.pagination.total === 1 ? "edição" : "edições"}
          </span>
        </header>

        {loadState.editions.length > 0 ? (
          <div className="catalog-editions__grid">
            {loadState.editions.map((edition, index) => (
              <CatalogEditionCard
                key={edition.editionKey}
                edition={edition}
                work={work}
                destinations={loadState.destinations}
                priority={index < 2}
              />
            ))}
          </div>
        ) : (
          <div className="book-catalog-state catalog-editions__empty">
            <BookOpen size={28} aria-hidden="true" />
            <p className="catalog-eyebrow">EDIÇÕES EM ORGANIZAÇÃO</p>
            <h3>A obra está aqui; as edições ainda estão chegando.</h3>
            <p>
              Você pode guardar a obra agora e voltar quando os dados
              bibliográficos estiverem completos.
            </p>
          </div>
        )}

        {loadState.pagination.totalPages > 1 && (
          <nav
            className="book-catalog-pagination"
            aria-label="Páginas de edições"
          >
            <button
              type="button"
              onClick={() =>
                goToEditionPage(loadState.pagination.page - 1)
              }
              disabled={loadState.pagination.page <= 1}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Anterior
            </button>
            <span>
              Página <strong>{loadState.pagination.page}</strong> de{" "}
              {loadState.pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                goToEditionPage(loadState.pagination.page + 1)
              }
              disabled={
                loadState.pagination.page >= loadState.pagination.totalPages
              }
            >
              Próxima
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}

export const OpenLibraryWorkDetailPage = CatalogWorkDetailPage;
