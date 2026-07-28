import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Edit3,
  Languages,
  Library,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BookCover } from "../components/BookCover";
import { RatingDisplay } from "../components/RatingDisplay";
import { StatusBadge } from "../components/StatusBadge";
import { ratingCriteria } from "../constants";
import { useApp } from "../context/AppContext";
import { formatDate, readingProgress } from "../lib/format";

export function BookDetailPage() {
  const { entryId } = useParams();
  const { joinedEntries, deleteEntry } = useApp();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const item = joinedEntries.find((candidate) => candidate.entry.id === entryId);

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
    <div className="page book-detail-page">
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
          <BookCover book={item.book} size="large" />
          <div className="profile-byline profile-byline--detail">
            <span
              className="profile-byline__avatar"
              style={{ backgroundColor: item.profile.color }}
            >
              {item.profile.initials}
            </span>
            Estante de {item.profile.name}
          </div>
        </div>
        <div className="detail-hero__copy">
          <div className="detail-hero__status">
            <StatusBadge status={item.entry.status} />
            <RatingDisplay value={item.averageRating} />
          </div>
          <h1>{item.book.title}</h1>
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
