import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  CloudOff,
  ExternalLink,
  Eye,
  EyeOff,
  GitMerge,
  ImageUp,
  Layers3,
  Link2,
  LoaderCircle,
  Plus,
  Search,
  Store,
  Upload,
  WandSparkles,
  X,
} from "lucide-react";
import type {
  CatalogIdentityMethod,
  CatalogRetailer,
  CatalogWork,
} from "../catalogTypes";
import { useApp } from "../context/AppContext";
import { runtimeBookCatalogClient } from "../lib/catalogRuntime";
import {
  buildIdentitySuggestions,
  catalogAdmin,
  collectionSlug,
  splitCatalogTerms,
  type AdminCatalogCollection,
  type AdminCatalogEdition,
  type AdminCatalogWork,
  type CatalogAdminSnapshot,
  type CatalogIdentitySuggestion,
} from "../lib/catalogAdmin";

type CurationTab = "catalog" | "collections" | "identity" | "retailers";
type Feedback = { tone: "success" | "error"; text: string } | null;

const emptySnapshot: CatalogAdminSnapshot = {
  works: [],
  editions: [],
  collections: [],
  collectionItems: [],
  identityRules: [],
  retailerLinks: [],
};

const retailerLabels: Record<CatalogRetailer, string> = {
  amazon_br: "Amazon Brasil",
  estante_virtual: "Estante Virtual",
  mercado_livre: "Mercado Livre",
};

const identityLabels: Record<CatalogIdentityMethod | "manual", string> = {
  work_key: "Mesma chave Open Library",
  isbn: "ISBN compartilhado",
  normalized_title: "Título normalizado",
  fuzzy_title: "Similaridade textual",
  blocked: "Bloqueio editorial",
  none: "Sem correspondência",
  manual: "Decisão manual",
};

function fieldText(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

function fieldBoolean(form: FormData, name: string) {
  return form.get(name) === "on";
}

function optionalInteger(value: string) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

function workTitle(
  works: readonly AdminCatalogWork[],
  workKey: string,
) {
  return works.find((work) => work.workKey === workKey)?.title ?? workKey;
}

function editionLabel(edition: AdminCatalogEdition) {
  return [
    edition.publisher || "Editora não informada",
    edition.publishedDate,
    edition.language?.toUpperCase(),
    edition.isbn13 || edition.isbn10,
  ]
    .filter(Boolean)
    .join(" · ");
}

function suggestionRuleMethod(
  suggestion: CatalogIdentitySuggestion,
): "same_work_key" | "shared_isbn" | "exact" | "fuzzy" | "manual" {
  const methods = {
    work_key: "same_work_key",
    isbn: "shared_isbn",
    normalized_title: "exact",
    fuzzy_title: "fuzzy",
  } as const;
  return suggestion.decision.method in methods
    ? methods[
        suggestion.decision.method as keyof typeof methods
      ]
    : "manual";
}

function CoverThumb({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  return (
    <span className="curation-cover" aria-hidden="true">
      {url ? (
        <img src={url} alt="" loading="lazy" />
      ) : (
        <span>{title.slice(0, 1).toUpperCase()}</span>
      )}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  copy,
  action,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="curation-section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      {action}
    </header>
  );
}

function MutationFieldset({
  readOnly,
  children,
}: {
  readOnly: boolean;
  children: React.ReactNode;
}) {
  return (
    <fieldset
      className="curation-fieldset"
      disabled={readOnly}
      title={
        readOnly
          ? "As alterações ficam desabilitadas no modo demonstrativo ou local."
          : undefined
      }
    >
      {children}
    </fieldset>
  );
}

export function CurationPage() {
  const { mode, isDemo } = useApp();
  const readOnly = catalogAdmin.readOnly || mode === "local" || isDemo;
  const [activeTab, setActiveTab] = useState<CurationTab>("catalog");
  const [snapshot, setSnapshot] =
    useState<CatalogAdminSnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [selectedWorkKey, setSelectedWorkKey] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const feedbackTimer = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await catalogAdmin.loadSnapshot();
      setSnapshot(next);
      setSelectedWorkKey((current) =>
        next.works.some((work) => work.workKey === current)
          ? current
          : next.works[0]?.workKey ?? "",
      );
      setSelectedCollectionId((current) =>
        next.collections.some((collection) => collection.id === current)
          ? current
          : next.collections[0]?.id ?? "",
      );
    } catch (cause) {
      setFeedback({
        tone: "error",
        text:
          cause instanceof Error
            ? cause.message
            : "Não foi possível abrir o painel de curadoria.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => void refresh(), 0);
    return () => {
      window.clearTimeout(loadTimer);
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    };
  }, [refresh]);

  function announce(next: Feedback) {
    setFeedback(next);
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), 7_000);
  }

  async function mutate(
    operation: string,
    successMessage: string,
    action: () => Promise<void>,
  ) {
    if (readOnly) {
      announce({
        tone: "error",
        text:
          "Esta visualização é demonstrativa. Conecte o Supabase e entre na conta doméstica para editar.",
      });
      return;
    }
    setBusy(operation);
    setFeedback(null);
    try {
      await action();
      await refresh();
      announce({ tone: "success", text: successMessage });
    } catch (cause) {
      announce({
        tone: "error",
        text:
          cause instanceof Error
            ? cause.message
            : "A alteração não pôde ser concluída.",
      });
    } finally {
      setBusy("");
    }
  }

  const selectedWork =
    snapshot.works.find((work) => work.workKey === selectedWorkKey) ?? null;
  const selectedEditions = snapshot.editions.filter(
    (edition) => edition.workKey === selectedWorkKey,
  );
  const selectedCollection =
    snapshot.collections.find(
      (collection) => collection.id === selectedCollectionId,
    ) ?? null;
  const collectionItems = snapshot.collectionItems.filter(
    (item) => item.collectionId === selectedCollectionId,
  );

  return (
    <div className="page curation-page">
      <header className="curation-hero">
        <div className="curation-hero__copy">
          <p className="eyebrow">ATELIÊ EDITORIAL · ÁREA PRIVADA</p>
          <h1>
            Curadoria com contexto, <em>edição por edição.</em>
          </h1>
          <p>
            Organize obras, capas, coleções e caminhos externos sem transformar
            a experiência em uma vitrine de preços.
          </p>
        </div>
        <div className="curation-hero__folio" aria-hidden="true">
          <span>EC / 04</span>
          <strong>{String(snapshot.works.length).padStart(2, "0")}</strong>
          <small>obras canônicas</small>
        </div>
      </header>

      {readOnly && (
        <aside className="curation-readonly" role="note">
          <CloudOff size={22} aria-hidden="true" />
          <div>
            <strong>Prévia segura, sem gravações</strong>
            <p>
              Os dados abaixo são demonstrativos. Busca e navegação continuam
              disponíveis; importar, enviar capas e editar ficam desabilitados.
            </p>
          </div>
        </aside>
      )}

      <section className="curation-metrics" aria-label="Resumo do catálogo">
        <article>
          <span>01</span>
          <strong>{snapshot.works.length}</strong>
          <p>obras catalogadas</p>
        </article>
        <article>
          <span>02</span>
          <strong>{snapshot.editions.length}</strong>
          <p>edições preservadas</p>
        </article>
        <article>
          <span>03</span>
          <strong>
            {
              snapshot.collections.filter(
                (collection) => collection.published,
              ).length
            }
          </strong>
          <p>coleções publicadas</p>
        </article>
        <article>
          <span>04</span>
          <strong>
            {
              snapshot.retailerLinks.filter((link) => link.active).length
            }
          </strong>
          <p>links diretos ativos</p>
        </article>
      </section>

      <nav className="curation-tabs" aria-label="Áreas da curadoria">
        {(
          [
            ["catalog", "Obras e edições", BookOpen],
            ["collections", "Coleções", Layers3],
            ["identity", "Identidade", GitMerge],
            ["retailers", "Onde encontrar", Store],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            className={activeTab === value ? "is-active" : ""}
            aria-current={activeTab === value ? "page" : undefined}
            onClick={() => setActiveTab(value)}
          >
            <Icon size={17} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>

      {feedback && (
        <div
          className={`curation-feedback curation-feedback--${feedback.tone}`}
          role={feedback.tone === "error" ? "alert" : "status"}
        >
          {feedback.tone === "success" ? (
            <CheckCircle2 size={19} aria-hidden="true" />
          ) : (
            <CircleAlert size={19} aria-hidden="true" />
          )}
          <p>{feedback.text}</p>
          <button
            type="button"
            aria-label="Fechar aviso"
            onClick={() => setFeedback(null)}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      )}

      {loading && snapshot.works.length === 0 ? (
        <div className="curation-loading" aria-busy="true">
          <LoaderCircle className="spin" size={28} aria-hidden="true" />
          <p>Abrindo o caderno editorial…</p>
        </div>
      ) : (
        <>
          {activeTab === "catalog" && (
            <CatalogPanel
              snapshot={snapshot}
              selectedWork={selectedWork}
              selectedEditions={selectedEditions}
              selectedWorkKey={selectedWorkKey}
              setSelectedWorkKey={setSelectedWorkKey}
              readOnly={readOnly}
              busy={busy}
              announce={announce}
              mutate={mutate}
            />
          )}
          {activeTab === "collections" && (
            <CollectionsPanel
              snapshot={snapshot}
              selectedCollection={selectedCollection}
              collectionItems={collectionItems}
              selectedCollectionId={selectedCollectionId}
              setSelectedCollectionId={setSelectedCollectionId}
              readOnly={readOnly}
              busy={busy}
              mutate={mutate}
            />
          )}
          {activeTab === "identity" && (
            <IdentityPanel
              snapshot={snapshot}
              readOnly={readOnly}
              busy={busy}
              mutate={mutate}
            />
          )}
          {activeTab === "retailers" && (
            <RetailersPanel
              snapshot={snapshot}
              readOnly={readOnly}
              busy={busy}
              mutate={mutate}
            />
          )}
        </>
      )}
    </div>
  );
}

function CatalogPanel({
  snapshot,
  selectedWork,
  selectedEditions,
  selectedWorkKey,
  setSelectedWorkKey,
  readOnly,
  busy,
  announce,
  mutate,
}: {
  snapshot: CatalogAdminSnapshot;
  selectedWork: AdminCatalogWork | null;
  selectedEditions: AdminCatalogEdition[];
  selectedWorkKey: string;
  setSelectedWorkKey(value: string): void;
  readOnly: boolean;
  busy: string;
  announce(feedback: Feedback): void;
  mutate(
    operation: string,
    successMessage: string,
    action: () => Promise<void>,
  ): Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CatalogWork[]>([]);
  const [coverEditionKey, setCoverEditionKey] = useState("");
  const manualWorkForm = useRef<HTMLFormElement>(null);
  const manualEditionForm = useRef<HTMLFormElement>(null);
  const coverForm = useRef<HTMLFormElement>(null);
  const importedKeys = useMemo(
    () => new Set(snapshot.works.map((work) => work.workKey)),
    [snapshot.works],
  );

  const activeCoverEditionKey = selectedEditions.some(
    (edition) => edition.editionKey === coverEditionKey,
  )
    ? coverEditionKey
    : "";

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = query.trim();
    if (!normalized) {
      announce({ tone: "error", text: "Digite título, autoria ou ISBN." });
      return;
    }
    setSearching(true);
    try {
      const response = await runtimeBookCatalogClient.search({
        query: normalized,
        page: 1,
      });
      setResults(response.works);
      if (response.works.length === 0) {
        announce({
          tone: "error",
          text:
            "Nenhuma obra encontrada. Você pode criar o registro manualmente.",
        });
      }
    } catch (cause) {
      announce({
        tone: "error",
        text:
          cause instanceof Error
            ? cause.message
            : "A busca no Open Library não respondeu.",
      });
    } finally {
      setSearching(false);
    }
  }

  async function handleManualWork(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    let createdKey = "";
    await mutate(
      "manual-work",
      "Obra manual criada e pronta para receber edições.",
      async () => {
        createdKey = await catalogAdmin.createManualWork({
          title: fieldText(data, "title"),
          authors: splitCatalogTerms(fieldText(data, "authors")),
          firstPublishedYear: optionalInteger(fieldText(data, "year")),
          description: fieldText(data, "description"),
          subjects: splitCatalogTerms(fieldText(data, "subjects")),
          languages: splitCatalogTerms(fieldText(data, "languages")),
          coverUrl: fieldText(data, "coverUrl"),
        });
      },
    );
    if (createdKey) {
      manualWorkForm.current?.reset();
      setSelectedWorkKey(createdKey);
    }
  }

  async function handleManualEdition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await mutate(
      "manual-edition",
      "Edição manual adicionada sem alterar as edições existentes.",
      async () => {
        await catalogAdmin.createManualEdition({
          workKey: selectedWorkKey,
          isbn10: fieldText(data, "isbn10"),
          isbn13: fieldText(data, "isbn13"),
          publisher: fieldText(data, "publisher"),
          publishedDate: fieldText(data, "publishedDate"),
          language: fieldText(data, "language"),
          format: fieldText(data, "format"),
          pageCount: optionalInteger(fieldText(data, "pageCount")),
          coverUrl: fieldText(data, "coverUrl"),
        });
      },
    );
    if (!readOnly) manualEditionForm.current?.reset();
  }

  async function handleCoverUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const file = data.get("cover");
    if (!(file instanceof File) || file.size === 0) {
      announce({ tone: "error", text: "Escolha um arquivo de capa." });
      return;
    }
    await mutate(
      "cover-upload",
      activeCoverEditionKey
        ? "Capa enviada e associada à edição."
        : "Capa principal da obra atualizada.",
      async () => {
        await catalogAdmin.uploadCover(
          selectedWorkKey,
          activeCoverEditionKey || null,
          file,
        );
      },
    );
    if (!readOnly) coverForm.current?.reset();
  }

  return (
    <div className="curation-panel">
      <SectionHeading
        eyebrow="01 · CATÁLOGO CANÔNICO"
        title="Importe a obra; preserve as edições."
        copy="O Open Library é a origem bibliográfica. O cadastro manual cobre ausências sem misturar produtos e obras."
      />

      <div className="curation-catalog-layout">
        <section className="curation-surface curation-import">
          <div className="curation-surface__heading">
            <WandSparkles size={20} aria-hidden="true" />
            <div>
              <h3>Buscar no Open Library</h3>
              <p>Consulte título, autoria ou ISBN e importe o conjunto.</p>
            </div>
          </div>
          <form className="curation-search" onSubmit={handleSearch}>
            <Search size={18} aria-hidden="true" />
            <label className="sr-only" htmlFor="curation-open-library-query">
              Buscar no Open Library
            </label>
            <input
              id="curation-open-library-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex.: Torto Arado ou 9786580309313"
            />
            <button type="submit" disabled={searching}>
              {searching ? (
                <LoaderCircle className="spin" size={17} aria-hidden="true" />
              ) : (
                "Buscar"
              )}
            </button>
          </form>

          {results.length > 0 && (
            <div className="curation-search-results">
              {results.map((work) => {
                const imported = importedKeys.has(work.workKey);
                return (
                  <article key={work.workKey}>
                    <CoverThumb url={work.coverUrl} title={work.title} />
                    <div>
                      <strong>{work.title}</strong>
                      <span>{work.authors.join(", ")}</span>
                      <small>
                        {work.firstPublishedYear || "Ano não informado"} ·{" "}
                        {work.editionCount} edições
                      </small>
                    </div>
                    <button
                      className="button button--secondary"
                      type="button"
                      disabled={
                        readOnly || imported || busy === `import-${work.workKey}`
                      }
                      onClick={() =>
                        void mutate(
                          `import-${work.workKey}`,
                          `${work.title} foi importado com suas edições.`,
                          async () => {
                            await catalogAdmin.importOpenLibraryWork(
                              work.workKey,
                            );
                            setSelectedWorkKey(work.workKey);
                          },
                        )
                      }
                    >
                      {imported ? (
                        <>
                          <CheckCircle2 size={16} aria-hidden="true" />
                          Importada
                        </>
                      ) : (
                        <>
                          <Plus size={16} aria-hidden="true" />
                          Importar
                        </>
                      )}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="curation-surface curation-work-index">
          <div className="curation-surface__heading">
            <BookOpen size={20} aria-hidden="true" />
            <div>
              <h3>Obras na curadoria</h3>
              <p>{snapshot.works.length} registros canônicos.</p>
            </div>
          </div>
          <div className="curation-work-list">
            {snapshot.works.map((work) => (
              <button
                key={work.workKey}
                type="button"
                className={
                  work.workKey === selectedWorkKey ? "is-selected" : ""
                }
                onClick={() => setSelectedWorkKey(work.workKey)}
              >
                <CoverThumb url={work.coverUrl} title={work.title} />
                <span>
                  <strong>{work.title}</strong>
                  <small>
                    {work.authors.join(", ")} · {work.editionCount} ed.
                  </small>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <details className="curation-disclosure">
        <summary>
          <Plus size={17} aria-hidden="true" />
          Criar obra manualmente
        </summary>
        <form ref={manualWorkForm} onSubmit={handleManualWork}>
          <MutationFieldset readOnly={readOnly}>
            <div className="curation-form-grid">
              <label className="field">
                <span>Título *</span>
                <input name="title" required maxLength={500} />
              </label>
              <label className="field">
                <span>Autoria * <small>separe por vírgulas</small></span>
                <input name="authors" required />
              </label>
              <label className="field">
                <span>Primeira publicação</span>
                <input name="year" type="number" min={1000} max={2200} />
              </label>
              <label className="field">
                <span>Idiomas <small>códigos separados por vírgulas</small></span>
                <input name="languages" placeholder="por, eng" />
              </label>
              <label className="field curation-field--wide">
                <span>Assuntos</span>
                <input
                  name="subjects"
                  placeholder="Literatura brasileira, Romance"
                />
              </label>
              <label className="field curation-field--wide">
                <span>Sinopse</span>
                <textarea name="description" rows={4} />
              </label>
              <label className="field curation-field--wide">
                <span>URL HTTPS da capa <small>opcional</small></span>
                <input name="coverUrl" type="url" />
              </label>
            </div>
            <div className="curation-form-actions">
              <button
                className="button button--primary"
                type="submit"
                disabled={busy === "manual-work"}
              >
                <Plus size={16} aria-hidden="true" />
                Criar obra
              </button>
            </div>
          </MutationFieldset>
        </form>
      </details>

      {selectedWork && (
        <section className="curation-workbench">
          <header>
            <div className="curation-workbench__identity">
              <CoverThumb url={selectedWork.coverUrl} title={selectedWork.title} />
              <div>
                <p className="eyebrow">
                  {selectedWork.source === "manual"
                    ? "REGISTRO MANUAL"
                    : "OPEN LIBRARY"}
                </p>
                <h3>{selectedWork.title}</h3>
                <p>{selectedWork.authors.join(", ")}</p>
                <code>{selectedWork.workKey}</code>
              </div>
            </div>
            <span className="curation-workbench__count">
              {selectedEditions.length}
              <small>edições</small>
            </span>
          </header>

          <div className="curation-edition-grid">
            {selectedEditions.map((edition) => (
              <article
                key={edition.editionKey}
                className={
                  selectedWork.primaryEditionKey === edition.editionKey
                    ? "is-primary"
                    : ""
                }
              >
                <CoverThumb
                  url={edition.coverUrl}
                  title={selectedWork.title}
                />
                <div>
                  <strong>
                    {edition.publisher || "Editora não informada"}
                  </strong>
                  <p>
                    {[edition.publishedDate, edition.format, edition.language]
                      .filter(Boolean)
                      .join(" · ") || "Metadados editoriais pendentes"}
                  </p>
                  <small>
                    {edition.isbn13
                      ? `ISBN-13 ${edition.isbn13}`
                      : edition.isbn10
                        ? `ISBN-10 ${edition.isbn10}`
                        : "Sem ISBN"}
                  </small>
                  <code>{edition.editionKey}</code>
                </div>
                {selectedWork.primaryEditionKey === edition.editionKey ? (
                  <span className="curation-primary-label">
                    <CheckCircle2 size={14} aria-hidden="true" />
                    Principal
                  </span>
                ) : (
                  <button
                    className="button button--ghost"
                    type="button"
                    disabled={readOnly || busy === `primary-${edition.editionKey}`}
                    onClick={() =>
                      void mutate(
                        `primary-${edition.editionKey}`,
                        "Edição e capa principais atualizadas.",
                        () =>
                          catalogAdmin.setPrimaryEdition(
                            selectedWork.workKey,
                            edition.editionKey,
                          ),
                      )
                    }
                  >
                    Tornar principal
                  </button>
                )}
              </article>
            ))}
            {selectedEditions.length === 0 && (
              <div className="curation-inline-empty">
                <BookOpen size={23} aria-hidden="true" />
                <p>Esta obra ainda não possui uma edição cadastrada.</p>
              </div>
            )}
          </div>

          <div className="curation-workbench__forms">
            <form ref={manualEditionForm} onSubmit={handleManualEdition}>
              <div className="curation-form-heading">
                <Plus size={18} aria-hidden="true" />
                <div>
                  <strong>Nova edição manual</strong>
                  <p>ISBNs distintos continuam como edições independentes.</p>
                </div>
              </div>
              <MutationFieldset readOnly={readOnly}>
                <div className="curation-form-grid">
                  <label className="field">
                    <span>ISBN-10</span>
                    <input name="isbn10" inputMode="numeric" />
                  </label>
                  <label className="field">
                    <span>ISBN-13</span>
                    <input name="isbn13" inputMode="numeric" />
                  </label>
                  <label className="field">
                    <span>Editora</span>
                    <input name="publisher" />
                  </label>
                  <label className="field">
                    <span>Data / ano</span>
                    <input name="publishedDate" />
                  </label>
                  <label className="field">
                    <span>Idioma</span>
                    <input name="language" placeholder="por" />
                  </label>
                  <label className="field">
                    <span>Formato</span>
                    <input name="format" placeholder="Brochura" />
                  </label>
                  <label className="field">
                    <span>Páginas</span>
                    <input name="pageCount" type="number" min={1} />
                  </label>
                  <label className="field">
                    <span>URL HTTPS da capa</span>
                    <input name="coverUrl" type="url" />
                  </label>
                </div>
                <div className="curation-form-actions">
                  <button
                    className="button button--primary"
                    type="submit"
                    disabled={busy === "manual-edition"}
                  >
                    Adicionar edição
                  </button>
                </div>
              </MutationFieldset>
            </form>

            <form ref={coverForm} onSubmit={handleCoverUpload}>
              <div className="curation-form-heading">
                <ImageUp size={18} aria-hidden="true" />
                <div>
                  <strong>Capa própria</strong>
                  <p>JPEG, PNG, WebP ou AVIF, até 5 MB.</p>
                </div>
              </div>
              <MutationFieldset readOnly={readOnly}>
                <label className="field">
                  <span>Destino da capa</span>
                  <select
                    value={activeCoverEditionKey}
                    onChange={(event) =>
                      setCoverEditionKey(event.target.value)
                    }
                  >
                    <option value="">Capa principal da obra</option>
                    {selectedEditions.map((edition) => (
                      <option
                        key={edition.editionKey}
                        value={edition.editionKey}
                      >
                        {editionLabel(edition)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="curation-file">
                  <Upload size={19} aria-hidden="true" />
                  <span>Escolher arquivo</span>
                  <input
                    name="cover"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    required
                  />
                </label>
                <div className="curation-form-actions">
                  <button
                    className="button button--primary"
                    type="submit"
                    disabled={busy === "cover-upload"}
                  >
                    Enviar capa
                  </button>
                </div>
              </MutationFieldset>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}

function CollectionsPanel({
  snapshot,
  selectedCollection,
  collectionItems,
  selectedCollectionId,
  setSelectedCollectionId,
  readOnly,
  busy,
  mutate,
}: {
  snapshot: CatalogAdminSnapshot;
  selectedCollection: AdminCatalogCollection | null;
  collectionItems: CatalogAdminSnapshot["collectionItems"];
  selectedCollectionId: string;
  setSelectedCollectionId(value: string): void;
  readOnly: boolean;
  busy: string;
  mutate(
    operation: string,
    successMessage: string,
    action: () => Promise<void>,
  ): Promise<void>;
}) {
  const newCollectionForm = useRef<HTMLFormElement>(null);
  const itemForm = useRef<HTMLFormElement>(null);
  const [itemWorkKey, setItemWorkKey] = useState(
    snapshot.works[0]?.workKey ?? "",
  );
  const itemEditions = snapshot.editions.filter(
    (edition) => edition.workKey === itemWorkKey,
  );

  async function handleNewCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    let collectionId = "";
    await mutate(
      "new-collection",
      "Coleção criada. Ela só aparece publicamente quando for publicada.",
      async () => {
        collectionId = await catalogAdmin.saveCollection({
          slug: fieldText(data, "slug"),
          title: fieldText(data, "title"),
          description: fieldText(data, "description"),
          badge: fieldText(data, "badge"),
          featured: fieldBoolean(data, "featured"),
          published: false,
        });
      },
    );
    if (collectionId) {
      newCollectionForm.current?.reset();
      setSelectedCollectionId(collectionId);
    }
  }

  async function handleEditCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCollection) return;
    const data = new FormData(event.currentTarget);
    await mutate(
      "edit-collection",
      "Texto e apresentação da coleção foram atualizados.",
      async () => {
        await catalogAdmin.saveCollection(
          {
            slug: fieldText(data, "slug"),
            title: fieldText(data, "title"),
            description: fieldText(data, "description"),
            badge: fieldText(data, "badge"),
            featured: fieldBoolean(data, "featured"),
            published: selectedCollection.published,
          },
          selectedCollection.id,
        );
      },
    );
  }

  async function handleItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCollection) return;
    const data = new FormData(event.currentTarget);
    await mutate(
      "collection-item",
      "Obra adicionada à coleção com seu contexto editorial.",
      async () => {
        await catalogAdmin.saveCollectionItem({
          collectionId: selectedCollection.id,
          workKey: itemWorkKey,
          editionKey: fieldText(data, "editionKey") || null,
          editorialText: fieldText(data, "editorialText"),
          badge: fieldText(data, "badge"),
          featured: fieldBoolean(data, "featured"),
        });
      },
    );
    if (!readOnly) itemForm.current?.reset();
  }

  return (
    <div className="curation-panel">
      <SectionHeading
        eyebrow="02 · COLEÇÕES EDITORIAIS"
        title="A página inicial começa aqui."
        copy="Publique seleções com ordem, selo, destaque e uma razão editorial para cada escolha."
      />

      <div className="curation-collections-layout">
        <aside className="curation-collection-sidebar">
          <details className="curation-disclosure" open>
            <summary>
              <Plus size={17} aria-hidden="true" />
              Nova coleção
            </summary>
            <form ref={newCollectionForm} onSubmit={handleNewCollection}>
              <MutationFieldset readOnly={readOnly}>
                <label className="field">
                  <span>Título *</span>
                  <input
                    name="title"
                    required
                    onBlur={(event) => {
                      const form = event.currentTarget.form;
                      const slug = form?.elements.namedItem(
                        "slug",
                      ) as HTMLInputElement | null;
                      if (slug && !slug.value) {
                        slug.value = collectionSlug(event.currentTarget.value);
                      }
                    }}
                  />
                </label>
                <label className="field">
                  <span>Slug *</span>
                  <input name="slug" required pattern="[a-z0-9-]+" />
                </label>
                <label className="field">
                  <span>Descrição</span>
                  <textarea name="description" rows={3} />
                </label>
                <label className="field">
                  <span>Selo</span>
                  <input name="badge" placeholder="Escolhas da casa" />
                </label>
                <label className="curation-check">
                  <input name="featured" type="checkbox" />
                  <span />
                  Coleção em destaque
                </label>
                <button
                  className="button button--primary"
                  type="submit"
                  disabled={busy === "new-collection"}
                >
                  Criar coleção
                </button>
              </MutationFieldset>
            </form>
          </details>

          <div className="curation-collection-list">
            {snapshot.collections.map((collection, index) => (
              <article
                key={collection.id}
                className={
                  collection.id === selectedCollectionId ? "is-selected" : ""
                }
              >
                <button
                  type="button"
                  onClick={() => setSelectedCollectionId(collection.id)}
                >
                  <span>
                    <strong>{collection.title}</strong>
                    <small>
                      {collection.published ? "Publicada" : "Oculta"} ·{" "}
                      {
                        snapshot.collectionItems.filter(
                          (item) => item.collectionId === collection.id,
                        ).length
                      }{" "}
                      obras
                    </small>
                  </span>
                </button>
                <div>
                  <button
                    type="button"
                    aria-label={`Mover ${collection.title} para cima`}
                    disabled={readOnly || index === 0}
                    onClick={() =>
                      void mutate(
                        `collection-up-${collection.id}`,
                        "Ordem das coleções atualizada.",
                        () => catalogAdmin.moveCollection(collection.id, -1),
                      )
                    }
                  >
                    <ArrowUp size={15} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Mover ${collection.title} para baixo`}
                    disabled={
                      readOnly || index === snapshot.collections.length - 1
                    }
                    onClick={() =>
                      void mutate(
                        `collection-down-${collection.id}`,
                        "Ordem das coleções atualizada.",
                        () => catalogAdmin.moveCollection(collection.id, 1),
                      )
                    }
                  >
                    <ArrowDown size={15} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </aside>

        {selectedCollection ? (
          <section className="curation-surface curation-collection-editor">
            <header>
              <div>
                <p className="eyebrow">EDIÇÃO DA COLEÇÃO</p>
                <h3>{selectedCollection.title}</h3>
                <code>/{selectedCollection.slug}</code>
              </div>
              <div className="curation-publish-actions">
                <button
                  className="button button--secondary"
                  type="button"
                  disabled={readOnly}
                  onClick={() =>
                    void mutate(
                      `feature-${selectedCollection.id}`,
                      selectedCollection.featured
                        ? "Coleção removida do destaque."
                        : "Coleção marcada como destaque.",
                      () =>
                        catalogAdmin.setCollectionFeatured(
                          selectedCollection.id,
                          !selectedCollection.featured,
                        ),
                    )
                  }
                >
                  <WandSparkles size={15} aria-hidden="true" />
                  {selectedCollection.featured
                    ? "Remover destaque"
                    : "Destacar"}
                </button>
                <button
                  className="button button--primary"
                  type="button"
                  disabled={readOnly}
                  onClick={() =>
                    void mutate(
                      `publish-${selectedCollection.id}`,
                      selectedCollection.published
                        ? "Coleção ocultada da livraria."
                        : "Coleção publicada na livraria.",
                      () =>
                        catalogAdmin.setCollectionPublished(
                          selectedCollection.id,
                          !selectedCollection.published,
                        ),
                    )
                  }
                >
                  {selectedCollection.published ? (
                    <>
                      <EyeOff size={15} aria-hidden="true" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <Eye size={15} aria-hidden="true" />
                      Publicar
                    </>
                  )}
                </button>
              </div>
            </header>

            <form
              key={selectedCollection.updatedAt}
              onSubmit={handleEditCollection}
            >
              <MutationFieldset readOnly={readOnly}>
                <div className="curation-form-grid">
                  <label className="field">
                    <span>Título</span>
                    <input
                      name="title"
                      required
                      defaultValue={selectedCollection.title}
                    />
                  </label>
                  <label className="field">
                    <span>Slug</span>
                    <input
                      name="slug"
                      required
                      defaultValue={selectedCollection.slug}
                    />
                  </label>
                  <label className="field curation-field--wide">
                    <span>Texto editorial</span>
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={selectedCollection.description}
                    />
                  </label>
                  <label className="field">
                    <span>Selo</span>
                    <input
                      name="badge"
                      defaultValue={selectedCollection.badge}
                    />
                  </label>
                  <label className="curation-check">
                    <input
                      name="featured"
                      type="checkbox"
                      defaultChecked={selectedCollection.featured}
                    />
                    <span />
                    Destaque editorial
                  </label>
                </div>
                <div className="curation-form-actions">
                  <button
                    className="button button--secondary"
                    type="submit"
                    disabled={busy === "edit-collection"}
                  >
                    Salvar apresentação
                  </button>
                </div>
              </MutationFieldset>
            </form>

            <div className="curation-collection-items">
              <div className="curation-subheading">
                <div>
                  <strong>Ordem de leitura</strong>
                  <p>Escolha obra, edição visual e contexto.</p>
                </div>
                <span>{collectionItems.length}</span>
              </div>
              {collectionItems.map((item, index) => {
                const work = snapshot.works.find(
                  (candidate) => candidate.workKey === item.workKey,
                );
                return (
                  <article key={item.id}>
                    <span className="curation-item-order">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <CoverThumb
                      url={work?.coverUrl ?? ""}
                      title={work?.title ?? "Obra"}
                    />
                    <div>
                      <strong>{work?.title ?? item.workKey}</strong>
                      <p>{item.editorialText || "Sem texto editorial."}</p>
                      <small>
                        {item.badge || "Sem selo"}
                        {item.featured ? " · Destaque" : ""}
                      </small>
                    </div>
                    <div className="curation-row-actions">
                      <button
                        type="button"
                        aria-label="Mover para cima"
                        disabled={readOnly || index === 0}
                        onClick={() =>
                          void mutate(
                            `item-up-${item.id}`,
                            "Ordem da coleção atualizada.",
                            () => catalogAdmin.moveCollectionItem(item.id, -1),
                          )
                        }
                      >
                        <ArrowUp size={15} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label="Mover para baixo"
                        disabled={readOnly || index === collectionItems.length - 1}
                        onClick={() =>
                          void mutate(
                            `item-down-${item.id}`,
                            "Ordem da coleção atualizada.",
                            () => catalogAdmin.moveCollectionItem(item.id, 1),
                          )
                        }
                      >
                        <ArrowDown size={15} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label="Remover da coleção"
                        disabled={readOnly}
                        onClick={() =>
                          void mutate(
                            `item-remove-${item.id}`,
                            "Obra removida desta coleção.",
                            () => catalogAdmin.removeCollectionItem(item.id),
                          )
                        }
                      >
                        <X size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <form
              ref={itemForm}
              className="curation-add-item"
              onSubmit={handleItem}
            >
              <MutationFieldset readOnly={readOnly}>
                <div className="curation-form-heading">
                  <Plus size={18} aria-hidden="true" />
                  <div>
                    <strong>Adicionar obra à coleção</strong>
                    <p>Não é necessário escolher uma edição.</p>
                  </div>
                </div>
                <div className="curation-form-grid">
                  <label className="field">
                    <span>Obra</span>
                    <select
                      value={itemWorkKey}
                      onChange={(event) => setItemWorkKey(event.target.value)}
                      required
                    >
                      {snapshot.works.map((work) => (
                        <option key={work.workKey} value={work.workKey}>
                          {work.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Edição visual</span>
                    <select name="editionKey">
                      <option value="">Capa principal da obra</option>
                      {itemEditions.map((edition) => (
                        <option
                          key={edition.editionKey}
                          value={edition.editionKey}
                        >
                          {editionLabel(edition)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field curation-field--wide">
                    <span>Texto editorial</span>
                    <textarea name="editorialText" rows={3} />
                  </label>
                  <label className="field">
                    <span>Selo</span>
                    <input name="badge" placeholder="Comece por aqui" />
                  </label>
                  <label className="curation-check">
                    <input name="featured" type="checkbox" />
                    <span />
                    Destaque na coleção
                  </label>
                </div>
                <div className="curation-form-actions">
                  <button
                    className="button button--primary"
                    type="submit"
                    disabled={busy === "collection-item"}
                  >
                    Adicionar à coleção
                  </button>
                </div>
              </MutationFieldset>
            </form>
          </section>
        ) : (
          <div className="curation-inline-empty">
            <Layers3 size={28} aria-hidden="true" />
            <p>Crie a primeira coleção para começar a curadoria pública.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function IdentityPanel({
  snapshot,
  readOnly,
  busy,
  mutate,
}: {
  snapshot: CatalogAdminSnapshot;
  readOnly: boolean;
  busy: string;
  mutate(
    operation: string,
    successMessage: string,
    action: () => Promise<void>,
  ): Promise<void>;
}) {
  const suggestions = useMemo(
    () => buildIdentitySuggestions(snapshot),
    [snapshot],
  );
  const [action, setAction] = useState<"merge" | "separate">("merge");
  const [workKeyA, setWorkKeyA] = useState(snapshot.works[0]?.workKey ?? "");
  const [workKeyB, setWorkKeyB] = useState(snapshot.works[1]?.workKey ?? "");
  const availableEditions = snapshot.editions.filter(
    (edition) =>
      edition.workKey === workKeyA || edition.workKey === workKeyB,
  );

  async function handleRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await mutate(
      "identity-rule",
      action === "merge"
        ? "A união manual foi registrada e o cache será invalidado."
        : "A separação manual foi registrada e sempre vencerá o algoritmo.",
      async () => {
        await catalogAdmin.recordIdentityRule({
          action,
          workKeyA,
          workKeyB,
          editionKey:
            action === "separate"
              ? fieldText(data, "editionKey") || null
              : null,
          method: "manual",
          confidence: 1,
          note: fieldText(data, "note"),
        });
      },
    );
  }

  return (
    <div className="curation-panel">
      <SectionHeading
        eyebrow="03 · IDENTIDADE BIBLIOGRÁFICA"
        title="O algoritmo sugere. A curadoria decide."
        copy="As edições nunca são apagadas. Regras manuais de unir ou separar vencem a aproximação automática."
      />

      <div className="curation-identity-layout">
        <section className="curation-surface">
          <div className="curation-surface__heading">
            <GitMerge size={20} aria-hidden="true" />
            <div>
              <h3>Agrupamentos observados</h3>
              <p>Método, confiança e bloqueios ficam visíveis.</p>
            </div>
          </div>
          <div className="curation-suggestion-list">
            {suggestions.map((suggestion) => {
              const actionForSuggestion =
                suggestion.decision.method === "blocked"
                  ? "separate"
                  : "merge";
              return (
                <article
                  key={`${suggestion.workA.workKey}-${suggestion.workB.workKey}`}
                >
                  <div className="curation-suggestion-pair">
                    <span>{suggestion.workA.title}</span>
                    <GitMerge size={15} aria-hidden="true" />
                    <span>{suggestion.workB.title}</span>
                  </div>
                  <div className="curation-confidence">
                    <span>
                      {identityLabels[suggestion.decision.method]}
                    </span>
                    <strong>
                      {Math.round(suggestion.decision.confidence * 100)}%
                    </strong>
                  </div>
                  <p>{suggestion.decision.reason}</p>
                  <button
                    className="button button--secondary"
                    type="button"
                    disabled={
                      readOnly ||
                      busy ===
                        `suggestion-${suggestion.workA.workKey}-${suggestion.workB.workKey}`
                    }
                    onClick={() =>
                      void mutate(
                        `suggestion-${suggestion.workA.workKey}-${suggestion.workB.workKey}`,
                        actionForSuggestion === "merge"
                          ? "Agrupamento confirmado pela curadoria."
                          : "Separação protegida por regra manual.",
                        async () => {
                          await catalogAdmin.recordIdentityRule({
                            action: actionForSuggestion,
                            workKeyA: suggestion.workA.workKey,
                            workKeyB: suggestion.workB.workKey,
                            method: suggestionRuleMethod(suggestion),
                            confidence: suggestion.decision.confidence,
                            note: suggestion.decision.reason,
                          });
                        },
                      )
                    }
                  >
                    {actionForSuggestion === "merge"
                      ? "Confirmar união"
                      : "Manter separadas"}
                  </button>
                </article>
              );
            })}
            {suggestions.length === 0 && (
              <div className="curation-inline-empty">
                <CheckCircle2 size={24} aria-hidden="true" />
                <p>
                  Nenhum par atingiu a confiança mínima ou acionou um bloqueio
                  editorial neste recorte.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="curation-surface curation-rule-editor">
          <div className="curation-surface__heading">
            <WandSparkles size={20} aria-hidden="true" />
            <div>
              <h3>Decisão manual</h3>
              <p>Registre união, separação ou destaque uma edição.</p>
            </div>
          </div>
          <form onSubmit={handleRule}>
            <MutationFieldset readOnly={readOnly}>
              <div className="curation-choice">
                <button
                  type="button"
                  className={action === "merge" ? "is-active" : ""}
                  onClick={() => setAction("merge")}
                >
                  Unir obras
                </button>
                <button
                  type="button"
                  className={action === "separate" ? "is-active" : ""}
                  onClick={() => setAction("separate")}
                >
                  Manter separadas
                </button>
              </div>
              <label className="field">
                <span>Obra A</span>
                <select
                  value={workKeyA}
                  onChange={(event) => setWorkKeyA(event.target.value)}
                >
                  {snapshot.works.map((work) => (
                    <option key={work.workKey} value={work.workKey}>
                      {work.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Obra B</span>
                <select
                  value={workKeyB}
                  onChange={(event) => setWorkKeyB(event.target.value)}
                >
                  {snapshot.works.map((work) => (
                    <option key={work.workKey} value={work.workKey}>
                      {work.title}
                    </option>
                  ))}
                </select>
              </label>
              {action === "separate" && (
                <label className="field">
                  <span>Edição a separar <small>opcional</small></span>
                  <select name="editionKey">
                    <option value="">Regra entre as duas obras</option>
                    {availableEditions.map((edition) => (
                      <option
                        key={edition.editionKey}
                        value={edition.editionKey}
                      >
                        {editionLabel(edition)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="field">
                <span>Justificativa editorial</span>
                <textarea name="note" rows={4} />
              </label>
              <button
                className="button button--primary"
                type="submit"
                disabled={busy === "identity-rule"}
              >
                Registrar decisão
              </button>
            </MutationFieldset>
          </form>
        </section>
      </div>

      <section className="curation-rule-history">
        <div className="curation-subheading">
          <div>
            <strong>Histórico de decisões</strong>
            <p>Regras ativas são aplicadas antes do algoritmo.</p>
          </div>
          <span>{snapshot.identityRules.length}</span>
        </div>
        {snapshot.identityRules.map((rule) => (
          <article key={rule.id}>
            <span
              className={`curation-rule-badge curation-rule-badge--${rule.action}`}
            >
              {rule.action === "merge" ? "UNIR" : "SEPARAR"}
            </span>
            <div>
              <strong>
                {workTitle(snapshot.works, rule.workKeyA)} ↔{" "}
                {workTitle(snapshot.works, rule.workKeyB)}
              </strong>
              <p>{rule.note || "Sem justificativa adicional."}</p>
            </div>
            <small>
              {rule.method === "manual"
                ? identityLabels.manual
                : rule.method}{" "}
              · {Math.round(rule.confidence * 100)}%
              {!rule.active ? " · inativa" : ""}
            </small>
          </article>
        ))}
      </section>
    </div>
  );
}

function RetailersPanel({
  snapshot,
  readOnly,
  busy,
  mutate,
}: {
  snapshot: CatalogAdminSnapshot;
  readOnly: boolean;
  busy: string;
  mutate(
    operation: string,
    successMessage: string,
    action: () => Promise<void>,
  ): Promise<void>;
}) {
  const [workKey, setWorkKey] = useState(snapshot.works[0]?.workKey ?? "");
  const [retailer, setRetailer] =
    useState<CatalogRetailer>("amazon_br");
  const editions = snapshot.editions.filter(
    (edition) => edition.workKey === workKey,
  );
  const linkForm = useRef<HTMLFormElement>(null);

  async function handleLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await mutate(
      "retailer-link",
      "Link direto validado e cadastrado. Nenhum preço foi armazenado.",
      async () => {
        await catalogAdmin.saveRetailerLink({
          workKey,
          editionKey: fieldText(data, "editionKey") || null,
          retailer,
          url: fieldText(data, "url"),
          affiliate: fieldBoolean(data, "affiliate"),
        });
      },
    );
    if (!readOnly) linkForm.current?.reset();
  }

  return (
    <div className="curation-panel">
      <SectionHeading
        eyebrow="04 · DESTINOS EXTERNOS"
        title="Links diretos, sem prometer disponibilidade."
        copy="Buscas neutras são geradas pelo backend. Cadastre aqui apenas um destino direto conhecido e validado."
      />

      <div className="curation-retailer-layout">
        <section className="curation-surface curation-link-editor">
          <div className="curation-surface__heading">
            <Link2 size={20} aria-hidden="true" />
            <div>
              <h3>Novo link direto</h3>
              <p>Amazon, Estante Virtual ou Mercado Livre.</p>
            </div>
          </div>
          <form ref={linkForm} onSubmit={handleLink}>
            <MutationFieldset readOnly={readOnly}>
              <label className="field">
                <span>Obra</span>
                <select
                  value={workKey}
                  onChange={(event) => setWorkKey(event.target.value)}
                >
                  {snapshot.works.map((work) => (
                    <option key={work.workKey} value={work.workKey}>
                      {work.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Edição <small>opcional</small></span>
                <select name="editionKey">
                  <option value="">Link válido para a obra</option>
                  {editions.map((edition) => (
                    <option
                      key={edition.editionKey}
                      value={edition.editionKey}
                    >
                      {editionLabel(edition)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Loja</span>
                <select
                  value={retailer}
                  onChange={(event) =>
                    setRetailer(event.target.value as CatalogRetailer)
                  }
                >
                  {Object.entries(retailerLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>URL HTTPS direta</span>
                <input name="url" type="url" required />
              </label>
              <label className="curation-check">
                <input name="affiliate" type="checkbox" />
                <span />
                Este link possui identificação de afiliado
              </label>
              <p className="curation-form-note">
                O rótulo público será “Ver esta edição na loja”. Preço,
                estoque, desconto e disponibilidade não são cadastrados.
              </p>
              <button
                className="button button--primary"
                type="submit"
                disabled={busy === "retailer-link"}
              >
                Validar e cadastrar
              </button>
            </MutationFieldset>
          </form>
        </section>

        <section className="curation-surface">
          <div className="curation-surface__heading">
            <Store size={20} aria-hidden="true" />
            <div>
              <h3>Destinos cadastrados</h3>
              <p>{snapshot.retailerLinks.length} overrides editoriais.</p>
            </div>
          </div>
          <div className="curation-link-list">
            {snapshot.retailerLinks.map((link) => (
              <article key={link.id} className={!link.active ? "is-inactive" : ""}>
                <span className="curation-store-mark">
                  {retailerLabels[link.retailer].slice(0, 1)}
                </span>
                <div>
                  <strong>{retailerLabels[link.retailer]}</strong>
                  <p>{workTitle(snapshot.works, link.workKey)}</p>
                  <small>
                    {link.editionKey
                      ? `Edição ${link.editionKey}`
                      : "Link no nível da obra"}
                    {link.affiliate ? " · Afiliado" : " · Neutro"}
                  </small>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel={
                    link.affiliate
                      ? "sponsored noopener noreferrer"
                      : "noopener noreferrer"
                  }
                  aria-label={`Abrir link em ${retailerLabels[link.retailer]}`}
                >
                  <ExternalLink size={16} aria-hidden="true" />
                </a>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() =>
                    void mutate(
                      `link-active-${link.id}`,
                      link.active ? "Link direto ocultado." : "Link reativado.",
                      () =>
                        catalogAdmin.setRetailerLinkActive(
                          link.id,
                          !link.active,
                        ),
                    )
                  }
                >
                  {link.active ? (
                    <EyeOff size={16} aria-hidden="true" />
                  ) : (
                    <Eye size={16} aria-hidden="true" />
                  )}
                  <span className="sr-only">
                    {link.active ? "Ocultar" : "Reativar"} link
                  </span>
                </button>
              </article>
            ))}
            {snapshot.retailerLinks.length === 0 && (
              <div className="curation-inline-empty">
                <Store size={24} aria-hidden="true" />
                <p>
                  Nenhum link direto cadastrado. As buscas neutras continuam
                  disponíveis na livraria.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
