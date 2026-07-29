import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookmarkPlus,
  CalendarDays,
  Check,
  CircleAlert,
  Languages,
  Library,
  RefreshCcw,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import type {
  AmazonCatalogItem,
  AmazonEdition,
} from "../amazonTypes";
import { AmazonOfferPanel } from "../components/AmazonOfferPanel";
import {
  amazonCatalogExpirations,
  createAmazonCatalogClient,
  getAmazonCatalogConfig,
  loadAmazonCatalogItem,
  sanitizeAmazonCatalogItem,
} from "../lib/amazonCatalog";
import { useAmazonExpiryClock } from "../lib/useAmazonExpiryClock";
import { amazonCatalogAuthHeaders } from "../lib/repository";

export interface StoreBookDetailPageProps {
  onWantToRead?: (
    item: AmazonCatalogItem,
  ) => Promise<void> | void;
  isSaved?: boolean;
  initialItem?: AmazonCatalogItem;
}

const detailCatalogClient = createAmazonCatalogClient({
  ...getAmazonCatalogConfig(),
  resolveHeaders: amazonCatalogAuthHeaders,
});

interface DetailLoadState {
  requestKey: string;
  item: AmazonCatalogItem | null;
  expiresAt: string | null;
  error: string;
}

function mergeVariationItems(
  items: AmazonCatalogItem[],
  requestedAsin: string,
) {
  const primary =
    items.find((item) => item.asin === requestedAsin) ?? items[0] ?? null;
  if (!primary) return null;

  const editions = new Map<string, AmazonEdition>();
  for (const edition of primary.editions) editions.set(edition.asin, edition);

  for (const item of items) {
    for (const edition of item.editions) editions.set(edition.asin, edition);
    if (!editions.has(item.asin)) {
      editions.set(item.asin, {
        asin: item.asin,
        format: "unknown",
        label: item.asin === primary.asin ? "Edição principal" : "Outra edição",
        detailPageUrl: item.detailPageUrl,
        imageUrl: item.imageUrl,
        offer: item.offer,
        fetchedAt: item.fetchedAt,
        expiresAt: item.expiresAt,
      });
    }
  }

  return { ...primary, editions: [...editions.values()] };
}

export function StoreBookDetailPage({
  onWantToRead,
  isSaved = false,
  initialItem,
}: StoreBookDetailPageProps) {
  const { asin = "" } = useParams();
  const normalizedAsin = (initialItem?.asin ?? asin).trim().toUpperCase();
  const [reloadKey, setReloadKey] = useState(0);
  const [loadState, setLoadState] = useState<DetailLoadState>({
    requestKey: "",
    item: null,
    expiresAt: null,
    error: "",
  });
  const [imageFailed, setImageFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAsin, setSavedAsin] = useState(
    isSaved ? normalizedAsin : "",
  );
  const [saveError, setSaveError] = useState("");
  const saved = isSaved || savedAsin === normalizedAsin;
  const validAsin = /^[A-Z0-9]{10}$/.test(normalizedAsin);
  const requestKey = `${normalizedAsin}\u0000${reloadKey}`;
  const rawItem =
    initialItem ??
    (loadState.requestKey === requestKey ? loadState.item : null);
  const expirationValues = useMemo(
    () =>
      rawItem
        ? amazonCatalogExpirations(
            [rawItem],
            initialItem ? null : loadState.expiresAt,
          )
        : [],
    [initialItem, loadState.expiresAt, rawItem],
  );
  const freshnessNow = useAmazonExpiryClock(
    expirationValues,
    initialItem
      ? undefined
      : () => setReloadKey((value) => value + 1),
  );
  const item = rawItem
    ? sanitizeAmazonCatalogItem(rawItem, freshnessNow)
    : null;
  const loading =
    !initialItem && validAsin && loadState.requestKey !== requestKey;
  const error = !validAsin
    ? "O código deste livro não é válido."
    : loadState.requestKey === requestKey
      ? loadState.error
      : "";

  useEffect(() => {
    if (initialItem || !validAsin) return;

    let ignore = false;

    loadAmazonCatalogItem(detailCatalogClient, normalizedAsin)
      .then((result) => {
        if (ignore) return;
        const mergedItem = mergeVariationItems(result.items, normalizedAsin);
        setLoadState({
          requestKey,
          item: mergedItem,
          expiresAt: result.expiresAt,
          error: mergedItem
            ? ""
            : "A Amazon não retornou detalhes para esta edição.",
        });
      })
      .catch(() => {
        if (ignore) return;
        setLoadState({
          requestKey,
          item: null,
          expiresAt: null,
          error:
            "Não foi possível consultar este livro na Amazon agora. Tente novamente em instantes.",
        });
      });

    return () => {
      ignore = true;
    };
  }, [initialItem, normalizedAsin, requestKey, validAsin]);

  const detailFacts = useMemo(() => {
    if (!item) return [];
    return [
      item.publisher
        ? { label: "Editora", value: item.publisher, icon: Library }
        : null,
      item.publishedDate
        ? {
            label: "Publicação",
            value: item.publishedDate,
            icon: CalendarDays,
          }
        : null,
      item.language || item.languages[0]
        ? {
            label: "Idioma",
            value: (item.language || item.languages[0]).toUpperCase(),
            icon: Languages,
          }
        : null,
    ].filter((fact): fact is NonNullable<typeof fact> => Boolean(fact));
  }, [item]);

  async function handleWantToRead() {
    if (!item || !onWantToRead || saving || saved) return;
    setSaving(true);
    setSaveError("");
    try {
      await onWantToRead(item);
      setSavedAsin(normalizedAsin);
    } catch {
      setSaveError("Não foi possível guardar este livro na sua lista.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="store-detail-page store-detail-page--loading" aria-busy="true">
        <span className="store-detail-skeleton store-detail-skeleton--cover" />
        <div>
          <span className="store-detail-skeleton store-detail-skeleton--eyebrow" />
          <span className="store-detail-skeleton store-detail-skeleton--title" />
          <span className="store-detail-skeleton store-detail-skeleton--copy" />
          <span className="store-detail-skeleton store-detail-skeleton--copy" />
        </div>
        <span className="store-detail-skeleton store-detail-skeleton--panel" />
        <span className="sr-only">Consultando detalhes do livro na Amazon</span>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="store-detail-page">
        <Link className="back-link" to="/livraria">
          <ArrowLeft size={17} aria-hidden="true" />
          Voltar para a livraria
        </Link>
        <section className="store-state store-detail-error">
          <CircleAlert size={31} aria-hidden="true" />
          <p className="eyebrow">EDIÇÃO NÃO ENCONTRADA</p>
          <h1>Este livro saiu do nosso índice.</h1>
          <p>
            {error ||
              "A edição pode estar indisponível ou o endereço pode ter mudado."}
          </p>
          <div>
            {/^[A-Z0-9]{10}$/.test(normalizedAsin) && (
              <button
                className="button button--primary"
                type="button"
                onClick={() => setReloadKey((value) => value + 1)}
              >
                <RefreshCcw size={17} aria-hidden="true" />
                Consultar novamente
              </button>
            )}
            <Link className="button button--secondary" to="/livraria">
              Explorar outros livros
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const imageUrl =
    item.imageUrl ||
    item.editions.find((edition) => edition.imageUrl)?.imageUrl ||
    "";

  return (
    <div className="store-detail-page">
      <nav className="store-breadcrumb" aria-label="Caminho da página">
        <Link to="/livraria">Livraria</Link>
        <span aria-hidden="true">/</span>
        <span>{item.title}</span>
      </nav>

      <section className="store-detail-hero">
        <div className="store-detail-cover">
          <span className="store-detail-cover__index">
            CATÁLOGO · {item.asin}
          </span>
          <div className="store-detail-cover__book">
            {imageUrl && !imageFailed ? (
              <img
                src={imageUrl}
                alt={`Capa de ${item.title}`}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <span className="store-detail-cover__fallback">
                <small>ENTRE CAPÍTULOS</small>
                <strong>{item.title}</strong>
                <span>{item.authors[0] ?? "Uma nova leitura"}</span>
              </span>
            )}
          </div>
          <p>Imagem fornecida pela Amazon.</p>
        </div>

        <div className="store-detail-copy">
          <p className="eyebrow">
            {item.categories[0] ?? "LIVRO NA AMAZON"}
          </p>
          <h1>{item.title}</h1>
          {item.subtitle && <h2>{item.subtitle}</h2>}
          <p className="store-detail-copy__author">
            por{" "}
            <strong>
              {item.authors.length > 0
                ? item.authors.join(", ")
                : "autoria não informada"}
            </strong>
          </p>

          <dl className="store-detail-facts">
            {detailFacts.map((fact) => {
              const Icon = fact.icon;
              return (
                <div key={fact.label}>
                  <dt>
                    <Icon size={15} aria-hidden="true" />
                    {fact.label}
                  </dt>
                  <dd>{fact.value}</dd>
                </div>
              );
            })}
            {item.pageCount ? (
              <div>
                <dt>Páginas</dt>
                <dd>{item.pageCount}</dd>
              </div>
            ) : null}
          </dl>

          {item.categories.length > 0 && (
            <div className="store-detail-categories" aria-label="Categorias">
              {item.categories.slice(0, 5).map((category) => (
                <span key={category}>{category}</span>
              ))}
            </div>
          )}

          <div className="store-detail-list-action">
            {onWantToRead ? (
              <button
                className={`button button--secondary button--large${saved ? " is-saved" : ""}`}
                type="button"
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
                className="button button--secondary button--large"
                to={`/login?returnTo=${encodeURIComponent(
                  `/livraria/${item.asin}`,
                )}`}
              >
                <BookmarkPlus size={18} aria-hidden="true" />
                Entrar para guardar
              </Link>
            )}
            <p>
              Marque seu interesse para reencontrar este livro e consultar a
              oferta atual quando quiser.
            </p>
            {saveError && <span role="status">{saveError}</span>}
          </div>
        </div>

        <AmazonOfferPanel item={item} defaultAsin={normalizedAsin} />
      </section>

      <section className="store-detail-editorial">
        <article>
          <span className="store-detail-editorial__number">01</span>
          <p className="eyebrow">SOBRE A OBRA</p>
          <h2>Antes de abrir a primeira página</h2>
          {item.description ? (
            <p>{item.description}</p>
          ) : (
            <p className="muted-copy">
              A sinopse desta edição não foi informada pela Amazon.
            </p>
          )}
        </article>
        <aside>
          <p className="eyebrow">DETALHES DA EDIÇÃO</p>
          <dl>
            <div>
              <dt>ASIN</dt>
              <dd>{item.asin}</dd>
            </div>
            {item.isbn13 && (
              <div>
                <dt>ISBN-13</dt>
                <dd>{item.isbn13}</dd>
              </div>
            )}
            {item.isbn10 && (
              <div>
                <dt>ISBN-10</dt>
                <dd>{item.isbn10}</dd>
              </div>
            )}
            <div>
              <dt>Formatos localizados</dt>
              <dd>{Math.max(item.editions.length, 1)}</dd>
            </div>
          </dl>
        </aside>
      </section>
    </div>
  );
}
