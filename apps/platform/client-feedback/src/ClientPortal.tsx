import {
  ArrowDownToLine,
  CheckCircle2,
  Eye,
  History,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCcw,
  Save,
  ShieldCheck,
  ToggleLeft,
  Type,
  Upload,
} from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  clearPortalSession,
  getSupabaseConfig,
  loadPortalSession,
  portalFetch,
  savePortalSession,
  sendPasswordReset,
  signInWithPassword,
  uploadPortalAsset,
} from './portalApi';
import type {
  PortalContent,
  PortalContentValue,
  PortalField,
  PortalProject,
  PortalProjectDetail,
  PortalSession,
  PortalVersion,
} from './portalApi';

type LoadState = 'idle' | 'loading' | 'error';
type SaveState = 'idle' | 'saving' | 'publishing' | 'rolling-back';

export function ClientPortalApp() {
  const config = getSupabaseConfig();
  const [session, setSession] = useState<PortalSession | null>(() => loadPortalSession());

  if (!config.configured) {
    return <PortalConfigScreen />;
  }

  if (!session) {
    return <PortalLogin onAuthenticated={setSession} />;
  }

  return <PortalWorkspace session={session} onSessionChange={setSession} />;
}

function PortalLogin({ onAuthenticated }: { onAuthenticated: (session: PortalSession) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    try {
      const session = await signInWithPassword(email, password);
      onAuthenticated(session);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel entrar.');
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!email.trim()) {
      setMessage('Informe o email para receber o reset.');
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      await sendPasswordReset(email);
      setMessage('Email de reset enviado, se este usuario existir no Supabase.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel enviar o reset.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="portal-login-shell">
      <section className="portal-login-stage" aria-labelledby="portal-login-title">
        <div className="portal-login-copy">
          <a className="portal-login-brand" href="https://hcwebsolutions.com.br" target="_blank" rel="noreferrer">
            <span className="portal-login-logo">HC</span>
            <strong>
              HC Web <span>Solutions</span>
            </strong>
          </a>

          <div className="portal-login-badge">
            <ShieldCheck size={16} aria-hidden="true" />
            Portal seguro do cliente
          </div>

          <div>
            <p className="portal-login-kicker">Conteudo publicado</p>
            <h1 id="portal-login-title">Acesse os ajustes liberados para seu site.</h1>
            <p className="portal-login-intro">
              Edite textos, imagens e secoes aprovadas pela HC com historico de versoes e
              publicacao protegida.
            </p>
          </div>

          <div className="portal-login-proof-grid" aria-label="Recursos do portal">
            <div>
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>Campos controlados</span>
            </div>
            <div>
              <Eye size={18} aria-hidden="true" />
              <span>Previa do conteudo</span>
            </div>
            <div>
              <ShieldCheck size={18} aria-hidden="true" />
              <span>Acesso por email</span>
            </div>
          </div>
        </div>

        <section className="portal-login-card" aria-label="Entrar no portal">
          <div className="portal-login-card-top">
            <span className="portal-mark">
              <KeyRound size={24} aria-hidden="true" />
            </span>
            <div>
              <p>Area privada</p>
              <strong>Login do cliente</strong>
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <label htmlFor="portal-login-email">
              <span>Email</span>
              <input
                id="portal-login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label htmlFor="portal-login-password">
              <span>Senha</span>
              <input
                id="portal-login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button type="submit" className="portal-primary-button" disabled={busy}>
              {busy ? <Loader2 className="spin" size={18} /> : <KeyRound size={18} />}
              Entrar
            </button>
            <button type="button" className="portal-link-button" onClick={handleReset} disabled={busy}>
              Enviar reset de senha
            </button>
            {message ? <p className="portal-form-message">{message}</p> : null}
          </form>

          <p className="portal-login-footnote">
            Somente os campos liberados no manifesto do projeto aparecem neste portal.
          </p>
        </section>
      </section>
    </main>
  );
}

function PortalWorkspace({
  session,
  onSessionChange,
}: {
  session: PortalSession;
  onSessionChange: (session: PortalSession | null) => void;
}) {
  const [projects, setProjects] = useState<PortalProject[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [detail, setDetail] = useState<PortalProjectDetail | null>(null);
  const [content, setContent] = useState<PortalContent>({});
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [detailState, setDetailState] = useState<LoadState>('idle');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [message, setMessage] = useState('');

  const selectedProject = useMemo(
    () => projects.find((project) => project.projectSlug === selectedSlug) || null,
    [projects, selectedSlug],
  );

  useEffect(() => {
    void loadProjects();
  }, []);

  useEffect(() => {
    if (selectedSlug) {
      void loadProject(selectedSlug);
    }
  }, [selectedSlug]);

  async function loadProjects() {
    setLoadState('loading');
    setMessage('');

    try {
      const result = await portalFetch<{ projects: PortalProject[] }>(session, '/api/client/projects');
      onSessionChange(result.session);
      setProjects(result.data.projects);
      setSelectedSlug((current) => current || result.data.projects[0]?.projectSlug || '');
      setLoadState('idle');
    } catch (error) {
      setLoadState('error');
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel carregar projetos.');
    }
  }

  async function loadProject(projectSlug: string) {
    setDetailState('loading');
    setMessage('');

    try {
      const result = await portalFetch<PortalProjectDetail>(
        session,
        `/api/client/projects/${projectSlug}/draft`,
      );
      onSessionChange(result.session);
      setDetail(result.data);
      setContent(resolveEditableContent(result.data.fields, result.data.published, result.data.draft));
      setDetailState('idle');
    } catch (error) {
      setDetailState('error');
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel carregar o editor.');
    }
  }

  async function saveDraft() {
    if (!selectedSlug) {
      return;
    }

    setSaveState('saving');
    setMessage('');

    try {
      const result = await portalFetch<{ draft: PortalVersion }>(
        session,
        `/api/client/projects/${selectedSlug}/draft`,
        {
          method: 'PUT',
          body: JSON.stringify({ content }),
        },
      );
      onSessionChange(result.session);
      setDetail((current) => (current ? { ...current, draft: result.data.draft } : current));
      setMessage(`Rascunho salvo como versao ${result.data.draft.versionNumber}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel salvar.');
    } finally {
      setSaveState('idle');
    }
  }

  async function publish() {
    if (!selectedSlug) {
      return;
    }

    setSaveState('publishing');
    setMessage('');

    try {
      const result = await portalFetch<{ published: PortalVersion }>(
        session,
        `/api/client/projects/${selectedSlug}/publish`,
        {
          method: 'POST',
          body: JSON.stringify({ content }),
        },
      );
      onSessionChange(result.session);
      setDetail((current) =>
        current
          ? {
              ...current,
              published: result.data.published,
              versions: [result.data.published, ...current.versions],
            }
          : current,
      );
      setMessage(`Publicado como versao ${result.data.published.versionNumber}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel publicar.');
    } finally {
      setSaveState('idle');
    }
  }

  async function rollback(version: PortalVersion) {
    if (!selectedSlug) {
      return;
    }

    setSaveState('rolling-back');
    setMessage('');

    try {
      const result = await portalFetch<{ published: PortalVersion }>(
        session,
        `/api/client/projects/${selectedSlug}/rollback`,
        {
          method: 'POST',
          body: JSON.stringify({ versionId: version.id }),
        },
      );
      onSessionChange(result.session);
      setDetail((current) =>
        current
          ? {
              ...current,
              published: result.data.published,
              versions: [result.data.published, ...current.versions],
            }
          : current,
      );
      setContent(result.data.published.content);
      setMessage(`Rollback publicado como versao ${result.data.published.versionNumber}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel fazer rollback.');
    } finally {
      setSaveState('idle');
    }
  }

  function logout() {
    clearPortalSession();
    onSessionChange(null);
  }

  return (
    <main className="portal-shell">
      <aside className="portal-sidebar">
        <header className="portal-sidebar-brand">
          <span className="portal-mark">HC</span>
          <div>
            <p>Cliente</p>
            <strong>Portal de conteudo</strong>
          </div>
          <button type="button" onClick={logout} aria-label="Sair">
            <LogOut size={18} />
          </button>
        </header>

        <section className="portal-user-card">
          <span>Logado como</span>
          <strong>{session.user.email}</strong>
        </section>

        <section className="portal-project-list" aria-label="Projetos">
          <div className="portal-section-title">
            <span>Projetos</span>
            <button type="button" onClick={() => void loadProjects()} aria-label="Atualizar projetos">
              <RefreshCcw size={15} className={loadState === 'loading' ? 'spin' : ''} />
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="portal-empty-mini">
              {loadState === 'loading' ? 'Carregando projetos.' : 'Nenhum projeto vinculado.'}
            </div>
          ) : (
            <div className="portal-project-stack">
              {projects.map((project) => (
                <button
                  key={project.projectSlug}
                  type="button"
                  className={project.projectSlug === selectedSlug ? 'is-active' : ''}
                  onClick={() => setSelectedSlug(project.projectSlug)}
                >
                  <strong>{project.projectSlug}</strong>
                  <span>{project.editableCount} campo(s) editaveis</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </aside>

      <section className="portal-editor">
        <header className="portal-editor-top">
          <div>
            <p>Publicacao direta protegida</p>
            <h1>{selectedProject?.projectSlug || 'Projetos'}</h1>
          </div>
          <div className="portal-editor-actions">
            <button
              type="button"
              className="portal-secondary-button"
              onClick={saveDraft}
              disabled={!detail || saveState !== 'idle'}
            >
              {saveState === 'saving' ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
              Salvar rascunho
            </button>
            <button
              type="button"
              className="portal-primary-button"
              onClick={publish}
              disabled={!detail || saveState !== 'idle'}
            >
              {saveState === 'publishing' ? <Loader2 className="spin" size={17} /> : <CheckCircle2 size={17} />}
              Publicar
            </button>
          </div>
        </header>

        {message ? <p className="portal-alert">{message}</p> : null}

        {!selectedProject && loadState !== 'loading' ? (
          <section className="portal-empty-state">
            <ShieldCheck size={30} />
            <strong>Nenhum acesso ativo</strong>
            <p>Crie o usuario no Supabase e vincule o email ao projeto na tabela client_project_access.</p>
          </section>
        ) : null}

        {detailState === 'loading' ? (
          <section className="portal-empty-state">
            <Loader2 className="spin" size={30} />
            <strong>Carregando editor</strong>
          </section>
        ) : null}

        {detail && detailState !== 'loading' ? (
          <div className="portal-editor-grid">
            <section className="portal-fields-panel">
              <div className="portal-section-title">
                <span>Campos liberados</span>
                <strong>{detail.fields.length}</strong>
              </div>
              <div className="portal-field-stack">
                {detail.fields.map((field) => (
                  <EditableField
                    key={field.key}
                    content={content}
                    field={field}
                    projectSlug={detail.project.projectSlug}
                    session={session}
                    onSessionChange={onSessionChange}
                    onChange={(value) =>
                      setContent((current) => ({
                        ...current,
                        [field.key]: value,
                      }))
                    }
                  />
                ))}
              </div>
            </section>

            <aside className="portal-history-panel">
              <div className="portal-current-card">
                <span>Versao publicada</span>
                <strong>
                  {detail.published ? `v${detail.published.versionNumber}` : 'Ainda sem publicacao'}
                </strong>
                <p>{detail.published?.publishedAt ? formatDate(detail.published.publishedAt) : 'Publique para ativar os overrides.'}</p>
              </div>

              <div className="portal-history-list">
                <div className="portal-section-title">
                  <span>
                    <History size={14} />
                    Historico
                  </span>
                </div>
                {detail.versions.length === 0 ? (
                  <p className="portal-muted">Nenhuma versao publicada.</p>
                ) : (
                  detail.versions.map((version) => (
                    <article key={version.id} className="portal-version-card">
                      <div>
                        <strong>v{version.versionNumber}</strong>
                        <span>{version.status === 'rollback' ? 'Rollback' : 'Publicado'}</span>
                      </div>
                      <p>{formatDate(version.publishedAt || version.createdAt)}</p>
                      <button
                        type="button"
                        onClick={() => void rollback(version)}
                        disabled={saveState !== 'idle'}
                      >
                        <ArrowDownToLine size={15} />
                        Restaurar
                      </button>
                    </article>
                  ))
                )}
              </div>
            </aside>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function EditableField({
  content,
  field,
  projectSlug,
  session,
  onSessionChange,
  onChange,
}: {
  content: PortalContent;
  field: PortalField;
  projectSlug: string;
  session: PortalSession;
  onSessionChange: (session: PortalSession | null) => void;
  onChange: (value: PortalContentValue) => void;
}) {
  const value = content[field.key] || field.defaultValue;
  const [uploading, setUploading] = useState(false);
  const maxLength = field.validation?.maxLength || 1200;

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);

    try {
      const result = await uploadPortalAsset(session, projectSlug, file);
      onSessionChange(result.session);
      onChange({
        type: 'image',
        assetId: result.asset.id,
        url: result.asset.publicUrl,
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Nao foi possivel enviar a imagem.');
    } finally {
      event.target.value = '';
      setUploading(false);
    }
  }

  return (
    <article className={`portal-field-card portal-field-${field.type}`}>
      <header>
        <span>{iconForField(field.type)}</span>
        <div>
          <p>{field.key}</p>
          <h2>{field.label}</h2>
        </div>
      </header>

      {field.type === 'text' ? (
        <label>
          <span>Texto publicado</span>
          <textarea
            maxLength={maxLength}
            rows={4}
            value={value?.type === 'text' ? value.value : ''}
            onChange={(event) => onChange({ type: 'text', value: event.target.value })}
          />
          <small>
            {value?.type === 'text' ? value.value.length : 0}/{maxLength}
          </small>
        </label>
      ) : null}

      {field.type === 'sectionVisible' ? (
        <label className="portal-toggle-row">
          <input
            type="checkbox"
            checked={value?.type === 'sectionVisible' ? value.visible : true}
            onChange={(event) => onChange({ type: 'sectionVisible', visible: event.target.checked })}
          />
          <span>Secao visivel</span>
        </label>
      ) : null}

      {field.type === 'image' ? (
        <div className="portal-image-uploader">
          {value?.type === 'image' && value.url ? (
            <img src={value.url} alt="" />
          ) : (
            <div>
              <ImageIcon size={24} />
              <span>Nenhuma imagem publicada</span>
            </div>
          )}
          <label className="portal-upload-button">
            {uploading ? <Loader2 className="spin" size={16} /> : <Upload size={16} />}
            {uploading ? 'Enviando' : 'Enviar imagem'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => void handleUpload(event)}
              disabled={uploading}
            />
          </label>
        </div>
      ) : null}
    </article>
  );
}

function PortalConfigScreen() {
  return (
    <main className="portal-login-shell">
      <section className="portal-login-card">
        <span className="portal-mark">
          <ShieldCheck size={26} aria-hidden="true" />
        </span>
        <p>Configuracao pendente</p>
        <h1>Supabase nao configurado</h1>
        <p className="portal-config-copy">
          Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no build do app de feedback.
        </p>
      </section>
    </main>
  );
}

function resolveEditableContent(
  fields: PortalField[],
  published: PortalVersion | null,
  draft: PortalVersion | null,
) {
  const base = fields.reduce<PortalContent>((acc, field) => {
    if (field.defaultValue) {
      acc[field.key] = field.defaultValue;
    }

    return acc;
  }, {});

  return {
    ...base,
    ...(published?.content || {}),
    ...(draft?.content || {}),
  };
}

function iconForField(type: PortalField['type']) {
  if (type === 'image') {
    return <ImageIcon size={18} />;
  }

  if (type === 'sectionVisible') {
    return <ToggleLeft size={18} />;
  }

  return <Type size={18} />;
}

function formatDate(value: string) {
  if (!value) {
    return 'Data indisponivel';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
