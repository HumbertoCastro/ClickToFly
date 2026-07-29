import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowRight,
  BookOpenCheck,
  CircleAlert,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import type {
  AmazonBookFormat,
  AmazonCatalogItem,
  AmazonCatalogMode,
} from "../amazonTypes";
import { AmazonBookCard } from "../components/AmazonBookCard";
import {
  amazonCatalogExpirations,
  createAmazonCatalogClient,
  filterAmazonItems,
  getAmazonCatalogConfig,
  recommendAmazonItems,
  sortAmazonItems,
} from "../lib/amazonCatalog";
import { useAmazonExpiryClock } from "../lib/useAmazonExpiryClock";
import { amazonCatalogAuthHeaders } from "../lib/repository";

type PriceFilter = "all" | "under_30" | "between_30_60" | "over_60";
type StoreSort =
  | "featured"
  | "sales_rank"
  | "price_asc"
  | "price_desc"
  | "discount_desc"
  | "title";

export interface BookstoreInterests {
  authors?: readonly string[];
  categories?: readonly string[];
}

export interface BookstorePageProps {
  onWantToRead?: (
    item: AmazonCatalogItem,
  ) => Promise<void> | void;
  savedAsins?: readonly string[];
  interests?: BookstoreInterests;
  initialItems?: readonly AmazonCatalogItem[];
  detailSearch?: string;
}

const formatOptions: Array<{
  value: AmazonBookFormat | "all";
  label: string;
}> = [
  { value: "all", label: "Todos os formatos" },
  { value: "paperback", label: "Livro físico" },
  { value: "hardcover", label: "Capa dura" },
  { value: "kindle", label: "Kindle" },
];

const priceOptions: Array<{ value: PriceFilter; label: string }> = [
  { value: "all", label: "Qualquer preço" },
  { value: "under_30", label: "Até R$ 30" },
  { value: "between_30_60", label: "R$ 30 a R$ 60" },
  { value: "over_60", label: "Acima de R$ 60" },
];

const sortOptions: Array<{ value: StoreSort; label: string }> = [
  { value: "featured", label: "Destaques" },
  { value: "sales_rank", label: "Relevância na Amazon" },
  { value: "price_asc", label: "Preço: menor para maior" },
  { value: "price_desc", label: "Preço: maior para menor" },
  { value: "discount_desc", label: "Maior economia atual" },
  { value: "title", label: "Título A–Z" },
];

const catalogClient = createAmazonCatalogClient({
  ...getAmazonCatalogConfig(),
  resolveHeaders: amazonCatalogAuthHeaders,
});

interface CatalogLoadState {
  requestKey: string;
  items: AmazonCatalogItem[];
  mode: AmazonCatalogMode;
  expiresAt: string | null;
  error: string;
}

function StoreCatalogSkeleton() {
  return (
    <div
      className="amazon-catalog-grid amazon-catalog-grid--loading"
      aria-label="Carregando livros da Amazon"
      aria-busy="true"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <div className="amazon-book-skeleton" key={index}>
          <span />
          <i />
          <i />
          <i />
        </div>
      ))}
    </div>
  );
}

export function BookstorePage({
  onWantToRead,
  savedAsins = [],
  interests,
  initialItems,
  detailSearch = "",
}: BookstorePageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q")?.trim() ?? "";
  const submittedQuery = queryFromUrl || "livros";
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [catalogState, setCatalogState] = useState<CatalogLoadState>({
    requestKey: "",
    items: [],
    mode: catalogClient.mode,
    expiresAt: null,
    error: "",
  });
  const [reloadKey, setReloadKey] = useState(0);
  const [category, setCategory] = useState("all");
  const [format, setFormat] = useState<AmazonBookFormat | "all">("all");
  const [price, setPrice] = useState<PriceFilter>("all");
  const [discountOnly, setDiscountOnly] = useState(false);
  const [sort, setSort] = useState<StoreSort>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const filterCloseRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLElement>(null);

  const searchIndex = format === "kindle" ? "KindleStore" : "Books";
  const requestKey = `${submittedQuery}\u0000${searchIndex}\u0000${reloadKey}`;
  const items = useMemo(
    () => (initialItems ? [...initialItems] : catalogState.items),
    [catalogState.items, initialItems],
  );
  const loading =
    initialItems === undefined && catalogState.requestKey !== requestKey;
  const error =
    catalogState.requestKey === requestKey ? catalogState.error : "";
  const catalogMode =
    catalogState.requestKey === requestKey
      ? catalogState.mode
      : catalogClient.mode;

  useEffect(() => {
    if (initialItems !== undefined) return;

    let ignore = false;

    catalogClient
      .search({
        query: submittedQuery || "livros",
        searchIndex,
      })
      .then((result) => {
        if (ignore) return;
        setCatalogState({
          requestKey,
          items: result.items,
          mode: result.mode,
          expiresAt: result.expiresAt,
          error: "",
        });
      })
      .catch(() => {
        if (ignore) return;
        setCatalogState({
          requestKey,
          items: [],
          mode: catalogClient.mode,
          expiresAt: null,
          error:
            "A livraria não conseguiu consultar a Amazon agora. Tente novamente em instantes.",
        });
      });

    return () => {
      ignore = true;
    };
  }, [initialItems, requestKey, searchIndex, submittedQuery]);

  const expirationValues = useMemo(
    () =>
      amazonCatalogExpirations(
        items,
        initialItems === undefined ? catalogState.expiresAt : null,
      ),
    [catalogState.expiresAt, initialItems, items],
  );
  const freshnessNow = useAmazonExpiryClock(
    expirationValues,
    initialItems === undefined
      ? () => setReloadKey((value) => value + 1)
      : undefined,
  );
  const freshItems = useMemo(
    () => filterAmazonItems(items, {}, freshnessNow),
    [freshnessNow, items],
  );

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

  const categories = useMemo(
    () =>
      [...new Set(freshItems.flatMap((item) => item.categories))]
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right, "pt-BR")),
    [freshItems],
  );

  const visibleItems = useMemo(() => {
    const priceLimits =
      price === "under_30"
        ? { maxPrice: 30 }
        : price === "between_30_60"
          ? { minPrice: 30, maxPrice: 60 }
          : price === "over_60"
            ? { minPrice: 60 }
            : {};
    const filtered = filterAmazonItems(freshItems, {
      query:
        initialItems !== undefined && submittedQuery !== "livros"
          ? submittedQuery
          : undefined,
      category: category === "all" ? undefined : category,
      formats: format === "all" ? undefined : [format],
      minimumDiscountPercentage: discountOnly ? 1 : undefined,
      ...priceLimits,
    }, freshnessNow);

    return sortAmazonItems(filtered, sort, freshnessNow);
  }, [
    category,
    discountOnly,
    format,
    initialItems,
    freshItems,
    freshnessNow,
    price,
    sort,
    submittedQuery,
  ]);

  const recommendations = useMemo(
    () =>
      recommendAmazonItems(visibleItems, {
        authors: interests?.authors ? [...interests.authors] : undefined,
        categories: interests?.categories
          ? [...interests.categories]
          : undefined,
        limit: 3,
      }, freshnessNow),
    [freshnessNow, interests, visibleItems],
  );

  const activeFilterCount =
    Number(category !== "all") +
    Number(format !== "all") +
    Number(price !== "all") +
    Number(discountOnly);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = searchInputRef.current?.value.trim() ?? "";
    const nextParams = new URLSearchParams(searchParams);
    if (nextQuery) {
      nextParams.set("q", nextQuery);
    } else {
      nextParams.delete("q");
    }
    setSearchParams(nextParams);
  }

  function resetFilters() {
    setCategory("all");
    setFormat("all");
    setPrice("all");
    setDiscountOnly(false);
    setSort("featured");
  }

  function renderFilterControls(mobile = false) {
    return (
      <>
        <div className="store-filter-group">
          <label htmlFor={mobile ? "store-category-mobile" : "store-category"}>
            Categoria
          </label>
          <select
            id={mobile ? "store-category-mobile" : "store-category"}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">Todas as categorias</option>
            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="store-filter-group store-filter-group--choices">
          <legend>Formato</legend>
          {formatOptions.map((option) => (
            <label key={option.value}>
              <input
                type="radio"
                name={mobile ? "store-format-mobile" : "store-format"}
                value={option.value}
                checked={format === option.value}
                onChange={() => setFormat(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="store-filter-group store-filter-group--choices">
          <legend>Faixa de preço</legend>
          {priceOptions.map((option) => (
            <label key={option.value}>
              <input
                type="radio"
                name={mobile ? "store-price-mobile" : "store-price"}
                value={option.value}
                checked={price === option.value}
                onChange={() => setPrice(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>

        <label className="store-filter-check">
          <input
            type="checkbox"
            checked={discountOnly}
            onChange={(event) => setDiscountOnly(event.target.checked)}
          />
          <span>
            <strong>Com economia vigente</strong>
            <small>Somente ofertas informadas agora pela Amazon</small>
          </span>
        </label>

        <button className="text-button store-filter-reset" type="button" onClick={resetFilters}>
          Limpar filtros
        </button>
      </>
    );
  }

  const noCatalogAccess = catalogMode === "disabled";

  return (
    <div className="store-page">
      <section className="store-hero">
        <div className="store-hero__copy">
          <p className="eyebrow">LIVRARIA · AMAZON.COM.BR</p>
          <h1>
            Toda grande leitura começa com uma <em>boa descoberta.</em>
          </h1>
          <p>
            Encontre sua próxima história, guarde na estante e consulte a
            oferta atual diretamente na Amazon.
          </p>
          <form className="store-search" role="search" onSubmit={handleSearch}>
            <Search size={22} aria-hidden="true" />
            <label className="sr-only" htmlFor="store-search-input">
              Buscar livros, autores ou ISBN
            </label>
            <input
              key={queryFromUrl}
              ref={searchInputRef}
              id="store-search-input"
              defaultValue={queryFromUrl}
              placeholder="Busque por título, autora, autor ou ISBN"
            />
            <button type="submit">Buscar na Amazon</button>
          </form>
          <div className="store-hero__footnote">
            <span>
              <BookOpenCheck size={16} aria-hidden="true" />
              Livros físicos e Kindle
            </span>
            <a
              href="https://www.amazon.com.br/gp/bestsellers/books"
              target="_blank"
              rel="noopener noreferrer"
            >
              Explorar listas da Amazon <ArrowRight size={14} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="store-hero__visual" aria-hidden="true">
          <span className="store-hero__edition">EDIÇÃO Nº 01 · CURADORIA DE LEITURA</span>
          <div className="store-hero__halo" />
          <div className="store-hero__book-stack">
            {(recommendations.length > 0
              ? recommendations
              : freshItems.slice(0, 3)
            ).map((item, index) => (
              <div
                className={[
                  "store-hero__book",
                  `store-hero__book--${index + 1}`,
                  item.imageUrl
                    ? ""
                    : "store-hero__book--placeholder",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={item.asin}
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" />
                ) : (
                  <span>{item.title}</span>
                )}
              </div>
            ))}
            {freshItems.length === 0 && (
              <>
                <div className="store-hero__book store-hero__book--1 store-hero__book--placeholder">
                  <span>Histórias que ficam</span>
                </div>
                <div className="store-hero__book store-hero__book--2 store-hero__book--placeholder">
                  <span>Novas páginas</span>
                </div>
                <div className="store-hero__book store-hero__book--3 store-hero__book--placeholder">
                  <span>Próxima leitura</span>
                </div>
              </>
            )}
          </div>
          <blockquote>“Uma livraria feita para o tempo de escolher.”</blockquote>
        </div>
      </section>

      <section className="store-catalog">
        <header className="store-catalog__header">
          <div>
            <p className="eyebrow">
              {submittedQuery === "livros"
                ? "EM DESTAQUE NA AMAZON"
                : `RESULTADOS PARA “${submittedQuery}”`}
            </p>
            <h2>Escolha o próximo capítulo</h2>
            <p>
              {loading
                ? "Consultando o catálogo…"
                : `${visibleItems.length} ${
                    visibleItems.length === 1 ? "livro encontrado" : "livros encontrados"
                  }`}
            </p>
          </div>
          <div className="store-catalog__actions">
            <label className="store-sort">
              <span>Ordenar</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as StoreSort)}
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
              className="button button--secondary store-filter-trigger"
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

        {catalogMode === "sitestripe" && (
          <div className="store-mode-note" role="note">
            <Sparkles size={17} aria-hidden="true" />
            <p>
              <strong>Seleção editorial.</strong> Quando o preço não estiver
              disponível, consulte a condição atual no link da Amazon.
            </p>
          </div>
        )}

        <div className="store-catalog__layout">
          <aside className="store-filters" aria-label="Filtros do catálogo">
            <div className="store-filters__heading">
              <span>Refine sua busca</span>
              {activeFilterCount > 0 && <strong>{activeFilterCount}</strong>}
            </div>
            {renderFilterControls()}
          </aside>

          <div className="store-results" aria-live="polite">
            {loading ? (
              <StoreCatalogSkeleton />
            ) : error ? (
              <div className="store-state store-state--error">
                <CircleAlert size={28} aria-hidden="true" />
                <p className="eyebrow">CONSULTA INTERROMPIDA</p>
                <h3>As páginas não abriram desta vez.</h3>
                <p>{error}</p>
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => setReloadKey((value) => value + 1)}
                >
                  <RefreshCcw size={17} aria-hidden="true" />
                  Tentar novamente
                </button>
              </div>
            ) : noCatalogAccess ? (
              <div className="store-state">
                <BookOpenCheck size={30} aria-hidden="true" />
                <p className="eyebrow">LIVRARIA EM PREPARAÇÃO</p>
                <h3>O catálogo comercial ainda não está disponível.</h3>
                <p>
                  Sua estante continua funcionando normalmente. Nenhum preço
                  estimado será exibido enquanto a consulta estiver desativada.
                </p>
                <Link className="button button--secondary" to="/library">
                  Ir para minha estante
                </Link>
              </div>
            ) : visibleItems.length === 0 ? (
              <div className="store-state">
                <Search size={30} aria-hidden="true" />
                <p className="eyebrow">NENHUM TÍTULO NESTA SELEÇÃO</p>
                <h3>Tente abrir um pouco os filtros.</h3>
                <p>
                  Remova uma faixa de preço, altere o formato ou busque outro
                  título.
                </p>
                <button className="button button--secondary" type="button" onClick={resetFilters}>
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div className="amazon-catalog-grid">
                {visibleItems.map((item, index) => (
                  <AmazonBookCard
                    item={item}
                    key={item.asin}
                    onWantToRead={onWantToRead}
                    isSaved={savedAsins.includes(item.asin)}
                    priority={index === 0}
                    detailSearch={detailSearch}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {filtersOpen && (
        <div className="store-filter-dialog" role="presentation">
          <button
            className="store-filter-dialog__scrim"
            type="button"
            onClick={() => {
              setFiltersOpen(false);
              filterTriggerRef.current?.focus();
            }}
            aria-label="Fechar filtros"
          />
          <section
            ref={filterPanelRef}
            className="store-filter-dialog__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="store-filter-dialog-title"
          >
            <header>
              <div>
                <p className="eyebrow">CATÁLOGO</p>
                <h2 id="store-filter-dialog-title">Filtrar livros</h2>
              </div>
              <button
                ref={filterCloseRef}
                className="icon-button"
                type="button"
                onClick={() => {
                  setFiltersOpen(false);
                  filterTriggerRef.current?.focus();
                }}
                aria-label="Fechar filtros"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>
            <div className="store-filter-dialog__content">
              {renderFilterControls(true)}
            </div>
            <footer>
              <button
                className="button button--primary button--wide"
                type="button"
                onClick={() => {
                  setFiltersOpen(false);
                  filterTriggerRef.current?.focus();
                }}
              >
                Ver {visibleItems.length}{" "}
                {visibleItems.length === 1 ? "livro" : "livros"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
