import type { RatingScores } from "../types";

export function calculateAverageRating(scores: RatingScores): number | null {
  const values = Object.values(scores).filter(
    (value): value is number =>
      typeof value === "number" && value >= 1 && value <= 10,
  );

  if (values.length === 0) return null;

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(average * 10) / 10;
}

export function formatRating(value: number | null): string {
  if (value === null) return "Sem avaliação";
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} / 10`;
}
