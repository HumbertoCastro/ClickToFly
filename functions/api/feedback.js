import {
  createFeedbackSubmission,
  updateFeedbackEmailStatus,
} from '../_shared/feedback-db.js';
import { json, methodNotAllowed } from '../_shared/responses.js';
import { verifyReviewToken } from '../_shared/token.js';

const MAX_BODY_BYTES = 160_000;
const MAX_ITEMS = 80;
const ALLOWED_TYPES = new Set([
  'text-suggestion',
  'section-comment',
  'image-comment',
  'image-removal',
]);

export async function onRequestPost({ request, env }) {
  const bodyText = await request.text();

  if (bodyText.length > MAX_BODY_BYTES) {
    return json({ error: 'Feedback muito grande.' }, { status: 413 });
  }

  let body;

  try {
    body = JSON.parse(bodyText);
  } catch {
    return json({ error: 'JSON invalido.' }, { status: 400 });
  }

  const verification = await verifyReviewToken(body.token, env.FEEDBACK_TOKEN_SECRET);

  if (!verification.ok) {
    return json({ error: verification.error }, { status: 401 });
  }

  const payload = verification.payload;
  const validation = validateSubmission(body, payload);

  if (!validation.ok) {
    return json({ error: validation.error }, { status: 400 });
  }

  let stored;

  try {
    stored = await createFeedbackSubmission(env, validation.submission, payload);
  } catch {
    return json({ error: 'Nao foi possivel salvar o feedback.' }, { status: 500 });
  }

  if (!stored.ok) {
    return json({ error: stored.error }, { status: 500 });
  }

  const adminUrl = new URL(
    `/feedback/admin/?submission=${encodeURIComponent(stored.id)}`,
    request.url,
  ).toString();
  const to = env.FEEDBACK_EMAIL_TO || 'dedebarbos@hotmail.com';
  const from = env.FEEDBACK_EMAIL_FROM || 'feedback@hcwebsolutions.com.br';
  const subject = `Novo feedback ${payload.projectName} - ${payload.client}`;
  const emailContext = {
    adminUrl,
    submissionId: stored.id,
    createdAt: stored.createdAt,
  };
  const html = renderFeedbackHtml(validation.submission, payload, emailContext);
  const text = renderFeedbackText(validation.submission, payload, emailContext);

  if (env.FEEDBACK_MOCK_EMAIL === '1') {
    await updateFeedbackEmailStatus(env, stored.id, 'mock', 'mock-email');
    return json({
      ok: true,
      submissionId: stored.id,
      messageId: 'mock-email',
      emailStatus: 'mock',
      adminUrl,
      to,
      subject,
    });
  }

  if (!env.RESEND_API_KEY) {
    await updateFeedbackEmailStatus(env, stored.id, 'error', 'missing-resend-key');
    return json(
      {
        ok: true,
        submissionId: stored.id,
        messageId: 'stored-no-email',
        emailStatus: 'error',
        warning: 'RESEND_API_KEY nao configurado. Feedback salvo no painel admin.',
      },
      { status: 202 },
    );
  }

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
      reply_to: validation.submission.reviewer.email || undefined,
    }),
  });
  const resendPayload = await resendResponse.json().catch(() => ({}));

  if (!resendResponse.ok) {
    await updateFeedbackEmailStatus(env, stored.id, 'error', 'resend-error');

    return json(
      {
        ok: true,
        submissionId: stored.id,
        messageId: 'stored-no-email',
        emailStatus: 'error',
        warning:
          resendPayload?.message ||
          resendPayload?.error ||
          'Resend recusou o envio do feedback. Feedback salvo no painel admin.',
      },
      { status: 202 },
    );
  }

  const messageId = resendPayload.id || 'resend-email';
  await updateFeedbackEmailStatus(env, stored.id, 'sent', messageId);

  return json({ ok: true, submissionId: stored.id, messageId, emailStatus: 'sent' });
}

export function onRequestGet() {
  return methodNotAllowed();
}

function validateSubmission(body, tokenPayload) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Payload ausente.' };
  }

  if (body.projectSlug !== tokenPayload.projectSlug || body.route !== tokenPayload.route) {
    return { ok: false, error: 'Projeto ou rota nao corresponde ao token.' };
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { ok: false, error: 'Inclua ao menos um ponto de feedback.' };
  }

  if (body.items.length > MAX_ITEMS) {
    return { ok: false, error: `Limite de ${MAX_ITEMS} pontos excedido.` };
  }

  const items = [];

  for (const rawItem of body.items) {
    const item = normalizeItem(rawItem);

    if (!item) {
      return { ok: false, error: 'Um dos pontos de feedback esta invalido.' };
    }

    items.push(item);
  }

  const reviewer = {
    name: cleanText(body.reviewer?.name, 120),
    email: cleanEmail(body.reviewer?.email),
  };

  return {
    ok: true,
    submission: {
      token: body.token,
      projectSlug: tokenPayload.projectSlug,
      route: tokenPayload.route,
      reviewer,
      viewport: {
        width: safeNumber(body.viewport?.width),
        height: safeNumber(body.viewport?.height),
      },
      items,
      createdAt: cleanText(body.createdAt, 80) || new Date().toISOString(),
    },
  };
}

function normalizeItem(item) {
  if (!item || typeof item !== 'object' || !ALLOWED_TYPES.has(item.type)) {
    return null;
  }

  const bounds = {
    x: safeNumber(item.bounds?.x),
    y: safeNumber(item.bounds?.y),
    width: safeNumber(item.bounds?.width),
    height: safeNumber(item.bounds?.height),
  };

  if (bounds.width <= 0 || bounds.height <= 0) {
    return null;
  }

  const comment = cleanText(item.comment, 4000);
  const suggestedText = cleanText(item.suggestedText, 4000);

  if (item.type !== 'image-removal' && !comment && item.type !== 'text-suggestion') {
    return null;
  }

  if (item.type === 'text-suggestion' && !suggestedText) {
    return null;
  }

  return {
    id: cleanText(item.id, 120),
    type: item.type,
    label: cleanText(item.label, 240),
    selector: cleanText(item.selector, 500),
    comment,
    bounds,
    target: normalizeTarget(item.target, bounds),
    route: cleanText(item.route, 200),
    createdAt: cleanText(item.createdAt, 80),
    originalText: cleanText(item.originalText, 4000),
    suggestedText,
    imageSrc: cleanText(item.imageSrc, 1000),
    imageAlt: cleanText(item.imageAlt, 400),
  };
}

function normalizeTarget(target, fallbackBounds) {
  if (!target || typeof target !== 'object') {
    return undefined;
  }

  const selectorCandidates = Array.isArray(target.selectorCandidates)
    ? target.selectorCandidates
        .map((selector) => cleanText(selector, 500))
        .filter(Boolean)
        .slice(0, 12)
    : [];
  const primarySelector = cleanText(target.primarySelector, 500) || selectorCandidates[0] || '';
  const capturedBounds = normalizeBounds(target.capturedBounds, fallbackBounds);
  const normalized = {
    version: 1,
    primarySelector,
    selectorCandidates: selectorCandidates.includes(primarySelector)
      ? selectorCandidates
      : [primarySelector, ...selectorCandidates].filter(Boolean).slice(0, 12),
    sectionSelector: cleanText(target.sectionSelector, 500),
    tagName: cleanText(target.tagName, 80).toLowerCase(),
    textFingerprint: cleanText(target.textFingerprint, 220),
    imageSrc: cleanText(target.imageSrc, 1000),
    clickOffsetRatio: normalizeClickOffset(target.clickOffsetRatio),
    capturedBounds,
  };

  if (!normalized.primarySelector && normalized.selectorCandidates.length === 0) {
    return undefined;
  }

  return normalized;
}

function normalizeBounds(value, fallback) {
  const bounds = {
    x: safeNumber(value?.x),
    y: safeNumber(value?.y),
    width: safeNumber(value?.width),
    height: safeNumber(value?.height),
  };

  if (bounds.width <= 0 || bounds.height <= 0) {
    return fallback;
  }

  return bounds;
}

function normalizeClickOffset(value) {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  return {
    x: clampRatio(value.x),
    y: clampRatio(value.y),
  };
}

function renderFeedbackHtml(submission, tokenPayload, emailContext) {
  const summary = summarizeItems(submission.items);

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4f6f8;color:#121417;font-family:Arial,sans-serif;">
    <main style="max-width:760px;margin:0 auto;padding:24px;">
      <section style="background:#111316;color:#ffffff;border-radius:8px;padding:20px;margin-bottom:14px;">
        <p style="margin:0 0 8px;color:#cbd3df;">HC Web Solutions</p>
        <h1 style="font-size:24px;line-height:1.15;margin:0;">Novo feedback de ${escapeHtml(
          tokenPayload.client,
        )}</h1>
        <p style="margin:12px 0 0;color:#d9dee5;">Projeto: ${escapeHtml(
          tokenPayload.projectName,
        )} | Rota: ${escapeHtml(tokenPayload.route)}</p>
      </section>
      <section style="background:#ffffff;border:1px solid #d9dee5;border-radius:8px;padding:16px;margin-bottom:14px;">
        <p><strong>Revisor:</strong> ${escapeHtml(submission.reviewer.name || 'Nao informado')}</p>
        <p><strong>Email:</strong> ${escapeHtml(submission.reviewer.email || 'Nao informado')}</p>
        <p><strong>Enviado em:</strong> ${escapeHtml(emailContext.createdAt)}</p>
        <p><strong>Viewport:</strong> ${submission.viewport.width}x${submission.viewport.height}</p>
      </section>
      <section style="background:#ffffff;border:1px solid #d9dee5;border-radius:8px;padding:18px;margin-bottom:14px;">
        <h2 style="font-size:18px;margin:0 0 10px;">${submission.items.length} ponto(s) de melhoria</h2>
        <p style="margin:0 0 12px;color:#68717d;line-height:1.45;">
          O detalhe visual esta salvo no painel privado. Abra o link abaixo para ver o site com os marcadores exatamente onde o cliente pediu alteracoes.
        </p>
        <p style="margin:0;color:#3a4048;line-height:1.55;">${escapeHtml(summary)}</p>
        <p style="margin:18px 0 0;">
          <a href="${escapeAttr(emailContext.adminUrl)}" style="display:inline-block;background:#235ed8;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 16px;font-weight:700;">
            Abrir feedback visual
          </a>
        </p>
        <p style="font-size:12px;color:#68717d;margin:14px 0 0;">ID: ${escapeHtml(emailContext.submissionId)}</p>
      </section>
    </main>
  </body>
</html>`;
}

function renderFeedbackText(submission, tokenPayload, emailContext) {
  const lines = [
    `Novo feedback de ${tokenPayload.client}`,
    `Projeto: ${tokenPayload.projectName}`,
    `Rota: ${tokenPayload.route}`,
    `Revisor: ${submission.reviewer.name || 'Nao informado'}`,
    `Email: ${submission.reviewer.email || 'Nao informado'}`,
    `Pontos: ${submission.items.length}`,
    `Resumo: ${summarizeItems(submission.items)}`,
    `Abrir feedback visual: ${emailContext.adminUrl}`,
    `ID: ${emailContext.submissionId}`,
    '',
  ];

  return lines.join('\n');
}

function summarizeItems(items) {
  const counts = items.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([type, count]) => `${count} ${labelType(type).toLowerCase()}`)
    .join(', ');
}

function labelType(type) {
  return {
    'text-suggestion': 'Sugestao de texto',
    'section-comment': 'Comentario de secao',
    'image-comment': 'Comentario de imagem',
    'image-removal': 'Remocao de imagem',
  }[type];
}

function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/\u0000/g, '')
    .trim()
    .slice(0, maxLength);
}

function cleanEmail(value) {
  const email = cleanText(value, 160);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
}

function clampRatio(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(1, Math.max(0, Number(number.toFixed(4))));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}
