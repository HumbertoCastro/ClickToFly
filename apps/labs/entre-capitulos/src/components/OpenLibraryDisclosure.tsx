import { BookOpen, ExternalLink, Info } from "lucide-react";

export interface OpenLibraryDisclosureProps {
  compact?: boolean;
  className?: string;
}

export function OpenLibraryDisclosure({
  compact = false,
  className = "",
}: OpenLibraryDisclosureProps) {
  const classes = [
    "catalog-disclosure",
    compact ? "catalog-disclosure--compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside
      className={classes}
      aria-label="Informações sobre catálogo e links externos"
    >
      <span className="catalog-disclosure__icon" aria-hidden="true">
        {compact ? <Info size={16} /> : <BookOpen size={18} />}
      </span>
      <div>
        <span className="catalog-disclosure__label">Catálogo aberto</span>
        <strong>Dados bibliográficos fornecidos pelo Open Library.</strong>
        {!compact && (
          <p>
            Capas e metadados podem variar entre edições. O Entre Capítulos não
            vende livros: você escolhe um destino e conclui a compra no site
            externo.
          </p>
        )}
        <a
          href="https://openlibrary.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Conhecer o Open Library
          <span className="sr-only"> (abre em nova aba)</span>
          <ExternalLink size={13} aria-hidden="true" />
        </a>
      </div>
    </aside>
  );
}
