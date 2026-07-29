import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Edit3,
  Languages,
  Library,
  MapPin,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import type {
  CatalogEdition,
  CatalogWork,
  RetailerDestination,
} from "../catalogTypes";
import { BookMockup } from "../components/BookMockup";
import { RetailerDestinations } from "../components/RetailerDestinations";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { RatingDisplay } from "../components/RatingDisplay";
import { StatusBadge } from "../components/StatusBadge";
import { ratingCriteria } from "../constants";
import { useApp } from "../context/AppContext";
import {
  isValidIsbn,
  matchCatalogEdition,
} from "../lib/bookCatalog";
import { runtimeBookCatalogClient } from "../lib/catalogRuntime";
import { formatDate, readingProgress } from "../lib/format";

interface PersonalCatalogResult {
  requestKey: string;
  work: CatalogWork | null;
  editions: CatalogEdition[];
  destinations: RetailerDestination[];
  error: string;
}

export function BookDetailPage() {
  const { entryId } = useParams();
  const {
    joinedEntries,
    deleteEntry,
    linkCatalogResolution,
  } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [deleting, setDeleting] = useState(false);
  const [catalogReloadKey, setCatalogReloadKey] = useState(0);
  const catalogPersistedEntries = useRef(new Set<string>());
  const item = joinedEntries.find((candidate) => candidate.entry.id === entryId);
  const [catalogResult, setCatalogResult] =
    useState<PersonalCatalogResult | null>(null);
  const catalogRequestKey = item
    ? [
        item.book.catalogWorkKey,
        item.book.isbn13,
        item.book.isbn10,
        item.book.sourceId,
        item.book.title,
        catalogReloadKey,
      ].join("\u0000")
    : "";
  const catalogLoading =
    Boolean(item) && catalogResult?.requestKey !== catalogRequestKey;
  const locationState = location.state as
    | { shelfTransitionEntryId?: string }
    | null;
  const arrivedFromShelf =
    locationState?.shelfTransitionEntryId === item?.entry.id;

  useEffect(() => {
    if (arrivedFromShelf) {
      titleRef.current?.focus({ preventScroll: true });
    }
  }, [arrivedFromShelf]);

  useEffect(() => {
    if (!item) return;

    let ignore = false;
    const validIsbn = [item.book.isbn13, item.book.isbn10].find(isValidIsbn);
    const legacyAsin =
      item.book.source === "amazon" &&
      /^[A-Z0-9]{10}$/i.test(item.book.sourceId ?? "")
        ? item.book.sourceId ?? undefined
        : item.book.amazonAsins?.find((candidate) =>
            /^[A-Z0-9]{10}$/i.test(candidate),
          );
    const request = item.book.catalogWorkKey
      ? runtimeBookCatalogClient.work(item.book.catalogWorkKey)
      : runtimeBookCatalogClient.resolve({
          ...(validIsbn ? { isbn: validIsbn } : {}),
          ...(legacyAsin ? { legacyAsin } : {}),
          title: item.book.title,
          author: item.book.authors[0] ?? "",
        });

    request
      .then(async (result) => {
        const matchedEdition = matchCatalogEdition(
          {
            catalogEditionKey: item.book.catalogEditionKey,
            isbn10: item.book.isbn10,
            isbn13: item.book.isbn13,
            legacyAsins: [
              item.book.source === "amazon"
                ? item.book.sourceId ?? ""
                : "",
              ...(item.book.amazonAsins ?? []),
            ],
          },
          result.editions,
          result.destinations,
        );
        if (
          result.work &&
          !item.book.catalogWorkKey &&
          !catalogPersistedEntries.current.has(item.entry.id)
        ) {
          catalogPersistedEntries.current.add(item.entry.id);
          try {
            await linkCatalogResolution(
              result.work,
              matchedEdition,
              {
                bookId: item.book.id,
                entryId: item.entry.id,
              },
            );
          } catch (cause) {
            catalogPersistedEntries.current.delete(item.entry.id);
            console.error(
              "Não foi possível persistir a resolução do catálogo.",
              cause,
            );
          }
        }
        if (!ignore) {
          setCatalogResult({
            requestKey: catalogRequestKey,
            work: result.work,
            editions: result.editions,
            destinations: result.destinations,
            error: result.work
              ? ""
              : "Ainda não encontramos uma correspondência segura.",
          });
        }
      })
      .catch((cause) => {
        if (!ignore) {
          setCatalogResult({
            requestKey: catalogRequestKey,
            work: null,
            editions: [],
            destinations: [],
            error:
              cause instanceof Error
                ? cause.message
                : "Não foi possível consultar o catálogo agora.",
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, [catalogRequestKey, item, linkCatalogResolution]);

  if (!item) {
    return (
      <div className="page not-found">
        <p className="eyebrow">PÁGINA AUSENTE</p>
        <h1>Este livro não está mais na estante.</h1>
        <Link className="button button--primary" to="/library">
          Voltar para a estante
        </Link>
      </div>
    );
  }

  const progress = readingProgress(
    item.entry.currentPage,
    item.book.pageCount,
  );
  const currentEntryId = item.entry.id;
  const currentBookTitle = item.book.title;
  const currentProfileName = item.profile.name;
  const locateEditionSearch = new URLSearchParams({
    q: item.book.title,
    linkBookId: item.book.id,
    linkEntryId: item.entry.id,
  }).toString();
  const catalogEdition = catalogResult
    ? matchCatalogEdition(
        {
          catalogEditionKey: item.book.catalogEditionKey,
          isbn10: item.book.isbn10,
          isbn13: item.book.isbn13,
          legacyAsins: [
            item.book.source === "amazon"
              ? item.book.sourceId ?? ""
              : "",
            ...(item.book.amazonAsins ?? []),
          ],
        },
        catalogResult.editions,
        catalogResult.destinations,
      )
    : null;
  const catalogDestinations = catalogResult
    ? catalogResult.destinations.filter(
        (destination) =>
          destination.editionKey === null ||
          destination.editionKey === catalogEdition?.editionKey,
      )
    : [];

  async function handleDelete() {
    if (
      !window.confirm(
        `Remover “${currentBookTitle}” da estante de ${currentProfileName}?`,
      )
    )
      return;
    setDeleting(true);
    try {
      await deleteEntry(currentEntryId);
      navigate("/library");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className={`page book-detail-page${arrivedFromShelf ? " book-detail-page--from-shelf" : ""}`}
    >
      <div className="detail-topbar">
        <Link className="back-link" to="/library">
          <ArrowLeft size={17} /> Voltar para a estante
        </Link>
        <div>
          <Link
            className="button button--secondary"
            to={`/books/${item.entry.id}/edit`}
          >
            <Edit3 size={16} /> Editar registro
          </Link>
          <button
            className="icon-button icon-button--danger"
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            aria-label={`Remover ${item.book.title} da estante`}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <section className="detail-hero">
        <div className="detail-hero__cover">
          <span className="detail-hero__index">ARQUIVO · {item.entry.id.slice(0, 4)}</span>
          <div
            className="detail-hero__book-transition"
            style={
              arrivedFromShelf
                ? { viewTransitionName: "active-shelf-book" }
                : undefined
            }
          >
            <BookMockup book={item.book} />
          </div>
          <div className="profile-byline profile-byline--detail">
            <ProfileAvatar
              profile={item.profile}
              className="profile-byline__avatar"
              decorative
            />
            Estante de {item.profile.name}
          </div>
        </div>
        <div className="detail-hero__copy">
          <div className="detail-hero__status">
            <StatusBadge status={item.entry.status} />
            <RatingDisplay value={item.averageRating} />
          </div>
          <h1 ref={titleRef} tabIndex={-1}>
            {item.book.title}
          </h1>
          {item.book.subtitle && <h2>{item.book.subtitle}</h2>}
          <p className="detail-hero__author">
            por {item.book.authors.join(", ")}
          </p>
          <div className="detail-metadata">
            {item.book.publisher && (
              <span>
                <Library size={15} /> {item.book.publisher}
              </span>
            )}
            {item.book.publishedDate && (
              <span>
                <CalendarDays size={15} /> {item.book.publishedDate}
              </span>
            )}
            {item.book.language && (
              <span>
                <Languages size={15} /> {item.book.language.toUpperCase()}
              </span>
            )}
            {item.book.pageCount && <span>{item.book.pageCount} páginas</span>}
          </div>
          {item.entry.categories.length > 0 && (
            <div className="category-list">
              {item.entry.categories.map((category) => (
                <span key={category}>{category}</span>
              ))}
            </div>
          )}
          {item.entry.status === "reading" && (
            <div className="detail-progress">
              <div>
                <span>Progresso de leitura</span>
                <strong>{progress !== null ? `${progress}%` : "Em andamento"}</strong>
              </div>
              <div
                className="reading-progress__track"
                role="progressbar"
                aria-valuenow={progress ?? undefined}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${progress ?? 12}%` }} />
              </div>
              <small>
                Página {item.entry.currentPage ?? "não informada"}
                {item.book.pageCount ? ` de ${item.book.pageCount}` : ""}
              </small>
            </div>
          )}
          {(item.entry.startedAt || item.entry.endedAt) && (
            <div className="reading-dates">
              <div>
                <small>INÍCIO</small>
                <strong>{formatDate(item.entry.startedAt)}</strong>
              </div>
              <span aria-hidden="true" />
              <div>
                <small>
                  {item.entry.status === "abandoned" ? "ABANDONADO" : "TÉRMINO"}
                </small>
                <strong>{formatDate(item.entry.endedAt)}</strong>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="personal-purchase-section">
        <div className="personal-purchase-section__intro">
          <p className="eyebrow">ONDE ENCONTRAR</p>
          <h2>Da sua estante para uma edição disponível no catálogo.</h2>
          <p>
            Abrimos buscas ou links diretos nas lojas externas. Preço, estoque,
            entrega e atendimento são confirmados somente no destino.
          </p>
        </div>
        {catalogLoading ? (
          <aside
            className="personal-purchase-section__loading"
            aria-busy="true"
          >
            <span />
            <span />
            <span />
            <p className="sr-only">Localizando a obra e suas edições</p>
          </aside>
        ) : catalogResult?.work && catalogDestinations.length > 0 ? (
          <RetailerDestinations
            title={
              catalogEdition
                ? `Onde encontrar esta edição`
                : "Onde encontrar esta obra"
            }
            destinations={catalogDestinations}
          />
        ) : (
          <aside className="personal-purchase-section__empty">
            <MapPin size={24} aria-hidden="true" />
            <div>
              <strong>
                {catalogResult?.error ||
                  "Esta obra ainda precisa ser localizada no catálogo."}
              </strong>
              <p>
                O registro pessoal continua intacto. Faça uma busca assistida
                por título, autor ou ISBN para escolher a obra correta.
              </p>
            </div>
            {catalogResult?.error ? (
              <button
                className="button button--secondary"
                type="button"
                onClick={() => setCatalogReloadKey((value) => value + 1)}
              >
                Tentar novamente
              </button>
            ) : (
              <Link
                className="button button--secondary"
                to={`/livraria?${locateEditionSearch}`}
              >
                Localizar obra
              </Link>
            )}
          </aside>
        )}
      </section>

      <section className="detail-reading">
        <div className="detail-reading__main">
          <article className="editorial-section">
            <span className="editorial-section__number">01</span>
            <p className="eyebrow">NOTAS DE LEITURA</p>
            <h2>O que eu achei</h2>
            {item.entry.review ? (
              <blockquote>{item.entry.review}</blockquote>
            ) : (
              <p className="muted-copy">Nenhuma impressão registrada ainda.</p>
            )}
          </article>

          <article className="editorial-section">
            <span className="editorial-section__number">02</span>
            <p className="eyebrow">A HISTÓRIA EM MINHAS PALAVRAS</p>
            <h2>Meu resumo</h2>
            {item.entry.storySummary ? (
              item.entry.containsSpoilers ? (
                <details className="spoiler-card">
                  <summary>
                    <AlertTriangle size={17} />
                    Este texto contém spoilers
                    <span>Clique para revelar</span>
                  </summary>
                  <p>{item.entry.storySummary}</p>
                </details>
              ) : (
                <p className="long-copy">{item.entry.storySummary}</p>
              )
            ) : (
              <p className="muted-copy">Nenhum resumo pessoal registrado.</p>
            )}
          </article>

          {item.book.description && (
            <article className="editorial-section editorial-section--synopsis">
              <span className="editorial-section__number">03</span>
              <p className="eyebrow">SOBRE A OBRA</p>
              <h2>Sinopse editorial</h2>
              <p className="long-copy">{item.book.description}</p>
            </article>
          )}
        </div>

        <aside className="rating-panel">
          <div className="rating-panel__heading">
            <p className="eyebrow">MINHA AVALIAÇÃO</p>
            <RatingDisplay value={item.averageRating} />
          </div>
          <div className="rating-bars">
            {ratingCriteria.map((criterion) => {
              const value = item.entry.ratings[criterion.key];
              return (
                <div className="rating-bar" key={criterion.key}>
                  <div>
                    <span>{criterion.label}</span>
                    <strong>{value ? `${value} / 10` : "—"}</strong>
                  </div>
                  <div
                    className="rating-bar__track"
                    role="meter"
                    aria-label={`${criterion.label}: ${value ? `${value} de 10` : "sem nota"}`}
                    aria-valuenow={value}
                    aria-valuemin={1}
                    aria-valuemax={10}
                  >
                    <span style={{ width: `${(value ?? 0) * 10}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="rating-panel__note">
            A média considera apenas os critérios preenchidos.
          </p>
        </aside>
      </section>

      <div className="detail-bottom-actions">
        <Link
          className="button button--primary"
          to={`/books/${item.entry.id}/edit`}
        >
          <RotateCcw size={16} /> Atualizar minha leitura
        </Link>
      </div>
    </div>
  );
}
