import {
  ArrowRight,
  BookCheck,
  BookOpenText,
  Bookmark,
  MoreHorizontal,
  Star,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { BookCard } from "../components/BookCard";
import { BookMockup } from "../components/BookMockup";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import { useApp } from "../context/AppContext";
import { readingProgress } from "../lib/format";
import { calculateAverageRating } from "../lib/rating";

export function DashboardPage() {
  const { activeProfile, activeProfileId, joinedEntries } = useApp();

  if (!activeProfileId) return <Navigate to="/profiles" replace />;
  if (!activeProfile) return <Navigate to="/profiles" replace />;

  const entries = joinedEntries.filter(
    (item) => item.profile.id === activeProfile.id,
  );
  const currentlyReading = entries.find(
    (item) => item.entry.status === "reading",
  );
  const completed = entries.filter(
    (item) => item.entry.status === "completed",
  );
  const wishlist = entries.filter(
    (item) => item.entry.status === "want_to_read",
  );
  const averages = entries
    .map((item) => item.averageRating)
    .filter((value): value is number => value !== null);
  const householdAverage = calculateAverageRating(
    Object.fromEntries(averages.map((value, index) => [`value_${index}`, value])),
  );
  const progress = currentlyReading
    ? readingProgress(
        currentlyReading.entry.currentPage,
        currentlyReading.book.pageCount,
      )
    : null;

  return (
    <div className="page dashboard-page">
      <header className="dashboard-hero">
        <div className="dashboard-hero__copy">
          <p className="eyebrow">CAPÍTULO ATUAL</p>
          <h1>
            Olá, {activeProfile.name}.<br />
            <em>O que vamos ler hoje?</em>
          </h1>
        </div>
        <img
          className="dashboard-hero__still-life"
          src={`${import.meta.env.BASE_URL}illustrations/library-still-life.jpg`}
          alt=""
        />
      </header>

      <section className="stats-strip" aria-label="Resumo da estante">
        <article>
          <span className="stats-strip__icon">
            <BookOpenText size={22} aria-hidden="true" />
          </span>
          <span>
            <strong>{currentlyReading ? 1 : 0}</strong>
            lendo agora
            <small>
              {currentlyReading ? "Continue sua leitura" : "Comece uma leitura"}
            </small>
          </span>
        </article>
        <article>
          <span className="stats-strip__icon">
            <BookCheck size={22} aria-hidden="true" />
          </span>
          <span>
            <strong>{completed.length}</strong>
            {completed.length === 1 ? " livro lido" : " livros lidos"}
            <small>{completed.length > 0 ? "Parabéns" : "Sua história começa aqui"}</small>
          </span>
        </article>
        <article>
          <span className="stats-strip__icon">
            <Bookmark size={22} aria-hidden="true" />
          </span>
          <span>
            <strong>{wishlist.length}</strong>
            na lista
            <small>Adicione livros</small>
          </span>
        </article>
        <article className="stats-strip__rating">
          <span className="stats-strip__icon">
            <Star size={22} aria-hidden="true" />
          </span>
          <span>
            <strong>
              {householdAverage?.toLocaleString("pt-BR", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              }) ?? "—"}
            </strong>
            média geral
            <small>
              {householdAverage === null ? "Avalie suas leituras" : "Muito bom"}
            </small>
          </span>
        </article>
      </section>

      {entries.length === 0 ? (
        <EmptyState
          title="Sua estante espera a primeira história"
          description="Pesquise uma obra ou registre aquele livro que ainda mora na memória."
        />
      ) : (
        <>
          {currentlyReading && (
            <section className="current-reading">
              <span className="current-reading__flag">EM LEITURA</span>
              <div className="current-reading__cover">
                <BookMockup book={currentlyReading.book} />
              </div>
              <div className="current-reading__copy">
                <StatusBadge status="reading" />
                <h2>{currentlyReading.book.title}</h2>
                <p className="current-reading__author">
                  {currentlyReading.book.authors.join(", ")}
                </p>
                <div className="reading-progress">
                  <div className="reading-progress__label">
                    <span>
                      Página {currentlyReading.entry.currentPage ?? "—"}
                      {currentlyReading.book.pageCount
                        ? ` de ${currentlyReading.book.pageCount}`
                        : ""}
                    </span>
                    <strong>Em andamento</strong>
                  </div>
                  <div
                    className="reading-progress__track"
                    role="progressbar"
                    aria-label={`Progresso de ${currentlyReading.book.title}`}
                    aria-valuenow={progress ?? undefined}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span style={{ width: `${progress ?? 12}%` }} />
                  </div>
                </div>
                <div className="current-reading__actions">
                  <Link
                    className="button button--primary"
                    to={`/books/${currentlyReading.entry.id}`}
                  >
                    Continuar leitura <ArrowRight size={17} />
                  </Link>
                  <Link
                    className="button button--secondary current-reading__rating"
                    to={`/books/${currentlyReading.entry.id}/edit`}
                  >
                    <Star size={17} aria-hidden="true" /> Avaliar livro
                  </Link>
                  <Link
                    className="icon-button current-reading__more"
                    to={`/books/${currentlyReading.entry.id}`}
                    aria-label={`Ver detalhes de ${currentlyReading.book.title}`}
                  >
                    <MoreHorizontal size={18} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </section>
          )}

          <section className="section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">ÚLTIMAS PÁGINAS</p>
                <h2>Adicionados recentemente</h2>
              </div>
              <Link className="text-link" to="/library">
                Ver estante completa <ArrowRight size={16} />
              </Link>
            </div>
            <div className="book-grid">
              {entries.slice(0, 4).map((item) => (
                <BookCard item={item} key={item.entry.id} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
