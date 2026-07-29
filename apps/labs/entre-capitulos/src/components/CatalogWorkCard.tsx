import { useState } from "react";
import {
  ArrowUpRight,
  BookmarkPlus,
  Check,
  Languages,
  LibraryBig,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { CatalogWork } from "../catalogTypes";

export interface CatalogWorkCardProps {
  work: CatalogWork;
  onWantToRead?: (work: CatalogWork) => Promise<void> | void;
  isSaved?: boolean;
  priority?: boolean;
  detailSearch?: string;
  editorialLabel?: string;
}

function languageLabel(languages: readonly string[]) {
  if (languages.length === 0) return "Idioma não informado";
  if (languages.length === 1) {
    const value = languages[0].toLocaleLowerCase("pt-BR");
    const labels: Record<string, string> = {
      por: "Português",
      pt: "Português",
      eng: "Inglês",
      en: "Inglês",
      spa: "Espanhol",
      es: "Espanhol",
      fra: "Francês",
      fr: "Francês",
    };
    return labels[value] ?? languages[0].toLocaleUpperCase("pt-BR");
  }
  return `${languages.length} idiomas`;
}

function editionLabel(count: number) {
  if (count === 1) return "1 edição localizada";
  return `${count} edições localizadas`;
}

export function CatalogWorkCard({
  work,
  onWantToRead,
  isSaved = false,
  priority = false,
  detailSearch = "",
  editorialLabel,
}: CatalogWorkCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [saveError, setSaveError] = useState("");
  const detailHref = `/livraria/obra/${encodeURIComponent(work.workKey)}${detailSearch}`;
  const effectiveSaved = isSaved || saved;

  async function handleWantToRead() {
    if (!onWantToRead || saving || effectiveSaved) return;
    setSaving(true);
    setSaveError("");

    try {
      await onWantToRead(work);
      setSaved(true);
    } catch {
      setSaveError("Não foi possível guardar esta obra agora.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="catalog-work-card">
      <Link
        className="catalog-work-card__cover"
        to={detailHref}
        aria-label={`Conhecer a obra ${work.title}`}
      >
        {work.coverUrl && !imageFailed ? (
          <img
            src={work.coverUrl}
            alt={`Capa de ${work.title}`}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="catalog-work-card__fallback">
            <small>ENTRE CAPÍTULOS</small>
            <strong>{work.title}</strong>
            <span>{work.authors[0] ?? "Uma obra para descobrir"}</span>
          </span>
        )}

        {editorialLabel && (
          <span className="catalog-work-card__editorial">
            <Sparkles size={13} aria-hidden="true" />
            {editorialLabel}
          </span>
        )}

        <span className="catalog-work-card__corner" aria-hidden="true">
          <ArrowUpRight size={17} />
        </span>
      </Link>

      <div className="catalog-work-card__body">
        <div className="catalog-work-card__kicker">
          <span>{work.subjects[0] ?? "Literatura"}</span>
          {work.firstPublishedYear ? (
            <span>desde {work.firstPublishedYear}</span>
          ) : null}
        </div>

        <Link className="catalog-work-card__title" to={detailHref}>
          {work.title}
        </Link>
        <p className="catalog-work-card__author">
          {work.authors.length > 0
            ? work.authors.join(", ")
            : "Autoria não informada"}
        </p>
        {work.editorialText && (
          <p className="catalog-work-card__editorial-copy">
            {work.editorialText}
          </p>
        )}

        <div
          className="catalog-work-card__metadata"
          aria-label="Informações da obra"
        >
          <span>
            <LibraryBig size={14} aria-hidden="true" />
            {editionLabel(work.editionCount)}
          </span>
          <span>
            <Languages size={14} aria-hidden="true" />
            {languageLabel(work.languages)}
          </span>
        </div>

        <div className="catalog-work-card__actions">
          <Link to={detailHref}>
            Ver edições
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>

          {onWantToRead ? (
            <button
              className={`catalog-work-card__save${effectiveSaved ? " is-saved" : ""}`}
              type="button"
              onClick={handleWantToRead}
              disabled={saving || effectiveSaved}
              aria-label={
                effectiveSaved
                  ? `${work.title} está na sua lista`
                  : `Marcar interesse em ler ${work.title}`
              }
            >
              {effectiveSaved ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <BookmarkPlus size={16} aria-hidden="true" />
              )}
              <span>
                {effectiveSaved
                  ? "Na lista"
                  : saving
                    ? "Guardando"
                    : "Quero ler"}
              </span>
            </button>
          ) : (
            <Link
              className="catalog-work-card__save"
              to={`/login?returnTo=${encodeURIComponent(detailHref)}`}
              aria-label={`Entrar para marcar interesse em ler ${work.title}`}
            >
              <BookmarkPlus size={16} aria-hidden="true" />
              <span>Quero ler</span>
            </Link>
          )}
        </div>

        {saveError && (
          <p className="catalog-work-card__error" role="status">
            {saveError}
          </p>
        )}
      </div>
    </article>
  );
}
