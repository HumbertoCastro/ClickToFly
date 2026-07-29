import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookHeart,
  CircleAlert,
  LoaderCircle,
  RefreshCcw,
} from "lucide-react";
import { Link } from "react-router-dom";
import type {
  CatalogEdition,
  CatalogWork,
  RetailerDestination,
} from "../catalogTypes";
import { BookCover } from "../components/BookCover";
import { OpenLibraryDisclosure } from "../components/OpenLibraryDisclosure";
import { RetailerDestinations } from "../components/RetailerDestinations";
import {
  isValidIsbn,
  matchCatalogEdition,
  type BookCatalogClient,
} from "../lib/bookCatalog";
import { runtimeBookCatalogClient } from "../lib/catalogRuntime";
import type { JoinedEntry } from "../types";

interface ResolvedWishlistItem {
  entry: JoinedEntry;
  work: CatalogWork | null;
  editions: CatalogEdition[];
  destinations: RetailerDestination[];
  error: string;
}

export interface WhereToBuyPageProps {
  entries: readonly JoinedEntry[];
  client?: BookCatalogClient;
  onResolved?: (
    entry: JoinedEntry,
    work: CatalogWork,
    edition: CatalogEdition | null,
  ) => Promise<void> | void;
}

function resolveParams(entry: JoinedEntry) {
  const isbn = [entry.book.isbn13, entry.book.isbn10].find((candidate) =>
    isValidIsbn(candidate),
  );
  const sourceAsin =
    entry.book.source === "amazon" &&
    /^[A-Z0-9]{10}$/i.test(entry.book.sourceId ?? "")
      ? entry.book.sourceId ?? undefined
      : undefined;
  const storedAsin = entry.book.amazonAsins?.find((candidate) =>
    /^[A-Z0-9]{10}$/i.test(candidate),
  );

  return {
    ...(isbn ? { isbn } : {}),
    ...(sourceAsin || storedAsin
      ? { legacyAsin: sourceAsin || storedAsin }
      : {}),
    title: entry.book.title,
    author: entry.book.authors[0] ?? "",
  };
}

function legacyAsins(entry: JoinedEntry) {
  return [
    entry.book.source === "amazon" ? entry.book.sourceId ?? "" : "",
    ...(entry.book.amazonAsins ?? []),
  ].filter((candidate) => /^[A-Z0-9]{10}$/i.test(candidate));
}

function destinationsForEdition(
  destinations: readonly RetailerDestination[],
  editionKey: string,
) {
  return destinations.filter(
    (destination) =>
      destination.editionKey === editionKey ||
      destination.editionKey === null,
  );
}

export function WhereToBuyPage({
  entries,
  client = runtimeBookCatalogClient,
  onResolved,
}: WhereToBuyPageProps) {
  const [items, setItems] = useState<ResolvedWishlistItem[]>([]);
  const [loadedRequestKey, setLoadedRequestKey] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const persistedEntries = useRef(new Set<string>());
  const requestKey = useMemo(
    () =>
      entries
        .map(
          ({ entry, book }) =>
            `${entry.id}:${book.catalogWorkKey ?? ""}:${book.isbn13}:${book.sourceId ?? ""}`,
        )
        .sort()
        .join("|"),
    [entries],
  );
  const effectiveRequestKey = `${requestKey}\u0000${reloadKey}`;
  const loading = loadedRequestKey !== effectiveRequestKey;

  useEffect(() => {
    let ignore = false;

    Promise.all(
      entries.map(async (entry): Promise<ResolvedWishlistItem> => {
        try {
          const result = entry.book.catalogWorkKey
            ? await client.work(entry.book.catalogWorkKey)
            : await client.resolve(resolveParams(entry));
          const work =
            result.operation === "work" ? result.work : result.work;
          const editions = result.editions;
          const destinations = result.destinations;
          const matchedEdition = matchCatalogEdition(
            {
              catalogEditionKey: entry.book.catalogEditionKey,
              isbn10: entry.book.isbn10,
              isbn13: entry.book.isbn13,
              legacyAsins: legacyAsins(entry),
            },
            editions,
            destinations,
          );

          if (
            work &&
            !entry.book.catalogWorkKey &&
            onResolved &&
            !persistedEntries.current.has(entry.entry.id)
          ) {
            persistedEntries.current.add(entry.entry.id);
            try {
              await onResolved(entry, work, matchedEdition);
            } catch {
              persistedEntries.current.delete(entry.entry.id);
            }
          }

          return { entry, work, editions, destinations, error: "" };
        } catch (cause) {
          return {
            entry,
            work: null,
            editions: [],
            destinations: [],
            error:
              cause instanceof Error
                ? cause.message
                : "Não foi possível localizar esta obra.",
          };
        }
      }),
    )
      .then((results) => {
        if (!ignore) {
          setItems(results);
          setLoadedRequestKey(effectiveRequestKey);
        }
      });

    return () => {
      ignore = true;
    };
  }, [client, effectiveRequestKey, entries, onResolved]);

  const groups = useMemo(() => {
    const grouped = new Map<string, ResolvedWishlistItem[]>();
    for (const item of items) {
      const key = item.work?.workKey ?? `personal:${item.entry.book.id}`;
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    }
    return [...grouped.values()];
  }, [items]);

  return (
    <div className="page where-to-buy-page">
      <header className="where-to-buy-hero">
        <div>
          <p className="eyebrow">SUA LISTA · EDIÇÕES E CAMINHOS</p>
          <h1>Onde encontrar sua próxima leitura.</h1>
          <p>
            Reunimos as edições conhecidas de cada obra. Você escolhe a loja e
            confirma preço, estoque e entrega diretamente por lá.
          </p>
        </div>
        <span className="where-to-buy-hero__count">
          <BookHeart size={22} aria-hidden="true" />
          <strong>{entries.length}</strong>
          {entries.length === 1 ? "obra na lista" : "obras na lista"}
        </span>
      </header>

      {entries.length === 0 ? (
        <section className="where-to-buy-empty">
          <BookHeart size={34} aria-hidden="true" />
          <p className="eyebrow">LISTA EM BRANCO</p>
          <h2>Guarde uma obra para encontrá-la depois.</h2>
          <p>
            Na Livraria, use “Quero ler”. Ela aparecerá aqui com as edições e
            os três canais externos.
          </p>
          <Link className="button button--primary" to="/livraria">
            Explorar a Livraria <ArrowRight size={17} />
          </Link>
        </section>
      ) : loading ? (
        <section className="where-to-buy-loading" aria-busy="true">
          <LoaderCircle className="spin" size={28} aria-hidden="true" />
          <div>
            <strong>Organizando obras e edições…</strong>
            <p>Os livros antigos também são resolvidos sem perder seus dados.</p>
          </div>
        </section>
      ) : (
        <div className="where-to-buy-list">
          {groups.map((group) => {
            const resolved = group.find((item) => item.work) ?? group[0];
            const work = resolved.work;
            const personalBook = resolved.entry.book;
            return (
              <article
                className="where-to-buy-work"
                key={work?.workKey ?? personalBook.id}
              >
                <div className="where-to-buy-work__identity">
                  {work?.coverUrl ? (
                    <img src={work.coverUrl} alt={`Capa de ${work.title}`} />
                  ) : (
                    <BookCover book={personalBook} size="small" />
                  )}
                  <div>
                    <p className="eyebrow">
                      {work ? "OBRA LOCALIZADA" : "BUSCA ASSISTIDA"}
                    </p>
                    <h2>{work?.title ?? personalBook.title}</h2>
                    <p>
                      {(work?.authors ?? personalBook.authors).join(", ")}
                    </p>
                    {group.length > 1 && (
                      <small>{group.length} registros reunidos nesta obra</small>
                    )}
                  </div>
                </div>

                {work && resolved.editions.length > 0 ? (
                  <div className="where-to-buy-editions">
                    {resolved.editions.map((edition) => (
                      <section
                        className="where-to-buy-edition"
                        key={edition.editionKey}
                      >
                        <div className="where-to-buy-edition__metadata">
                          <p className="eyebrow">
                            {edition.language?.toUpperCase() || "IDIOMA NÃO INFORMADO"}
                          </p>
                          <h3>
                            {edition.publisher || "Editora não informada"}
                          </h3>
                          <p>
                            {[
                              edition.publishedDate,
                              edition.format,
                              edition.pageCount
                                ? `${edition.pageCount} páginas`
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          <small>
                            ISBN {edition.isbn13 || edition.isbn10 || "não informado"}
                          </small>
                        </div>
                        <RetailerDestinations
                          compact
                          title="Onde encontrar"
                          destinations={destinationsForEdition(
                            resolved.destinations,
                            edition.editionKey,
                          )}
                        />
                      </section>
                    ))}
                  </div>
                ) : (
                  <div className="where-to-buy-unresolved">
                    <CircleAlert size={23} aria-hidden="true" />
                    <div>
                      <strong>
                        {resolved.error ||
                          "Ainda não encontramos uma correspondência segura."}
                      </strong>
                      <p>
                        Abra uma busca pelo título e escolha a obra correta para
                        vincular este registro.
                      </p>
                    </div>
                    <Link
                      className="button button--secondary"
                      to={`/livraria?${new URLSearchParams({
                        q: personalBook.title,
                        linkBookId: personalBook.id,
                        linkEntryId: resolved.entry.entry.id,
                      }).toString()}`}
                    >
                      Localizar obra
                    </Link>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {entries.length > 0 && !loading && (
        <button
          className="button button--secondary where-to-buy-refresh"
          type="button"
          onClick={() => {
            client.clearCache();
            setReloadKey((value) => value + 1);
          }}
        >
          <RefreshCcw size={16} /> Atualizar catálogo
        </button>
      )}

      <OpenLibraryDisclosure />
    </div>
  );
}
