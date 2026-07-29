import { useMemo, useState } from "react";
import { Filter, Plus, Search, SlidersHorizontal } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { WoodenShelf } from "../components/WoodenShelf";
import { statusMeta } from "../constants";
import { useApp } from "../context/AppContext";
import type { BookStatus } from "../types";

type SortKey = "recent" | "title" | "rating";

export function LibraryPage() {
  const { activeProfile, activeProfileId, joinedEntries } = useApp();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<BookStatus | "all">("all");
  const [category, setCategory] = useState("all");
  const [minimumRating, setMinimumRating] = useState("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const baseEntries = useMemo(
    () =>
      joinedEntries.filter(
        (item) => item.profile.id === activeProfile?.id,
      ),
    [activeProfile?.id, joinedEntries],
  );

  const categories = [
    ...new Set(baseEntries.flatMap((item) => item.entry.categories)),
  ].sort((left, right) => left.localeCompare(right, "pt-BR"));

  const entries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return baseEntries
      .filter((item) => {
        const matchesQuery =
          !normalizedQuery ||
          item.book.title
            .toLocaleLowerCase("pt-BR")
            .includes(normalizedQuery) ||
          item.book.authors.some((author) =>
            author.toLocaleLowerCase("pt-BR").includes(normalizedQuery),
          );
        const matchesStatus =
          status === "all" || item.entry.status === status;
        const matchesCategory =
          category === "all" || item.entry.categories.includes(category);
        const matchesRating =
          minimumRating === "all" ||
          (item.averageRating !== null &&
            item.averageRating >= Number(minimumRating));
        return (
          matchesQuery &&
          matchesStatus &&
          matchesCategory &&
          matchesRating
        );
      })
      .sort((left, right) => {
        if (sort === "title")
          return left.book.title.localeCompare(right.book.title, "pt-BR");
        if (sort === "rating")
          return (right.averageRating ?? -1) - (left.averageRating ?? -1);
        return (
          new Date(right.entry.updatedAt).getTime() -
          new Date(left.entry.updatedAt).getTime()
        );
      });
  }, [
    baseEntries,
    query,
    status,
    category,
    minimumRating,
    sort,
  ]);

  if (!activeProfileId) return <Navigate to="/profiles" replace />;

  return (
    <div className="page library-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">ACERVO PESSOAL</p>
          <h1>Minha estante</h1>
          <p>
            {baseEntries.length}{" "}
            {baseEntries.length === 1 ? "livro guardado" : "livros guardados"}{" "}
            entre estas páginas.
          </p>
        </div>
        <Link className="button button--primary" to="/books/new">
          <Plus size={18} />
          Adicionar livro
        </Link>
      </header>

      {baseEntries.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <section className="library-controls" aria-label="Filtros da estante">
            <label className="search-field">
              <Search size={18} />
              <span className="sr-only">Buscar na estante</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por título ou autor"
              />
            </label>
            <div className="filter-fields">
              <label>
                <Filter size={16} aria-hidden="true" />
                <span className="sr-only">Filtrar por status</span>
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as BookStatus | "all")
                  }
                >
                  <option value="all">Todos os status</option>
                  {Object.entries(statusMeta).map(([value, meta]) => (
                    <option key={value} value={value}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">Filtrar por categoria</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="all">Todas as categorias</option>
                  {categories.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">Filtrar por nota</span>
                <select
                  value={minimumRating}
                  onChange={(event) => setMinimumRating(event.target.value)}
                >
                  <option value="all">Todas as notas</option>
                  <option value="9">9 ou mais</option>
                  <option value="8">8 ou mais</option>
                  <option value="7">7 ou mais</option>
                </select>
              </label>
              <label>
                <SlidersHorizontal size={16} aria-hidden="true" />
                <span className="sr-only">Ordenar estante</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                >
                  <option value="recent">Mais recentes</option>
                  <option value="title">Título A–Z</option>
                  <option value="rating">Melhor avaliados</option>
                </select>
              </label>
            </div>
          </section>

          <div className="library-result-line">
            <span>
              {entries.length}{" "}
              {entries.length === 1 ? "resultado" : "resultados"}
            </span>
            <span aria-hidden="true" />
          </div>

          {entries.length > 0 ? (
            <WoodenShelf entries={entries} />
          ) : (
            <EmptyState
              action={false}
              title="Nenhum livro por aqui"
              description="Tente retirar algum filtro ou buscar por outro termo."
            />
          )}
        </>
      )}
    </div>
  );
}
