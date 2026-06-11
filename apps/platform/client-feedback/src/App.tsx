import {
  ArrowUpRight,
  Check,
  CircleDot,
  Clock3,
  Eraser,
  Image as ImageIcon,
  Inbox,
  KeyRound,
  ListFilter,
  Loader2,
  MessageSquare,
  MousePointer2,
  PanelLeft,
  PenLine,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  draftFromElement,
  getElementBounds,
  isDomElement,
  resolveElement,
  resolveFeedbackElement,
} from './feedbackTarget';
import { clearStoredDraft, loadStoredDraft, saveStoredDraft } from './storage';
import { ClientPortalApp } from './ClientPortal';
import type {
  AdminFeedbackSubmission,
  AdminSubmissionSummary,
  DraftFeedback,
  ElementBounds,
  FeedbackItem,
  FeedbackItemType,
  FeedbackMode,
  FeedbackSubmission,
  FeedbackStatus,
  ReviewSession,
} from './types';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; session: ReviewSession }
  | { status: 'error'; message: string };

type AdminAuthState = 'checking' | 'login' | 'ready';

type Reviewer = {
  name: string;
  email: string;
};

type FrameViewport = {
  scrollX: number;
  scrollY: number;
  width: number;
  height: number;
  accessible: boolean;
};

type HighlightResolutionSource = 'target' | 'legacy' | 'signature' | 'fallback';

type ResolvedHighlightTarget = {
  bounds: ElementBounds;
  source: HighlightResolutionSource;
};

const MODES: Array<{
  id: FeedbackMode;
  label: string;
  description: string;
  icon: typeof Type;
}> = [
  { id: 'text', label: 'Texto', description: 'Sugerir uma troca de copy.', icon: Type },
  { id: 'section', label: 'Secao', description: 'Comentar um bloco da pagina.', icon: MessageSquare },
  { id: 'image', label: 'Imagem', description: 'Comentar ou pedir remocao.', icon: ImageIcon },
  { id: 'review', label: 'Revisar', description: 'Conferir antes de enviar.', icon: Check },
];

const TYPE_LABELS: Record<FeedbackItemType, string> = {
  'text-suggestion': 'Texto',
  'section-comment': 'Secao',
  'image-comment': 'Imagem',
  'image-removal': 'Remover imagem',
};

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: 'Novo',
  viewed: 'Visto',
  in_progress: 'Em andamento',
  resolved: 'Resolvido',
};

const STATUS_OPTIONS: Array<{ value: FeedbackStatus | ''; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'new', label: STATUS_LABELS.new },
  { value: 'viewed', label: STATUS_LABELS.viewed },
  { value: 'in_progress', label: STATUS_LABELS.in_progress },
  { value: 'resolved', label: STATUS_LABELS.resolved },
];

const EMPTY_REVIEWER: Reviewer = {
  name: '',
  email: '',
};

function ClientFeedbackApp() {
  const token = useMemo(() => getTokenFromLocation(), []);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const modeRef = useRef<FeedbackMode>('text');
  const cleanupFrameRef = useRef<(() => void) | null>(null);
  const metricsRafRef = useRef<number | null>(null);

  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [mode, setMode] = useState<FeedbackMode>('text');
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [draft, setDraft] = useState<DraftFeedback | null>(null);
  const [hoverBounds, setHoverBounds] = useState<ElementBounds | null>(null);
  const [reviewer, setReviewer] = useState<Reviewer>(EMPTY_REVIEWER);
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [frameViewport, setFrameViewport] = useState<FrameViewport>({
    scrollX: 0,
    scrollY: 0,
    width: 0,
    height: 0,
    accessible: true,
  });

  const session = loadState.status === 'ready' ? loadState.session : null;
  const activePreviewUrl = session?.previewUrl || 'about:blank';
  const expirationLabel = session ? formatDate(session.expiresAt) : '';

  useEffect(() => {
    modeRef.current = mode;

    if (mode === 'review') {
      setHoverBounds(null);
      setDraft(null);
    }
  }, [mode]);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      if (!token) {
        setLoadState({
          status: 'error',
          message: 'Link de revisao sem token. Gere um link assinado antes de enviar ao cliente.',
        });
        return;
      }

      try {
        const response = await fetch(`/api/review-session?token=${encodeURIComponent(token)}`, {
          headers: { Accept: 'application/json' },
        });
        const payload = (await response.json().catch(() => ({}))) as {
          session?: ReviewSession;
          error?: string;
        };

        if (!response.ok || !payload.session) {
          throw new Error(payload.error || 'Nao foi possivel abrir esta revisao.');
        }

        if (!cancelled) {
          setLoadState({ status: 'ready', session: payload.session });
        }
      } catch (error) {
        if (!cancelled) {
          setLoadState({
            status: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'Nao foi possivel validar o link de revisao.',
          });
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const stored = loadStoredDraft(session.token);

    if (stored) {
      setItems(stored.items);
      setReviewer(stored.reviewer);
    } else {
      setItems([]);
      setReviewer(EMPTY_REVIEWER);
    }
  }, [session]);

  useEffect(() => {
    if (!session || submitState === 'sent') {
      return;
    }

    saveStoredDraft(session.token, reviewer, items);
  }, [items, reviewer, session, submitState]);

  const updateFrameMetrics = useCallback(() => {
    const iframe = iframeRef.current;

    if (!iframe) {
      return;
    }

    if (metricsRafRef.current !== null) {
      window.cancelAnimationFrame(metricsRafRef.current);
    }

    metricsRafRef.current = window.requestAnimationFrame(() => {
      metricsRafRef.current = null;

      try {
        const frameWindow = iframe.contentWindow;

        setFrameViewport({
          scrollX: Math.round(frameWindow?.scrollX || 0),
          scrollY: Math.round(frameWindow?.scrollY || 0),
          width: Math.round(frameWindow?.innerWidth || iframe.clientWidth),
          height: Math.round(frameWindow?.innerHeight || iframe.clientHeight),
          accessible: true,
        });
      } catch {
        setFrameViewport((current) => ({ ...current, accessible: false }));
      }
    });
  }, []);

  const attachFrameHandlers = useCallback(() => {
    cleanupFrameRef.current?.();
    cleanupFrameRef.current = null;
    setDraft(null);
    setHoverBounds(null);

    const iframe = iframeRef.current;

    if (!iframe || !session) {
      return;
    }

    try {
      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;

      if (!doc || !win) {
        throw new Error('Frame indisponivel.');
      }

      injectFrameStyle(doc);
      updateFrameMetrics();

      const onClick = (event: MouseEvent) => {
        const activeMode = modeRef.current;

        if (activeMode === 'review') {
          return;
        }

        const nextDraft = draftFromElement(event.target, activeMode, session.route, {
          clientX: event.clientX,
          clientY: event.clientY,
        });

        if (!nextDraft) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        setDraft(nextDraft);
        setMode(activeMode);
        setSubmitState('idle');
      };

      const onMove = (event: MouseEvent) => {
        const activeMode = modeRef.current;

        if (activeMode === 'review' || !isDomElement(event.target)) {
          setHoverBounds(null);
          return;
        }

        const element = resolveElement(event.target, activeMode);
        const frameWindow = element?.ownerDocument.defaultView;

        if (!element || !frameWindow) {
          setHoverBounds(null);
          return;
        }

        const rect = element.getBoundingClientRect();
        setHoverBounds({
          x: Math.round(rect.left + frameWindow.scrollX),
          y: Math.round(rect.top + frameWindow.scrollY),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      };

      const onLeave = () => setHoverBounds(null);

      doc.addEventListener('click', onClick, true);
      doc.addEventListener('mousemove', onMove, true);
      doc.addEventListener('mouseleave', onLeave, true);
      win.addEventListener('scroll', updateFrameMetrics, { passive: true });
      win.addEventListener('resize', updateFrameMetrics);

      cleanupFrameRef.current = () => {
        doc.removeEventListener('click', onClick, true);
        doc.removeEventListener('mousemove', onMove, true);
        doc.removeEventListener('mouseleave', onLeave, true);
        win.removeEventListener('scroll', updateFrameMetrics);
        win.removeEventListener('resize', updateFrameMetrics);
      };
    } catch {
      setFrameViewport((current) => ({ ...current, accessible: false }));
    }
  }, [session, updateFrameMetrics]);

  useEffect(() => {
    const iframe = iframeRef.current;

    if (!iframe || !session) {
      return undefined;
    }

    iframe.addEventListener('load', attachFrameHandlers);
    attachFrameHandlers();

    return () => {
      iframe.removeEventListener('load', attachFrameHandlers);
      cleanupFrameRef.current?.();
      cleanupFrameRef.current = null;
    };
  }, [attachFrameHandlers, session]);

  const visibleHighlights = useMemo(() => {
    const markers = items.map((item, index) => ({
      id: item.id,
      index: index + 1,
      type: item.type,
      bounds: item.bounds,
    }));

    if (draft) {
      markers.unshift({
        id: 'draft',
        index: 0,
        type: draft.type,
        bounds: draft.bounds,
      });
    }

    if (hoverBounds && mode !== 'review') {
      markers.unshift({
        id: 'hover',
        index: -1,
        type: mode === 'image' ? 'image-comment' : mode === 'text' ? 'text-suggestion' : 'section-comment',
        bounds: hoverBounds,
      });
    }

    return markers;
  }, [draft, hoverBounds, items, mode]);

  const canSubmit = Boolean(
    session && items.length > 0 && submitState !== 'sending' && submitState !== 'sent',
  );

  const commitDraft = () => {
    if (!draft) {
      return;
    }

    const normalized = normalizeDraft(draft);

    if (!normalized.comment.trim() && normalized.type !== 'image-removal') {
      setSubmitMessage('Adicione um comentario antes de salvar este ponto.');
      setSubmitState('error');
      return;
    }

    if (normalized.type === 'text-suggestion' && !normalized.suggestedText?.trim()) {
      setSubmitMessage('Informe o texto sugerido.');
      setSubmitState('error');
      return;
    }

    const item: FeedbackItem = {
      ...normalized,
      id: createId(),
      createdAt: new Date().toISOString(),
    };

    setItems((current) => [item, ...current]);
    setDraft(null);
    setSubmitState('idle');
    setSubmitMessage('');
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const submitFeedback = async () => {
    if (!session || !canSubmit) {
      return;
    }

    setSubmitState('sending');
    setSubmitMessage('');

    const submission: FeedbackSubmission = {
      token: session.token,
      projectSlug: session.projectSlug,
      route: session.route,
      reviewer,
      viewport: {
        width: frameViewport.width || window.innerWidth,
        height: frameViewport.height || window.innerHeight,
      },
      items,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(submission),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        messageId?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Nao foi possivel enviar o feedback.');
      }

      clearStoredDraft(session.token);
      setSubmitState('sent');
      setSubmitMessage(`Feedback enviado. ID: ${payload.messageId || 'email'}`);
    } catch (error) {
      setSubmitState('error');
      setSubmitMessage(
        error instanceof Error ? error.message : 'Nao foi possivel enviar o feedback.',
      );
    }
  };

  if (loadState.status === 'loading') {
    return <LoadingScreen />;
  }

  if (loadState.status === 'error') {
    return <ErrorScreen message={loadState.message} />;
  }

  return (
    <main className="app-shell">
      <aside className="review-panel" aria-label="Painel de edicao">
        <div className="panel-brand">
          <span className="brand-mark">HC</span>
          <div>
            <p>Feedback</p>
            <strong>{session?.projectName}</strong>
          </div>
        </div>

        <section className="session-card">
          <div>
            <span>Cliente</span>
            <strong>{session?.client}</strong>
          </div>
          <a href={activePreviewUrl} target="_blank" rel="noreferrer" aria-label="Abrir preview">
            <ArrowUpRight size={18} />
          </a>
        </section>

        <section className="mode-grid" aria-label="Modos de feedback">
          {MODES.map((entry) => {
            const Icon = entry.icon;
            return (
              <button
                key={entry.id}
                type="button"
                className={`mode-button ${mode === entry.id ? 'is-active' : ''}`}
                onClick={() => setMode(entry.id)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{entry.label}</span>
              </button>
            );
          })}
        </section>

        <section className="reviewer-block">
          <label>
            <span>Nome</span>
            <input
              value={reviewer.name}
              onChange={(event) =>
                setReviewer((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Seu nome"
            />
          </label>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={reviewer.email}
              onChange={(event) =>
                setReviewer((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="voce@email.com"
            />
          </label>
        </section>

        {draft ? (
          <DraftEditor
            draft={draft}
            onChange={setDraft}
            onCancel={() => setDraft(null)}
            onSave={commitDraft}
          />
        ) : (
          <EmptyDraft mode={mode} />
        )}

        <ReviewList items={items} onRemove={removeItem} />

        <div className="submit-zone">
          <button
            type="button"
            className="submit-button"
            disabled={!canSubmit}
            onClick={() => void submitFeedback()}
          >
            {submitState === 'sending' ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
            <span>
              {submitState === 'sending'
                ? 'Enviando'
                : submitState === 'sent'
                  ? 'Feedback enviado'
                  : 'Enviar feedback'}
            </span>
          </button>
          <p className={`submit-message ${submitState}`}>
            {submitMessage || `${items.length} ponto(s) salvos. Link expira em ${expirationLabel}.`}
          </p>
        </div>
      </aside>

      <section className="canvas-area" aria-label="Preview do projeto">
        <header className="canvas-toolbar">
          <div>
            <PanelLeft size={18} aria-hidden="true" />
            <span>{MODES.find((entry) => entry.id === mode)?.description}</span>
          </div>
          <div className="status-pill">
            <CircleDot size={14} aria-hidden="true" />
            <span>{frameViewport.accessible ? 'Preview ativo' : 'Acesso limitado'}</span>
          </div>
        </header>

        <div className="preview-frame">
          <iframe
            ref={iframeRef}
            title={`Preview ${session?.projectName}`}
            src={activePreviewUrl}
            onLoad={attachFrameHandlers}
          />

          <div className="overlay-layer" aria-hidden="true">
            {visibleHighlights.map((marker) => (
              <div
                key={marker.id}
                className={`highlight highlight-${marker.type} ${
                  marker.id === 'hover' ? 'is-hover' : ''
                } ${marker.id === 'draft' ? 'is-draft' : ''}`}
                style={boundsToStyle(marker.bounds, frameViewport)}
              >
                {marker.index > 0 ? <span>{marker.index}</span> : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function AdminFeedbackApp() {
  const initialSubmissionId = useMemo(() => getSubmissionIdFromLocation(), []);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const metricsRafRef = useRef<number | null>(null);
  const targetRafRef = useRef<number | null>(null);
  const adminFrameCleanupRef = useRef<(() => void) | null>(null);

  const [authState, setAuthState] = useState<AdminAuthState>('checking');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [submissions, setSubmissions] = useState<AdminSubmissionSummary[]>([]);
  const [selectedId, setSelectedId] = useState(initialSubmissionId);
  const [detail, setDetail] = useState<AdminFeedbackSubmission | null>(null);
  const [activeItemId, setActiveItemId] = useState('');
  const [filters, setFilters] = useState<{ status: FeedbackStatus | ''; project: string }>({
    status: '',
    project: '',
  });
  const [listState, setListState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [detailState, setDetailState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [adminMessage, setAdminMessage] = useState('');
  const [resolvedTargets, setResolvedTargets] = useState<Record<string, ResolvedHighlightTarget>>(
    {},
  );
  const [frameViewport, setFrameViewport] = useState<FrameViewport>({
    scrollX: 0,
    scrollY: 0,
    width: 0,
    height: 0,
    accessible: true,
  });

  const selectedSummary = useMemo(
    () => submissions.find((submission) => submission.id === selectedId) || null,
    [selectedId, submissions],
  );

  const resolveAdminTargets = useCallback(() => {
    const iframe = iframeRef.current;

    if (!iframe || !detail) {
      setResolvedTargets({});
      return;
    }

    if (targetRafRef.current !== null) {
      window.cancelAnimationFrame(targetRafRef.current);
    }

    targetRafRef.current = window.requestAnimationFrame(() => {
      targetRafRef.current = null;

      try {
        const doc = iframe.contentDocument;

        if (!doc) {
          throw new Error('Frame indisponivel.');
        }

        const nextTargets = detail.items.reduce<Record<string, ResolvedHighlightTarget>>(
          (acc, item) => {
            const resolution = resolveFeedbackElement(item, doc);
            const bounds = resolution.element ? getElementBounds(resolution.element) : null;

            acc[item.id] = bounds
              ? {
                  bounds,
                  source: resolution.source,
                }
              : {
                  bounds: item.bounds,
                  source: 'fallback',
                };

            return acc;
          },
          {},
        );

        setResolvedTargets(nextTargets);
      } catch {
        setFrameViewport((current) => ({ ...current, accessible: false }));
        setResolvedTargets(
          detail.items.reduce<Record<string, ResolvedHighlightTarget>>((acc, item) => {
            acc[item.id] = {
              bounds: item.bounds,
              source: 'fallback',
            };

            return acc;
          }, {}),
        );
      }
    });
  }, [detail]);

  const updateFrameMetrics = useCallback(() => {
    const iframe = iframeRef.current;

    if (!iframe) {
      return;
    }

    if (metricsRafRef.current !== null) {
      window.cancelAnimationFrame(metricsRafRef.current);
    }

    metricsRafRef.current = window.requestAnimationFrame(() => {
      metricsRafRef.current = null;

      try {
        const frameWindow = iframe.contentWindow;

        setFrameViewport({
          scrollX: Math.round(frameWindow?.scrollX || 0),
          scrollY: Math.round(frameWindow?.scrollY || 0),
          width: Math.round(frameWindow?.innerWidth || iframe.clientWidth),
          height: Math.round(frameWindow?.innerHeight || iframe.clientHeight),
          accessible: true,
        });
      } catch {
        setFrameViewport((current) => ({ ...current, accessible: false }));
      }
    });
  }, []);

  const refreshAdminFrame = useCallback(() => {
    updateFrameMetrics();
    resolveAdminTargets();
  }, [resolveAdminTargets, updateFrameMetrics]);

  const attachAdminFrameHandlers = useCallback(() => {
    adminFrameCleanupRef.current?.();
    adminFrameCleanupRef.current = null;

    const iframe = iframeRef.current;

    if (!iframe || !detail) {
      return;
    }

    try {
      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;

      if (!doc || !win) {
        throw new Error('Frame indisponivel.');
      }

      const scheduleRefresh = () => refreshAdminFrame();
      const imageElements = Array.from(doc.images).filter((image) => !image.complete);

      scheduleRefresh();
      window.setTimeout(scheduleRefresh, 80);
      window.setTimeout(scheduleRefresh, 320);
      void doc.fonts?.ready.then(scheduleRefresh).catch(() => {});

      win.addEventListener('scroll', scheduleRefresh, { passive: true });
      win.addEventListener('resize', scheduleRefresh);
      imageElements.forEach((image) => {
        image.addEventListener('load', scheduleRefresh);
        image.addEventListener('error', scheduleRefresh);
      });

      adminFrameCleanupRef.current = () => {
        win.removeEventListener('scroll', scheduleRefresh);
        win.removeEventListener('resize', scheduleRefresh);
        imageElements.forEach((image) => {
          image.removeEventListener('load', scheduleRefresh);
          image.removeEventListener('error', scheduleRefresh);
        });
      };
    } catch {
      setFrameViewport((current) => ({ ...current, accessible: false }));
    }
  }, [detail, refreshAdminFrame]);

  const updateSubmissionStatus = useCallback(
    async (id: string, status: FeedbackStatus, replaceDetail = true) => {
      setAdminMessage('');

      try {
        const response = await fetch('/api/admin/feedback-submissions/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'same-origin',
          body: JSON.stringify({ id, status }),
        });
        const payload = (await response.json().catch(() => ({}))) as {
          submission?: AdminFeedbackSubmission;
          error?: string;
        };

        if (!response.ok || !payload.submission) {
          throw new Error(payload.error || 'Nao foi possivel atualizar o status.');
        }

        if (replaceDetail) {
          setDetail(payload.submission);
        }

        setSubmissions((current) =>
          current.map((entry) =>
            entry.id === payload.submission?.id
              ? {
                  ...entry,
                  status: payload.submission.status,
                  viewedAt: payload.submission.viewedAt,
                  resolvedAt: payload.submission.resolvedAt,
                }
              : entry,
          ),
        );
      } catch (error) {
        setAdminMessage(
          error instanceof Error ? error.message : 'Nao foi possivel atualizar o status.',
        );
      }
    },
    [],
  );

  const loadList = useCallback(async () => {
    setListState('loading');
    setAdminMessage('');

    try {
      const params = new URLSearchParams({ limit: '80' });

      if (filters.status) {
        params.set('status', filters.status);
      }

      if (filters.project.trim()) {
        params.set('project', filters.project.trim());
      }

      const response = await fetch(`/api/admin/feedback-submissions?${params.toString()}`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      const payload = (await response.json().catch(() => ({}))) as {
        submissions?: AdminSubmissionSummary[];
        error?: string;
      };

      if (!response.ok || !Array.isArray(payload.submissions)) {
        throw new Error(payload.error || 'Nao foi possivel carregar a inbox.');
      }

      setSubmissions(payload.submissions);

      if (!selectedId && payload.submissions[0]) {
        setSelectedId(payload.submissions[0].id);
      }

      setListState('idle');
    } catch (error) {
      setListState('error');
      setAdminMessage(error instanceof Error ? error.message : 'Nao foi possivel carregar a inbox.');
    }
  }, [filters.project, filters.status, selectedId]);

  const loadDetail = useCallback(
    async (id: string) => {
      setDetailState('loading');
      setAdminMessage('');

      try {
        const response = await fetch(
          `/api/admin/feedback-submissions?id=${encodeURIComponent(id)}`,
          {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
          },
        );
        const payload = (await response.json().catch(() => ({}))) as {
          submission?: AdminFeedbackSubmission;
          error?: string;
        };

        if (!response.ok || !payload.submission) {
          throw new Error(payload.error || 'Nao foi possivel abrir este feedback.');
        }

        setDetail(payload.submission);
        setActiveItemId(payload.submission.items[0]?.id || '');
        setDetailState('idle');

        if (payload.submission.status === 'new') {
          void updateSubmissionStatus(payload.submission.id, 'viewed');
        }
      } catch (error) {
        setDetailState('error');
        setAdminMessage(
          error instanceof Error ? error.message : 'Nao foi possivel abrir este feedback.',
        );
      }
    },
    [updateSubmissionStatus],
  );

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch('/api/admin/session', {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
        });
        const payload = (await response.json().catch(() => ({}))) as {
          authenticated?: boolean;
        };

        if (!cancelled) {
          setAuthState(response.ok && payload.authenticated ? 'ready' : 'login');
        }
      } catch {
        if (!cancelled) {
          setAuthState('login');
        }
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authState !== 'ready') {
      return;
    }

    void loadList();
  }, [authState, loadList]);

  useEffect(() => {
    if (authState !== 'ready' || !selectedId) {
      return;
    }

    void loadDetail(selectedId);
  }, [authState, loadDetail, selectedId]);

  useEffect(() => {
    setResolvedTargets({});
    adminFrameCleanupRef.current?.();
    adminFrameCleanupRef.current = null;

    if (!detail) {
      return undefined;
    }

    const timeout = window.setTimeout(attachAdminFrameHandlers, 0);

    return () => {
      window.clearTimeout(timeout);
      adminFrameCleanupRef.current?.();
      adminFrameCleanupRef.current = null;

      if (targetRafRef.current !== null) {
        window.cancelAnimationFrame(targetRafRef.current);
        targetRafRef.current = null;
      }
    };
  }, [attachAdminFrameHandlers, detail?.id]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginBusy(true);
    setLoginError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Nao foi possivel entrar.');
      }

      setPassword('');
      setAuthState('ready');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Nao foi possivel entrar.');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'same-origin',
    }).catch(() => {});
    setAuthState('login');
    setDetail(null);
    setSubmissions([]);
  };

  const selectItem = (item: FeedbackItem) => {
    setActiveItemId(item.id);

    try {
      const doc = iframeRef.current?.contentDocument;
      const resolution = doc ? resolveFeedbackElement(item, doc) : null;

      if (resolution?.element) {
        resolution.element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      } else {
        iframeRef.current?.contentWindow?.scrollTo({
          top: Math.max(item.bounds.y - 96, 0),
          behavior: 'smooth',
        });
      }

      window.setTimeout(refreshAdminFrame, 160);
      window.setTimeout(refreshAdminFrame, 360);
    } catch {
      setFrameViewport((current) => ({ ...current, accessible: false }));
    }
  };

  const visibleHighlights = useMemo(() => {
    if (!detail) {
      return [];
    }

    return detail.items.map((item, index) => ({
      id: item.id,
      index: index + 1,
      type: item.type,
      bounds: resolvedTargets[item.id]?.bounds || item.bounds,
      source: resolvedTargets[item.id]?.source || 'fallback',
      active: item.id === activeItemId,
    }));
  }, [activeItemId, detail, resolvedTargets]);

  if (authState === 'checking') {
    return <LoadingScreen label="Validando acesso privado" />;
  }

  if (authState === 'login') {
    return (
      <AdminLoginScreen
        busy={loginBusy}
        error={loginError}
        password={password}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <main className="admin-shell">
      <aside className="admin-inbox" aria-label="Inbox de feedbacks">
        <header className="admin-brand">
          <span className="brand-mark">HC</span>
          <div>
            <p>Feedback privado</p>
            <strong>Inbox visual</strong>
          </div>
          <button type="button" className="admin-icon-button" onClick={handleLogout} aria-label="Sair">
            <X size={18} />
          </button>
        </header>

        <section className="admin-filter-panel" aria-label="Filtros">
          <label>
            <span>
              <ListFilter size={14} aria-hidden="true" />
              Status
            </span>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as FeedbackStatus | '',
                }))
              }
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>
              <Search size={14} aria-hidden="true" />
              Projeto
            </span>
            <input
              value={filters.project}
              onChange={(event) =>
                setFilters((current) => ({ ...current, project: event.target.value }))
              }
              placeholder="clicktofly"
            />
          </label>
          <button type="button" className="admin-refresh-button" onClick={() => void loadList()}>
            <RefreshCw size={16} className={listState === 'loading' ? 'spin' : ''} />
            Atualizar
          </button>
        </section>

        <section className="admin-list" aria-label="Feedbacks recebidos">
          <div className="admin-list-title">
            <span>
              <Inbox size={15} aria-hidden="true" />
              Recebidos
            </span>
            <strong>{submissions.length}</strong>
          </div>

          {submissions.length === 0 ? (
            <div className="admin-empty">
              <Inbox size={22} aria-hidden="true" />
              <p>{listState === 'loading' ? 'Carregando feedbacks.' : 'Nenhum feedback encontrado.'}</p>
            </div>
          ) : (
            <div className="admin-submission-stack">
              {submissions.map((submission) => (
                <button
                  key={submission.id}
                  type="button"
                  className={`admin-submission-card ${
                    submission.id === selectedId ? 'is-selected' : ''
                  } status-${submission.status}`}
                  onClick={() => setSelectedId(submission.id)}
                >
                  <span className="submission-status">{STATUS_LABELS[submission.status]}</span>
                  <strong>{submission.client}</strong>
                  <span>{submission.projectName}</span>
                  <small>
                    {submission.itemCount} ponto(s) - {formatIsoDate(submission.createdAt)}
                  </small>
                </button>
              ))}
            </div>
          )}
        </section>
      </aside>

      <section className="admin-detail" aria-label="Detalhe visual do feedback">
        <header className="admin-detail-toolbar">
          <div>
            <p>Feedback recebido</p>
            <h1>{detail?.client || selectedSummary?.client || 'Selecione um feedback'}</h1>
          </div>
          {detail ? (
            <div className="admin-toolbar-actions">
              <select
                value={detail.status}
                onChange={(event) =>
                  void updateSubmissionStatus(detail.id, event.target.value as FeedbackStatus)
                }
                aria-label="Alterar status"
              >
                {STATUS_OPTIONS.filter((option) => option.value).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <a href={detail.previewUrl} target="_blank" rel="noreferrer" className="admin-open-link">
                <ArrowUpRight size={16} />
                Preview
              </a>
            </div>
          ) : null}
        </header>

        {adminMessage ? <p className="admin-alert">{adminMessage}</p> : null}

        {!detail && detailState !== 'loading' ? (
          <section className="admin-detail-empty">
            <ShieldCheck size={28} aria-hidden="true" />
            <strong>Escolha um feedback na inbox</strong>
            <p>O detalhe abre com o preview do site e os pontos marcados pelo cliente.</p>
          </section>
        ) : null}

        {detailState === 'loading' ? (
          <section className="admin-detail-empty">
            <Loader2 className="spin" size={28} aria-hidden="true" />
            <strong>Carregando feedback visual</strong>
          </section>
        ) : null}

        {detail && detailState !== 'loading' ? (
          <div className="admin-workspace">
            <section className="admin-preview-column">
              <div className="admin-meta-row">
                <span>
                  <Clock3 size={14} aria-hidden="true" />
                  {formatIsoDate(detail.createdAt)}
                </span>
                <span>{detail.projectName}</span>
                <span>{detail.route}</span>
                <span>{detail.itemCount} ponto(s)</span>
              </div>

              <div className="admin-preview-frame">
                <iframe
                  ref={iframeRef}
                  title={`Feedback ${detail.projectName}`}
                  src={detail.previewUrl}
                  onLoad={attachAdminFrameHandlers}
                />

                <div className="overlay-layer" aria-hidden="true">
                  {visibleHighlights.map((marker) => (
                    <div
                      key={marker.id}
                      className={`highlight highlight-${marker.type} ${
                        marker.active ? 'is-active' : ''
                      } ${marker.source === 'fallback' ? 'is-fallback' : ''}`}
                      style={boundsToStyle(marker.bounds, frameViewport)}
                    >
                      <span>{marker.index}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside className="admin-item-panel" aria-label="Pedidos do cliente">
              <div className="admin-reviewer-card">
                <span>Cliente/revisor</span>
                <strong>{detail.reviewer.name || detail.client}</strong>
                <p>{detail.reviewer.email || 'Email nao informado'}</p>
              </div>

              <div className="admin-item-stack">
                {detail.items.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`admin-item-card card-${item.type} ${
                      item.id === activeItemId ? 'is-active' : ''
                    }`}
                    onClick={() => selectItem(item)}
                  >
                    <span className="admin-item-index">{index + 1}</span>
                    <div>
                      <strong>{TYPE_LABELS[item.type]}</strong>
                      <p>{item.label}</p>
                    </div>
                    {item.suggestedText ? <blockquote>{item.suggestedText}</blockquote> : null}
                    {item.comment ? <p className="admin-item-comment">{item.comment}</p> : null}
                    {item.imageSrc ? <small>Imagem: {shorten(item.imageSrc, 92)}</small> : null}
                    <small className="admin-target-state">
                      Ancoragem:{' '}
                      {resolvedTargets[item.id]?.source === 'target'
                        ? 'DOM atual'
                        : resolvedTargets[item.id]?.source === 'legacy'
                          ? 'selector legado'
                          : resolvedTargets[item.id]?.source === 'signature'
                            ? 'assinatura do elemento'
                            : 'coordenada salva'}
                    </small>
                    <small>
                      Selector: {shorten(item.selector, 120)} | Bounds: {item.bounds.x},{' '}
                      {item.bounds.y}, {item.bounds.width}x{item.bounds.height}
                    </small>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function LoadingScreen({ label = 'Validando revisao' }: { label?: string }) {
  return (
    <div className="state-screen">
      <Loader2 className="spin" size={28} aria-hidden="true" />
      <strong>{label}</strong>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="state-screen">
      <MousePointer2 size={30} aria-hidden="true" />
      <strong>Revisao indisponivel</strong>
      <p>{message}</p>
    </div>
  );
}

function AdminLoginScreen({
  busy,
  error,
  password,
  onPasswordChange,
  onSubmit,
}: {
  busy: boolean;
  error: string;
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <main className="admin-login-shell">
      <section className="admin-login-card">
        <span className="admin-login-mark">
          <ShieldCheck size={24} aria-hidden="true" />
        </span>
        <p>Area privada</p>
        <h1>Inbox visual de feedbacks</h1>
        <form onSubmit={onSubmit}>
          <label>
            <span>
              <KeyRound size={14} aria-hidden="true" />
              Senha admin
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              required
            />
          </label>
          <button type="submit" className="admin-login-button" disabled={busy}>
            {busy ? <Loader2 className="spin" size={18} /> : <ShieldCheck size={18} />}
            Entrar
          </button>
          {error ? <p className="admin-login-error">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}

function EmptyDraft({ mode }: { mode: FeedbackMode }) {
  if (mode === 'review') {
    return (
      <section className="empty-draft">
        <Check size={18} aria-hidden="true" />
        <p>Revise os pontos salvos e envie quando estiver pronto.</p>
      </section>
    );
  }

  return (
    <section className="empty-draft">
      <MousePointer2 size={18} aria-hidden="true" />
      <p>Clique no preview para selecionar um ponto.</p>
    </section>
  );
}

function DraftEditor({
  draft,
  onChange,
  onCancel,
  onSave,
}: {
  draft: DraftFeedback;
  onChange: (draft: DraftFeedback) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const isImage = draft.imageSrc || draft.type === 'image-comment' || draft.type === 'image-removal';

  return (
    <section className="draft-editor">
      <div className="draft-header">
        <div>
          <span>Novo ponto</span>
          <strong>{draft.label}</strong>
        </div>
        <button type="button" className="icon-button" onClick={onCancel} aria-label="Cancelar">
          <X size={18} />
        </button>
      </div>

      {draft.type === 'text-suggestion' ? (
        <>
          <label>
            <span>Texto atual</span>
            <textarea value={draft.originalText || ''} readOnly rows={3} />
          </label>
          <label>
            <span>Texto sugerido</span>
            <textarea
              value={draft.suggestedText || ''}
              onChange={(event) => onChange({ ...draft, suggestedText: event.target.value })}
              rows={4}
            />
          </label>
        </>
      ) : null}

      {isImage ? (
        <div className="image-action-toggle" role="group" aria-label="Acao da imagem">
          <button
            type="button"
            className={draft.type === 'image-comment' ? 'is-active' : ''}
            onClick={() => onChange({ ...draft, type: 'image-comment' })}
          >
            <PenLine size={16} />
            Comentar
          </button>
          <button
            type="button"
            className={draft.type === 'image-removal' ? 'is-active' : ''}
            onClick={() => onChange({ ...draft, type: 'image-removal' })}
          >
            <Eraser size={16} />
            Remover
          </button>
        </div>
      ) : null}

      <label>
        <span>Comentario</span>
        <textarea
          value={draft.comment}
          onChange={(event) => onChange({ ...draft, comment: event.target.value })}
          placeholder="Descreva o ajuste desejado."
          rows={4}
        />
      </label>

      <button type="button" className="save-point-button" onClick={onSave}>
        <Check size={18} />
        Salvar ponto
      </button>
    </section>
  );
}

function ReviewList({
  items,
  onRemove,
}: {
  items: FeedbackItem[];
  onRemove: (id: string) => void;
}) {
  return (
    <section className="review-list" aria-label="Pontos salvos">
      <div className="section-title">
        <span>Pontos salvos</span>
        <strong>{items.length}</strong>
      </div>

      {items.length === 0 ? (
        <p className="empty-list">Nenhum ponto salvo ainda.</p>
      ) : (
        <div className="item-stack">
          {items.map((item, index) => (
            <article key={item.id} className={`feedback-card card-${item.type}`}>
              <div className="feedback-card-top">
                <span>{index + 1}</span>
                <div>
                  <strong>{TYPE_LABELS[item.type]}</strong>
                  <p>{item.label}</p>
                </div>
                <button type="button" onClick={() => onRemove(item.id)} aria-label="Remover ponto">
                  <Trash2 size={16} />
                </button>
              </div>
              {item.suggestedText ? <blockquote>{item.suggestedText}</blockquote> : null}
              {item.comment ? <p className="card-comment">{item.comment}</p> : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function normalizeDraft(draft: DraftFeedback): DraftFeedback {
  if (draft.type === 'image-removal' && !draft.comment.trim()) {
    return {
      ...draft,
      comment: 'Cliente pediu para remover esta imagem.',
    };
  }

  return draft;
}

function injectFrameStyle(doc: Document) {
  doc.documentElement.dataset.hcFeedback = 'active';

  if (doc.getElementById('hc-feedback-style')) {
    return;
  }

  const style = doc.createElement('style');
  style.id = 'hc-feedback-style';
  style.textContent = `
    html[data-hc-feedback="active"],
    html[data-hc-feedback="active"] * {
      cursor: crosshair !important;
    }
  `;
  doc.head.appendChild(style);
}

function boundsToStyle(bounds: ElementBounds, viewport: FrameViewport) {
  return {
    left: `${bounds.x - viewport.scrollX}px`,
    top: `${bounds.y - viewport.scrollY}px`,
    width: `${Math.max(bounds.width, 8)}px`,
    height: `${Math.max(bounds.height, 8)}px`,
  };
}

function getTokenFromLocation() {
  return new URLSearchParams(window.location.search).get('token') || '';
}

function getSubmissionIdFromLocation() {
  return new URLSearchParams(window.location.search).get('submission') || '';
}

function isAdminRoute() {
  return window.location.pathname.replace(/\/+$/, '').endsWith('/feedback/admin');
}

function isClientPortalRoute() {
  return window.location.pathname.replace(/\/+$/, '').endsWith('/feedback/client');
}

function formatDate(value: number) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(new Date(value * 1000));
}

function formatIsoDate(value: string) {
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

function shorten(value: string, maxLength: number) {
  if (!value || value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}...`;
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `feedback-${Date.now()}-${Math.random()}`;
}

function App() {
  if (isClientPortalRoute()) {
    return <ClientPortalApp />;
  }

  return isAdminRoute() ? <AdminFeedbackApp /> : <ClientFeedbackApp />;
}

export default App;
