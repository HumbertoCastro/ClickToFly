import { useEffect, useMemo, useState } from "react";
import {
  BellOff,
  BookHeart,
  CircleAlert,
  Clock3,
  RefreshCcw,
  ShoppingBag,
} from "lucide-react";
import { Link } from "react-router-dom";
import type {
  AmazonCatalogItem,
  AmazonCatalogMode,
  AmazonCurrentOffer,
  AmazonEdition,
} from "../amazonTypes";
import { AmazonBookCard } from "../components/AmazonBookCard";
import { AmazonDisclosure } from "../components/AmazonDisclosure";
import {
  amazonCatalogExpirations,
  createAmazonCatalogClient,
  filterAmazonItems,
  getAmazonCatalogConfig,
} from "../lib/amazonCatalog";
import { useAmazonExpiryClock } from "../lib/useAmazonExpiryClock";
import { amazonCatalogAuthHeaders } from "../lib/repository";

export interface WishlistAmazonBook {
  bookId: string;
  entryId: string;
  asins: readonly string[];
  title?: string;
  authors?: readonly string[];
}

export interface UnlinkedWishlistBook {
  bookId: string;
  entryId: string;
  title: string;
  authors?: readonly string[];
}

export interface OffersPageProps {
  wishlistBooks?: readonly WishlistAmazonBook[];
  unlinkedBooks?: readonly UnlinkedWishlistBook[];
  initialItems?: readonly AmazonCatalogItem[];
}

type OfferFilter = "all" | "with_offer" | "without_offer";

const offersCatalogClient = createAmazonCatalogClient({
  ...getAmazonCatalogConfig(),
  resolveHeaders: amazonCatalogAuthHeaders,
});
const keepSaved = () => undefined;
const EMPTY_WISHLIST: readonly WishlistAmazonBook[] = [];
const EMPTY_UNLINKED: readonly UnlinkedWishlistBook[] = [];

interface OffersLoadState {
  requestKey: string;
  items: AmazonCatalogItem[];
  mode: AmazonCatalogMode;
  expiresAt: string[];
  error: string;
}

function isFreshOffer(
  offer: AmazonCurrentOffer | null | undefined,
  now: number = Date.now(),
): offer is AmazonCurrentOffer {
  if (!offer?.expiresAt) return false;
  const expiration = new Date(offer.expiresAt).getTime();
  return Number.isFinite(expiration) && expiration > now;
}

function currentOffer(item: AmazonCatalogItem, now: number = Date.now()) {
  if (isFreshOffer(item.offer, now)) return item.offer;
  return item.editions
    .map((edition) => edition.offer)
    .find((offer): offer is AmazonCurrentOffer => isFreshOffer(offer, now));
}

function itemAsins(item: AmazonCatalogItem): Set<string> {
  return new Set([item.asin, ...item.editions.map((edition) => edition.asin)]);
}

function wishlistMatchesItem(
  book: WishlistAmazonBook,
  item: AmazonCatalogItem,
): boolean {
  const candidates = itemAsins(item);
  return book.asins.some((asin) => candidates.has(asin));
}

function mergeWishlistItems(
  books: readonly WishlistAmazonBook[],
  candidates: readonly AmazonCatalogItem[],
): AmazonCatalogItem[] {
  if (books.length === 0) return [...candidates];

  return books.flatMap((book) => {
    const matches = candidates.filter((item) =>
      wishlistMatchesItem(book, item)
    );
    if (matches.length === 0) return [];

    const primary =
      book.asins
        .map((asin) => matches.find((item) => item.asin === asin))
        .find(Boolean) ?? matches[0];
    const editions = new Map<string, AmazonEdition>();

    for (const item of matches) {
      for (const edition of item.editions) {
        editions.set(edition.asin, edition);
      }
      if (!editions.has(item.asin)) {
        editions.set(item.asin, {
          asin: item.asin,
          format: item.format,
          label: "Edição Amazon",
          detailPageUrl: item.detailPageUrl,
          imageUrl: item.imageUrl,
          offer: item.offer,
          fetchedAt: item.fetchedAt,
          expiresAt: item.expiresAt,
        });
      }
    }

    return [{ ...primary, editions: [...editions.values()] }];
  });
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function UnlinkedBooks({
  books,
}: {
  books: readonly UnlinkedWishlistBook[];
}) {
  if (books.length === 0) return null;

  return (
    <section className="offers-unlinked" aria-labelledby="offers-unlinked-title">
      <div>
        <p className="eyebrow">EDIÇÃO AMAZON PENDENTE</p>
        <h2 id="offers-unlinked-title">
          {books.length === 1
            ? "Um livro ainda precisa ser localizado."
            : `${books.length} livros ainda precisam ser localizados.`}
        </h2>
        <p>
          Eles continuam na sua lista. Busque a edição correta na Livraria
          para vinculá-la sem guardar preço ou imagem no seu registro.
        </p>
      </div>
      <ul>
        {books.map((book) => (
          <li key={book.entryId}>
            <span>
              <strong>{book.title}</strong>
              {book.authors?.length ? (
                <small>{book.authors.join(", ")}</small>
              ) : null}
            </span>
            <Link
              className="button button--secondary"
              to={`/livraria?${new URLSearchParams({
                q: book.title,
                linkBookId: book.bookId,
                linkEntryId: book.entryId,
              }).toString()}`}
            >
              Localizar edição
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function OffersPage({
  wishlistBooks = EMPTY_WISHLIST,
  unlinkedBooks = EMPTY_UNLINKED,
  initialItems,
}: OffersPageProps) {
  const [loadState, setLoadState] = useState<OffersLoadState>({
    requestKey: "",
    items: [],
    mode: offersCatalogClient.mode,
    expiresAt: [],
    error: "",
  });
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<OfferFilter>("all");
  const asins = useMemo(
    () =>
      [
        ...new Set(
          wishlistBooks
            .flatMap((book) => book.asins)
            .map((asin) => asin.trim().toUpperCase())
            .filter((asin) => /^[A-Z0-9]{10}$/.test(asin)),
        ),
      ],
    [wishlistBooks],
  );
  const asinKey = asins.join(",");
  const requestKey = `${asinKey}\u0000${reloadKey}`;
  const rawItems = useMemo(
    () => (initialItems ? [...initialItems] : loadState.items),
    [initialItems, loadState.items],
  );
  const loading =
    initialItems === undefined &&
    asins.length > 0 &&
    loadState.requestKey !== requestKey;
  const error = loadState.requestKey === requestKey ? loadState.error : "";

  useEffect(() => {
    if (initialItems !== undefined) return;

    const requestedAsins = asinKey ? asinKey.split(",") : [];

    if (requestedAsins.length === 0) return;

    let ignore = false;

    async function loadWishlistOffers() {
      const resultItems: AmazonCatalogItem[] = [];
      const resultModes: AmazonCatalogMode[] = [];
      const resultExpirations: string[] = [];
      for (let index = 0; index < requestedAsins.length; index += 10) {
        if (ignore) return;
        if (index > 0) await wait(1050);
        const result = await offersCatalogClient.items(
          requestedAsins.slice(index, index + 10),
        );
        resultItems.push(...result.items);
        resultModes.push(result.mode);
        resultExpirations.push(
          ...amazonCatalogExpirations(result.items, result.expiresAt),
        );
      }
      const mode: AmazonCatalogMode = resultModes.includes("disabled")
        ? "disabled"
        : resultModes.includes("creators")
          ? "creators"
          : "sitestripe";
      return {
        items: resultItems,
        mode,
        expiresAt: [...new Set(resultExpirations)],
      };
    }

    loadWishlistOffers()
      .then((result) => {
        if (ignore || !result) return;
        setLoadState({
          requestKey,
          items: result.items,
          mode: result.mode,
          expiresAt: result.expiresAt,
          error: "",
        });
      })
      .catch(() => {
        if (ignore) return;
        setLoadState({
          requestKey,
          items: [],
          mode: offersCatalogClient.mode,
          expiresAt: [],
          error:
            "Não foi possível consultar os preços atuais da sua lista. Tente novamente em instantes.",
        });
      });

    return () => {
      ignore = true;
    };
  }, [asinKey, initialItems, requestKey]);

  const expirationValues = useMemo(
    () => [
      ...loadState.expiresAt,
      ...amazonCatalogExpirations(rawItems),
    ],
    [loadState.expiresAt, rawItems],
  );
  const freshnessNow = useAmazonExpiryClock(
    expirationValues,
    initialItems === undefined
      ? () => setReloadKey((value) => value + 1)
      : undefined,
  );
  const freshItems = useMemo(
    () => filterAmazonItems(rawItems, {}, freshnessNow),
    [freshnessNow, rawItems],
  );
  const items = useMemo(
    () => mergeWishlistItems(wishlistBooks, freshItems),
    [freshItems, wishlistBooks],
  );
  const catalogMode =
    initialItems === undefined &&
    loadState.requestKey === requestKey
      ? loadState.mode
      : offersCatalogClient.mode;

  const itemsWithOffers = useMemo(
    () => items.filter((item) => Boolean(currentOffer(item, freshnessNow))),
    [freshnessNow, items],
  );
  const visibleItems = useMemo(() => {
    const filtered =
      filter === "with_offer"
        ? itemsWithOffers
        : filter === "without_offer"
          ? items.filter((item) => !currentOffer(item, freshnessNow))
          : items;
    return [...filtered].sort((left, right) => {
      const leftOffer = currentOffer(left, freshnessNow);
      const rightOffer = currentOffer(right, freshnessNow);
      if (leftOffer && !rightOffer) return -1;
      if (!leftOffer && rightOffer) return 1;
      return left.title.localeCompare(right.title, "pt-BR");
    });
  }, [filter, freshnessNow, items, itemsWithOffers]);

  const newestFetch = useMemo(() => {
    const timestamps = itemsWithOffers
      .map((item) => currentOffer(item, freshnessNow)?.fetchedAt)
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value).getTime())
      .filter(Number.isFinite);
    if (timestamps.length === 0) return null;
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(Math.max(...timestamps)));
  }, [freshnessNow, itemsWithOffers]);
  const unresolvedBooks = useMemo<UnlinkedWishlistBook[]>(() => {
    return [
      ...unlinkedBooks,
      ...wishlistBooks
        .filter(
          (book) =>
            !items.some((item) => wishlistMatchesItem(book, item)),
        )
        .map((book) => ({
          bookId: book.bookId,
          entryId: book.entryId,
          title: book.title || book.asins[0] || "Livro da lista",
          authors: book.authors,
        })),
    ];
  }, [items, unlinkedBooks, wishlistBooks]);

  const emptyWishlist =
    initialItems === undefined &&
    asins.length === 0 &&
    unlinkedBooks.length === 0;

  return (
    <div className="offers-page page">
      <header className="offers-heading">
        <div>
          <p className="eyebrow">SUA PRÓXIMA LEITURA</p>
          <h1>Ofertas da sua lista</h1>
          <p>
            Veja a condição atual dos livros que você marcou como “Quero ler”.
            Os valores são consultados quando esta página é aberta.
          </p>
        </div>
        {!emptyWishlist && asins.length > 0 && (
          <button
            className="button button--secondary"
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            disabled={loading}
          >
            <RefreshCcw size={17} aria-hidden="true" />
            Atualizar consulta
          </button>
        )}
      </header>

      {emptyWishlist ? (
        <section className="offers-empty">
          <div className="offers-empty__illustration" aria-hidden="true">
            <BookHeart size={42} />
            <span />
            <span />
            <span />
          </div>
          <div>
            <p className="eyebrow">LISTA VAZIA</p>
            <h2>Guarde os livros que despertam curiosidade.</h2>
            <p>
              Na Livraria, use “Quero ler”. Eles aparecem aqui para uma consulta
              rápida da oferta vigente na Amazon.
            </p>
            <Link className="button button--primary" to="/livraria">
              <ShoppingBag size={17} aria-hidden="true" />
              Explorar a livraria
            </Link>
          </div>
        </section>
      ) : loading ? (
        <section className="offers-loading" aria-busy="true">
          <div className="offers-summary-card is-loading" />
          <div className="amazon-catalog-grid amazon-catalog-grid--loading">
            {Array.from({ length: Math.min(Math.max(asins.length, 4), 8) }, (_, index) => (
              <div className="amazon-book-skeleton" key={index}>
                <span />
                <i />
                <i />
                <i />
              </div>
            ))}
          </div>
          <span className="sr-only">Consultando ofertas atuais na Amazon</span>
        </section>
      ) : error ? (
        <section
          className="store-state store-state--error offers-error"
          role="alert"
        >
          <CircleAlert size={30} aria-hidden="true" />
          <p className="eyebrow">CONSULTA INTERROMPIDA</p>
          <h2>Não conseguimos abrir as ofertas.</h2>
          <p>{error}</p>
          <button
            className="button button--primary"
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            <RefreshCcw size={17} aria-hidden="true" />
            Tentar novamente
          </button>
        </section>
      ) : catalogMode === "disabled" ? (
        <section className="store-state offers-error">
          <BellOff size={30} aria-hidden="true" />
          <p className="eyebrow">CONSULTA INDISPONÍVEL</p>
          <h2>A integração comercial está desativada.</h2>
          <p>
            Nenhum valor estimado será mostrado. Sua lista continua guardada na
            estante.
          </p>
          <UnlinkedBooks books={unlinkedBooks} />
          <Link className="button button--secondary" to="/library">
            Voltar para a estante
          </Link>
        </section>
      ) : (
        <>
          <section className="offers-summary" aria-label="Resumo da consulta">
            <article className="offers-summary-card">
              <span className="offers-summary-card__icon">
                <BookHeart size={20} aria-hidden="true" />
              </span>
              <div>
                <strong>{items.length}</strong>
                <span>{items.length === 1 ? "livro consultado" : "livros consultados"}</span>
              </div>
            </article>
            <article className="offers-summary-card">
              <span className="offers-summary-card__icon offers-summary-card__icon--accent">
                <ShoppingBag size={20} aria-hidden="true" />
              </span>
              <div>
                <strong>{itemsWithOffers.length}</strong>
                <span>
                  {itemsWithOffers.length === 1
                    ? "preço disponível agora"
                    : "preços disponíveis agora"}
                </span>
              </div>
            </article>
            <article className="offers-summary-card offers-summary-card--time">
              <Clock3 size={18} aria-hidden="true" />
              <div>
                <span>Consulta mais recente</span>
                <strong>{newestFetch ?? "Agora"}</strong>
              </div>
            </article>
          </section>

          <div className="offers-toolbar">
            <div role="group" aria-label="Filtrar livros da lista">
              {(
                [
                  ["all", "Todos"],
                  ["with_offer", "Com preço"],
                  ["without_offer", "Consultar na Amazon"],
                ] as Array<[OfferFilter, string]>
              ).map(([value, label]) => (
                <button
                  className={filter === value ? "is-active" : ""}
                  type="button"
                  key={value}
                  onClick={() => setFilter(value)}
                  aria-pressed={filter === value}
                >
                  {label}
                </button>
              ))}
            </div>
            <span>
              {visibleItems.length}{" "}
              {visibleItems.length === 1 ? "resultado" : "resultados"}
            </span>
          </div>

          {visibleItems.length > 0 ? (
            <div className="amazon-catalog-grid offers-grid">
              {visibleItems.map((item, index) => (
                <AmazonBookCard
                  item={item}
                  key={item.asin}
                  onWantToRead={keepSaved}
                  isSaved
                  priority={index < 4}
                />
              ))}
            </div>
          ) : unresolvedBooks.length === 0 ? (
            <section className="store-state offers-filter-empty">
              <BookHeart size={29} aria-hidden="true" />
              <h2>Nenhum livro nesta seleção.</h2>
              <p>Escolha outro filtro para rever toda a sua lista.</p>
              <button
                className="button button--secondary"
                type="button"
                onClick={() => setFilter("all")}
              >
                Mostrar todos
              </button>
            </section>
          ) : null}

          <UnlinkedBooks books={unresolvedBooks} />

          <AmazonDisclosure className="offers-disclosure" />
        </>
      )}
    </div>
  );
}
