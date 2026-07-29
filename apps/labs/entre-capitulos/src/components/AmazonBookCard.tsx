import { useState } from "react";
import {
  ArrowUpRight,
  BadgePercent,
  BookmarkPlus,
  Check,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import type {
  AmazonCatalogItem,
  AmazonCurrentOffer,
} from "../amazonTypes";

export interface AmazonBookCardProps {
  item: AmazonCatalogItem;
  onWantToRead?: (
    item: AmazonCatalogItem,
  ) => Promise<void> | void;
  isSaved?: boolean;
  priority?: boolean;
  detailSearch?: string;
}

function isFreshOffer(
  offer: AmazonCurrentOffer | null | undefined,
): offer is AmazonCurrentOffer {
  if (!offer?.expiresAt) return false;
  const expiresAt = new Date(offer.expiresAt).getTime();
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

function currentOffer(item: AmazonCatalogItem) {
  if (isFreshOffer(item.offer)) return item.offer;
  return item.editions
    .map((edition) => edition.offer)
    .find((offer): offer is AmazonCurrentOffer => isFreshOffer(offer));
}

export function AmazonBookCard({
  item,
  onWantToRead,
  isSaved = false,
  priority = false,
  detailSearch = "",
}: AmazonBookCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [saveError, setSaveError] = useState("");
  const effectiveSaved = saved || isSaved;
  const detailHref =
    `/livraria/${encodeURIComponent(item.asin)}${detailSearch}`;
  const offer = currentOffer(item);
  const imageUrl =
    item.imageUrl ||
    item.editions.find((edition) => edition.imageUrl)?.imageUrl ||
    "";
  const formatLabels = [
    ...new Set(item.editions.map((edition) => edition.label).filter(Boolean)),
  ].slice(0, 2);

  async function handleWantToRead() {
    if (!onWantToRead || saving || effectiveSaved) return;
    setSaving(true);
    setSaveError("");
    try {
      await onWantToRead(item);
      setSaved(true);
    } catch {
      setSaveError("Não foi possível guardar este livro agora.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="amazon-book-card">
      <Link
        className="amazon-book-card__cover"
        to={detailHref}
        aria-label={`Ver detalhes de ${item.title}`}
      >
        {imageUrl && !imageFailed ? (
          <img
            src={imageUrl}
            alt={`Capa de ${item.title}`}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="amazon-book-card__fallback">
            <small>ENTRE CAPÍTULOS</small>
            <strong>{item.title}</strong>
            <span>{item.authors[0] ?? "Uma nova leitura"}</span>
          </span>
        )}
        <span className="amazon-book-card__corner" aria-hidden="true">
          <ArrowUpRight size={17} />
        </span>
        {item.featured && (
          <span className="amazon-book-card__featured">
            <Sparkles size={13} aria-hidden="true" />
            Em destaque
          </span>
        )}
      </Link>

      <div className="amazon-book-card__body">
        <div className="amazon-book-card__kicker">
          <span>{item.categories[0] ?? "Livros"}</span>
          {offer?.savingsPercentage ? (
            <span className="amazon-book-card__saving">
              <BadgePercent size={13} aria-hidden="true" />
              {Math.round(offer.savingsPercentage)}% de economia
            </span>
          ) : null}
        </div>
        <Link
          className="amazon-book-card__title"
          to={detailHref}
        >
          {item.title}
        </Link>
        <p className="amazon-book-card__author">
          {item.authors.length > 0
            ? item.authors.join(", ")
            : "Autoria não informada"}
        </p>

        {formatLabels.length > 0 && (
          <div className="amazon-book-card__formats" aria-label="Formatos disponíveis">
            {formatLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        )}

        <div className="amazon-book-card__commercial">
          <div>
            <small>{offer ? "Preço atual na Amazon" : "Disponível na Amazon"}</small>
            <strong>{offer?.displayPrice ?? "Consulte o preço na Amazon"}</strong>
          </div>
          {onWantToRead ? (
            <button
              className={`amazon-book-card__save${effectiveSaved ? " is-saved" : ""}`}
              type="button"
              onClick={handleWantToRead}
              disabled={saving || effectiveSaved}
              aria-label={
                effectiveSaved
                  ? `${item.title} está na sua lista`
                  : `Marcar interesse em ler ${item.title}`
              }
            >
              {effectiveSaved ? (
                <Check size={17} aria-hidden="true" />
              ) : (
                <BookmarkPlus size={17} aria-hidden="true" />
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
              className="amazon-book-card__save"
              to={`/login?returnTo=${encodeURIComponent(
                `/livraria/${item.asin}`,
              )}`}
              aria-label={`Entrar para marcar interesse em ler ${item.title}`}
            >
              <BookmarkPlus size={17} aria-hidden="true" />
              <span>Quero ler</span>
            </Link>
          )}
        </div>
        {saveError && (
          <p className="amazon-book-card__error" role="status">
            {saveError}
          </p>
        )}
      </div>
    </article>
  );
}
