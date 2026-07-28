export function formatDate(value: string): string {
  if (!value) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

export function readingProgress(
  currentPage: number | null,
  pageCount: number | null,
): number | null {
  if (currentPage === null || pageCount === null || pageCount <= 0) return null;
  return Math.min(Math.round((currentPage / pageCount) * 100), 100);
}

export function joinNatural(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} e ${items.at(-1)}`;
}
