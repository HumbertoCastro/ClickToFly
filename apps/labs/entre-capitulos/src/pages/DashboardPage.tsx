import { ArrowRight, BookCheck, BookOpenText, Bookmark, Sparkles } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { BookCard } from "../components/BookCard";
import { BookCover } from "../components/BookCover";
import { EmptyState } from "../components/EmptyState";
import { RatingDisplay } from "../components/RatingDisplay";
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
      <header className="page-heading page-heading--dashboard">
        <div>
          <p className="eyebrow">CAPÍTULO ATUAL</p>
          <h1>
            Olá, {activeProfile.name}.<br />
            <em>O que vamos ler hoje?</em>
          </h1>
        </div>
        <p className="page-heading__aside">
          Sua estante guarda {entries.length}{" "}
          {entries.length === 1 ? "história" : "histórias"} até aqui.
        </p>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          title="Sua estante espera a primeira história"
          description="Pesquise uma obra ou registre aquele livro que ainda mora na memória."
        />
      ) : (
        <>
          <section className="stats-strip" aria-label="Resumo da estante">
            <div>
              <BookOpenText size={20} />
              <span>
                <strong>{currentlyReading ? 1 : 0}</strong>
                lendo agora
              </span>
            </div>
            <div>
              <BookCheck size={20} />
              <span>
                <strong>{completed.length}</strong>
                {completed.length === 1 ? " livro lido" : " livros lidos"}
              </span>
            </div>
            <div>
              <Bookmark size={20} />
              <span>
                <strong>{wishlist.length}</strong>
                na lista
              </span>
            </div>
            <div className="stats-strip__rating">
              <Sparkles size={20} />
              <span>
                <strong>
                  {householdAverage?.toLocaleString("pt-BR", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  }) ?? "—"}
                </strong>
                média geral
              </span>
            </div>
          </section>

          {currentlyReading && (
            <section className="current-reading">
              <div className="current-reading__index">
                <span>EM LEITURA</span>
                <strong>01</strong>
              </div>
              <BookCover book={currentlyReading.book} size="large" />
              <div className="current-reading__copy">
                <StatusBadge status="reading" />
                <h2>{currentlyReading.book.title}</h2>
                <p className="current-reading__author">
                  {currentlyReading.book.authors.join(", ")}
                </p>
                {currentlyReading.entry.review && (
                  <blockquote>“{currentlyReading.entry.review}”</blockquote>
                )}
                <div className="reading-progress">
                  <div className="reading-progress__label">
                    <span>
                      Página {currentlyReading.entry.currentPage ?? "—"}
                      {currentlyReading.book.pageCount
                        ? ` de ${currentlyReading.book.pageCount}`
                        : ""}
                    </span>
                    <strong>{progress !== null ? `${progress}%` : "Em andamento"}</strong>
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
                  <RatingDisplay value={currentlyReading.averageRating} />
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
