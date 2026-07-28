import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookPlus,
  Check,
  Eraser,
  LoaderCircle,
  PenLine,
  Search,
  Sparkles,
} from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { BookCover } from "../components/BookCover";
import { RatingDisplay } from "../components/RatingDisplay";
import { ratingCriteria, statusMeta } from "../constants";
import { useApp } from "../context/AppContext";
import { searchGoogleBooks } from "../lib/googleBooks";
import { calculateAverageRating } from "../lib/rating";
import {
  hasValidationErrors,
  validateLibraryEntry,
  type ValidationErrors,
} from "../lib/validation";
import type {
  Book,
  BookSearchResult,
  BookStatus,
  LibraryEntryDraft,
  RatingCriterionKey,
} from "../types";

const googleBooksKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY?.trim() ?? "";

function emptyBook(): Omit<Book, "id" | "createdAt"> {
  return {
    source: "manual",
    sourceId: null,
    title: "",
    subtitle: "",
    authors: [],
    publisher: "",
    publishedDate: "",
    pageCount: null,
    language: "pt",
    description: "",
    categories: [],
    isbn10: "",
    isbn13: "",
    coverUrl: "",
  };
}

function draftFromResult(
  book: Omit<Book, "id" | "createdAt">,
  profileId: string,
): LibraryEntryDraft {
  return {
    profileId,
    book,
    status: "want_to_read",
    categories: book.categories,
    startedAt: "",
    endedAt: "",
    currentPage: null,
    review: "",
    storySummary: "",
    containsSpoilers: false,
    ratings: {},
  };
}

export function BookFormPage() {
  const { entryId } = useParams();
  const {
    activeProfileId,
    activeProfile,
    profiles,
    joinedEntries,
    saveEntry,
  } = useApp();
  const navigate = useNavigate();
  const editingItem = joinedEntries.find((item) => item.entry.id === entryId);
  const initialProfileId =
    editingItem?.profile.id ??
    (activeProfileId !== "house" ? activeProfile?.id : profiles[0]?.id) ??
    "";
  const initialDraft = useMemo<LibraryEntryDraft | null>(
    () =>
      editingItem
        ? {
            profileId: editingItem.entry.profileId,
            book: { ...editingItem.book },
            status: editingItem.entry.status,
            categories: editingItem.entry.categories,
            startedAt: editingItem.entry.startedAt,
            endedAt: editingItem.entry.endedAt,
            currentPage: editingItem.entry.currentPage,
            review: editingItem.entry.review,
            storySummary: editingItem.entry.storySummary,
            containsSpoilers: editingItem.entry.containsSpoilers,
            ratings: editingItem.entry.ratings,
          }
        : null,
    [editingItem],
  );

  const [step, setStep] = useState<1 | 2>(editingItem ? 2 : 1);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [draft, setDraft] = useState<LibraryEntryDraft | null>(initialDraft);
  const [authorsText, setAuthorsText] = useState(
    initialDraft?.book.authors.join(", ") ?? "",
  );
  const [categoriesText, setCategoriesText] = useState(
    initialDraft?.categories.join(", ") ?? "",
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (step !== 1 || query.trim().length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      try {
        const books = await searchGoogleBooks(
          query,
          googleBooksKey,
          controller.signal,
        );
        setResults(books);
        if (books.length === 0) {
          setSearchError(
            "Nenhuma edição encontrada. Você pode cadastrar manualmente.",
          );
        }
      } catch (cause) {
        if ((cause as Error).name !== "AbortError") {
          setSearchError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível buscar livros.",
          );
        }
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query, step]);

  if (!activeProfileId && !editingItem) {
    return <Navigate to="/profiles" replace />;
  }
  if (entryId && !editingItem) {
    return <Navigate to="/library" replace />;
  }

  function chooseBook(book: BookSearchResult) {
    const nextDraft = draftFromResult(book, initialProfileId);
    setDraft(nextDraft);
    setAuthorsText(book.authors.join(", "));
    setCategoriesText(book.categories.join(", "));
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseManual() {
    const nextDraft = draftFromResult(emptyBook(), initialProfileId);
    setDraft(nextDraft);
    setAuthorsText("");
    setCategoriesText("");
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateDraft<K extends keyof LibraryEntryDraft>(
    key: K,
    value: LibraryEntryDraft[K],
  ) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function updateBook<K extends keyof LibraryEntryDraft["book"]>(
    key: K,
    value: LibraryEntryDraft["book"][K],
  ) {
    setDraft((current) =>
      current
        ? { ...current, book: { ...current.book, [key]: value } }
        : current,
    );
  }

  function updateRating(key: RatingCriterionKey, value?: number) {
    setDraft((current) => {
      if (!current) return current;
      const ratings = { ...current.ratings };
      if (value === undefined) delete ratings[key];
      else ratings[key] = value;
      return { ...current, ratings };
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;

    const normalizedDraft: LibraryEntryDraft = {
      ...draft,
      book: {
        ...draft.book,
        authors: authorsText
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        categories: categoriesText
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      },
      categories: categoriesText
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    };
    const validationErrors = validateLibraryEntry(normalizedDraft);
    setErrors(validationErrors);
    if (hasValidationErrors(validationErrors)) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const result = await saveEntry(normalizedDraft, entryId);
      navigate(
        result.duplicate
          ? `/books/${result.entryId}/edit?duplicate=1`
          : `/books/${result.entryId}`,
      );
    } catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível salvar este livro.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (step === 1) {
    return (
      <div className="page book-search-page">
        <header className="form-page-heading">
          <div>
            <p className="eyebrow">NOVO REGISTRO · ETAPA 01 DE 02</p>
            <h1>Qual livro entrou na sua história?</h1>
            <p>Busque pelo título, autor ou ISBN. Você revisa tudo antes de salvar.</p>
          </div>
          <Link className="back-link" to="/library">
            <ArrowLeft size={17} /> Cancelar
          </Link>
        </header>

        <section className="catalog-search">
          <label>
            <Search size={22} aria-hidden="true" />
            <span className="sr-only">Buscar no catálogo</span>
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                const nextQuery = event.target.value;
                setQuery(nextQuery);
                if (nextQuery.trim().length < 2) {
                  setResults([]);
                  setSearchError("");
                  setSearching(false);
                }
              }}
              placeholder="Ex.: Torto Arado, Saramago ou 978…"
            />
            {searching && <LoaderCircle className="spin" size={20} />}
          </label>
          <p>
            CATÁLOGO GOOGLE BOOKS <span>·</span> ATÉ 12 EDIÇÕES POR BUSCA
          </p>
        </section>

        {searchError && (
          <div className="catalog-message">
            <p>{searchError}</p>
            <button className="text-link" type="button" onClick={chooseManual}>
              Cadastrar manualmente <ArrowRight size={15} />
            </button>
          </div>
        )}

        {results.length > 0 ? (
          <section className="catalog-results">
            <div className="section-heading">
              <div>
                <p className="eyebrow">EDIÇÕES ENCONTRADAS</p>
                <h2>Escolha a edição correta</h2>
              </div>
              <span>{results.length} resultados</span>
            </div>
            <div className="catalog-grid">
              {results.map((book) => (
                <button
                  className="catalog-card"
                  type="button"
                  key={book.sourceId}
                  onClick={() => chooseBook(book)}
                >
                  <BookCover book={book} size="small" />
                  <span className="catalog-card__copy">
                    <strong>{book.title}</strong>
                    <span>{book.authors.join(", ")}</span>
                    <small>
                      {[book.publisher, book.publishedDate]
                        .filter(Boolean)
                        .join(" · ") || "Edição sem data"}
                    </small>
                    <em>
                      Escolher edição <ArrowRight size={14} />
                    </em>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          !searching &&
          !query && (
            <section className="catalog-empty">
              <div className="catalog-empty__ornament" aria-hidden="true">
                <Search size={31} />
                <span />
              </div>
              <p className="eyebrow">COMECE PELA CAPA</p>
              <h2>Procure uma história</h2>
              <p>
                Título, autor ou ISBN — dois caracteres já bastam para começar.
              </p>
              <button
                className="button button--secondary"
                type="button"
                onClick={chooseManual}
              >
                <PenLine size={17} /> Prefiro cadastrar manualmente
              </button>
            </section>
          )
        )}
      </div>
    );
  }

  if (!draft) return null;
  const overallRating = calculateAverageRating(draft.ratings);

  return (
    <div className="page book-form-page">
      <header className="form-page-heading">
        <div>
          <p className="eyebrow">
            {editingItem ? "ATUALIZAR LEITURA" : "NOVO REGISTRO · ETAPA 02 DE 02"}
          </p>
          <h1>{editingItem ? "Revisite esta história" : "Agora, faça deste livro o seu."}</h1>
          <p>Os campos pessoais e todas as avaliações são opcionais.</p>
        </div>
        <button
          className="back-link"
          type="button"
          onClick={() => (editingItem ? navigate(-1) : setStep(1))}
        >
          <ArrowLeft size={17} /> {editingItem ? "Voltar" : "Trocar edição"}
        </button>
      </header>

      <form className="book-form" onSubmit={handleSubmit}>
        <aside className="book-form__aside">
          <BookCover book={draft.book} size="large" />
          <div>
            <small>NOTA ATUAL</small>
            <RatingDisplay value={overallRating} />
          </div>
          <p>A média usa somente os critérios que você decidir preencher.</p>
        </aside>

        <div className="book-form__main">
          <section className="form-section">
            <div className="form-section__heading">
              <span>01</span>
              <div>
                <p className="eyebrow">SOBRE A OBRA</p>
                <h2>Confira os dados do livro</h2>
              </div>
            </div>
            <div className="form-grid">
              <label className="field field--wide">
                <span>Título *</span>
                <input
                  value={draft.book.title}
                  onChange={(event) => updateBook("title", event.target.value)}
                  aria-invalid={Boolean(errors.title)}
                />
                {errors.title && <small className="field-error">{errors.title}</small>}
              </label>
              <label className="field field--wide">
                <span>Subtítulo</span>
                <input
                  value={draft.book.subtitle}
                  onChange={(event) => updateBook("subtitle", event.target.value)}
                />
              </label>
              <label className="field field--wide">
                <span>Autores * <small>separe com vírgulas</small></span>
                <input
                  value={authorsText}
                  onChange={(event) => setAuthorsText(event.target.value)}
                  aria-invalid={Boolean(errors.authors)}
                />
                {errors.authors && <small className="field-error">{errors.authors}</small>}
              </label>
              <label className="field">
                <span>Editora</span>
                <input
                  value={draft.book.publisher}
                  onChange={(event) => updateBook("publisher", event.target.value)}
                />
              </label>
              <label className="field">
                <span>Publicação</span>
                <input
                  value={draft.book.publishedDate}
                  onChange={(event) =>
                    updateBook("publishedDate", event.target.value)
                  }
                  placeholder="2026 ou 28/07/2026"
                />
              </label>
              <label className="field">
                <span>Total de páginas</span>
                <input
                  min="1"
                  type="number"
                  value={draft.book.pageCount ?? ""}
                  onChange={(event) =>
                    updateBook(
                      "pageCount",
                      event.target.value ? Number(event.target.value) : null,
                    )
                  }
                />
              </label>
              <label className="field">
                <span>Idioma</span>
                <input
                  value={draft.book.language}
                  onChange={(event) => updateBook("language", event.target.value)}
                  placeholder="pt"
                />
              </label>
              <label className="field field--wide">
                <span>URL da capa</span>
                <input
                  type="url"
                  value={draft.book.coverUrl}
                  onChange={(event) => updateBook("coverUrl", event.target.value)}
                  placeholder="https://…"
                />
              </label>
              <label className="field field--wide">
                <span>Sinopse editorial</span>
                <textarea
                  rows={5}
                  value={draft.book.description}
                  onChange={(event) =>
                    updateBook("description", event.target.value)
                  }
                />
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section__heading">
              <span>02</span>
              <div>
                <p className="eyebrow">SUA LEITURA</p>
                <h2>Onde este livro está agora?</h2>
              </div>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Perfil *</span>
                <select
                  value={draft.profileId}
                  onChange={(event) => updateDraft("profileId", event.target.value)}
                  required
                >
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Status *</span>
                <select
                  value={draft.status}
                  onChange={(event) =>
                    updateDraft("status", event.target.value as BookStatus)
                  }
                >
                  {Object.entries(statusMeta).map(([value, meta]) => (
                    <option key={value} value={value}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field field--wide">
                <span>Categorias <small>separe com vírgulas</small></span>
                <input
                  value={categoriesText}
                  onChange={(event) => setCategoriesText(event.target.value)}
                  placeholder="Romance, Literatura brasileira"
                />
              </label>
              <label className="field">
                <span>Data de início</span>
                <input
                  type="date"
                  value={draft.startedAt}
                  onChange={(event) => updateDraft("startedAt", event.target.value)}
                />
              </label>
              <label className="field">
                <span>
                  {draft.status === "abandoned"
                    ? "Data de abandono"
                    : "Data de término"}
                </span>
                <input
                  type="date"
                  value={draft.endedAt}
                  onChange={(event) => updateDraft("endedAt", event.target.value)}
                />
              </label>
              {errors.dates && (
                <p className="form-error field--wide">{errors.dates}</p>
              )}
              <label className="field">
                <span>Página atual</span>
                <input
                  min="0"
                  type="number"
                  value={draft.currentPage ?? ""}
                  onChange={(event) =>
                    updateDraft(
                      "currentPage",
                      event.target.value ? Number(event.target.value) : null,
                    )
                  }
                  aria-invalid={Boolean(errors.currentPage)}
                />
                {errors.currentPage && (
                  <small className="field-error">{errors.currentPage}</small>
                )}
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section__heading">
              <span>03</span>
              <div>
                <p className="eyebrow">MEMÓRIA DE LEITURA</p>
                <h2>O que ficou com você?</h2>
              </div>
            </div>
            <div className="form-grid">
              <label className="field field--wide">
                <span>O que eu achei</span>
                <textarea
                  rows={6}
                  value={draft.review}
                  onChange={(event) => updateDraft("review", event.target.value)}
                  placeholder="Escreva como se estivesse contando para alguém próximo…"
                />
              </label>
              <label className="field field--wide">
                <span>Meu resumo da história</span>
                <textarea
                  rows={7}
                  value={draft.storySummary}
                  onChange={(event) =>
                    updateDraft("storySummary", event.target.value)
                  }
                  placeholder="A história em suas próprias palavras…"
                />
              </label>
              <label className="check-field field--wide">
                <input
                  type="checkbox"
                  checked={draft.containsSpoilers}
                  onChange={(event) =>
                    updateDraft("containsSpoilers", event.target.checked)
                  }
                />
                <span>
                  <Check size={15} />
                </span>
                Este resumo contém spoilers
              </label>
            </div>
          </section>

          <section className="form-section form-section--ratings">
            <div className="form-section__heading">
              <span>04</span>
              <div>
                <p className="eyebrow">AVALIAÇÃO OPCIONAL</p>
                <h2>Dê nota apenas ao que fizer sentido</h2>
              </div>
              <RatingDisplay value={overallRating} />
            </div>
            <div className="rating-input-grid">
              {ratingCriteria.map((criterion) => {
                const value = draft.ratings[criterion.key];
                return (
                  <div className="rating-input" key={criterion.key}>
                    <div className="rating-input__heading">
                      <label htmlFor={`rating-${criterion.key}`}>
                        {criterion.label}
                        <small>{criterion.hint}</small>
                      </label>
                      <strong>{value ? `${value} / 10` : "—"}</strong>
                    </div>
                    {value === undefined ? (
                      <button
                        className="rating-input__add"
                        type="button"
                        onClick={() => updateRating(criterion.key, 5)}
                      >
                        <Sparkles size={14} /> Avaliar este critério
                      </button>
                    ) : (
                      <div className="rating-input__control">
                        <input
                          id={`rating-${criterion.key}`}
                          type="range"
                          min="1"
                          max="10"
                          step="1"
                          value={value}
                          onChange={(event) =>
                            updateRating(criterion.key, Number(event.target.value))
                          }
                          style={{ "--rating-progress": `${value * 10}%` } as React.CSSProperties}
                        />
                        <button
                          type="button"
                          onClick={() => updateRating(criterion.key)}
                          aria-label={`Limpar nota de ${criterion.label}`}
                        >
                          <Eraser size={14} /> Limpar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {formError && <p className="form-error form-error--box">{formError}</p>}
          <div className="book-form__actions">
            <button
              className="button button--primary button--large"
              type="submit"
              disabled={saving}
            >
              {saving ? (
                <>
                  <LoaderCircle className="spin" size={18} /> Salvando…
                </>
              ) : (
                <>
                  <BookPlus size={18} />
                  {editingItem ? "Salvar alterações" : "Adicionar à estante"}
                </>
              )}
            </button>
            <p>Você poderá editar tudo novamente quando quiser.</p>
          </div>
        </div>
      </form>
    </div>
  );
}
