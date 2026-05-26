import {
  ArrowUpRight,
  Check,
  CircleDot,
  Eraser,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  MousePointer2,
  PanelLeft,
  PenLine,
  Send,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { draftFromElement, isDomElement, resolveElement } from './feedbackTarget';
import { clearStoredDraft, loadStoredDraft, saveStoredDraft } from './storage';
import type {
  DraftFeedback,
  ElementBounds,
  FeedbackItem,
  FeedbackItemType,
  FeedbackMode,
  FeedbackSubmission,
  ReviewSession,
} from './types';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; session: ReviewSession }
  | { status: 'error'; message: string };

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

const EMPTY_REVIEWER: Reviewer = {
  name: '',
  email: '',
};

function App() {
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

        const nextDraft = draftFromElement(event.target, activeMode, session.route);

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

function LoadingScreen() {
  return (
    <div className="state-screen">
      <Loader2 className="spin" size={28} aria-hidden="true" />
      <strong>Validando revisao</strong>
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

function formatDate(value: number) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(new Date(value * 1000));
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `feedback-${Date.now()}-${Math.random()}`;
}

export default App;
