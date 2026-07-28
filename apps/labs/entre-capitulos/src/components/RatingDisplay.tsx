import { Sparkles } from "lucide-react";
import { formatRating } from "../lib/rating";

export function RatingDisplay({
  value,
  compact = false,
}: {
  value: number | null;
  compact?: boolean;
}) {
  return (
    <span
      className={`rating-display ${compact ? "rating-display--compact" : ""}`}
      aria-label={formatRating(value)}
    >
      <Sparkles size={compact ? 14 : 17} aria-hidden="true" />
      {value === null
        ? compact
          ? "—"
          : "Sem avaliação"
        : value.toLocaleString("pt-BR", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
      {!compact && value !== null && <small>/ 10</small>}
    </span>
  );
}
