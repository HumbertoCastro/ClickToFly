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

  const to = env.FEEDBACK_EMAIL_TO || 'dedebarbos@hotmail.com';
  const from = env.FEEDBACK_EMAIL_FROM || 'feedback@hcwebsolutions.com.br';
  const subject = `Feedback ${payload.projectName} - ${payload.client}`;
  const html = renderFeedbackHtml(validation.submission, payload);
  const text = renderFeedbackText(validation.submission, payload);

  if (env.FEEDBACK_MOCK_EMAIL === '1') {
    return json({ ok: true, messageId: 'mock-email', to, subject });
  }

  if (!env.RESEND_API_KEY) {
    return json({ error: 'RESEND_API_KEY nao configurado.' }, { status: 500 });
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
    return json(
      {
        error:
          resendPayload?.message ||
          resendPayload?.error ||
          'Resend recusou o envio do feedback.',
      },
      { status: 502 },
    );
  }

  return json({ ok: true, messageId: resendPayload.id || 'resend-email' });
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
    route: cleanText(item.route, 200),
    createdAt: cleanText(item.createdAt, 80),
    originalText: cleanText(item.originalText, 4000),
    suggestedText,
    imageSrc: cleanText(item.imageSrc, 1000),
    imageAlt: cleanText(item.imageAlt, 400),
  };
}

function renderFeedbackHtml(submission, tokenPayload) {
  const rows = submission.items
    .map((item, index) => {
      const details = [
        item.originalText
          ? `<p><strong>Texto atual:</strong><br>${escapeHtml(item.originalText)}</p>`
          : '',
        item.suggestedText
          ? `<p><strong>Texto sugerido:</strong><br>${escapeHtml(item.suggestedText)}</p>`
          : '',
        item.comment ? `<p><strong>Comentario:</strong><br>${escapeHtml(item.comment)}</p>` : '',
        item.imageSrc
          ? `<p><strong>Imagem:</strong><br><a href="${escapeAttr(item.imageSrc)}">${escapeHtml(
              item.imageSrc,
            )}</a></p>`
          : '',
      ].join('');

      return `
        <article style="border:1px solid #d9dee5;border-radius:8px;padding:16px;margin:0 0 14px;background:#ffffff;">
          <h2 style="font-size:16px;margin:0 0 8px;">${index + 1}. ${escapeHtml(labelType(item.type))}</h2>
          <p style="margin:0 0 10px;color:#68717d;">${escapeHtml(item.label)}</p>
          ${details}
          <p style="font-size:12px;color:#68717d;margin:12px 0 0;">Selector: ${escapeHtml(
            item.selector,
          )}<br>Bounds: ${item.bounds.x}, ${item.bounds.y}, ${item.bounds.width}x${
            item.bounds.height
          }</p>
        </article>`;
    })
    .join('');

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4f6f8;color:#121417;font-family:Arial,sans-serif;">
    <main style="max-width:760px;margin:0 auto;padding:24px;">
      <section style="background:#111316;color:#ffffff;border-radius:8px;padding:20px;margin-bottom:14px;">
        <p style="margin:0 0 8px;color:#cbd3df;">HC Web Solutions</p>
        <h1 style="font-size:24px;line-height:1.15;margin:0;">Feedback de ${escapeHtml(
          tokenPayload.client,
        )}</h1>
        <p style="margin:12px 0 0;color:#d9dee5;">Projeto: ${escapeHtml(
          tokenPayload.projectName,
        )} | Rota: ${escapeHtml(tokenPayload.route)}</p>
      </section>
      <section style="background:#ffffff;border:1px solid #d9dee5;border-radius:8px;padding:16px;margin-bottom:14px;">
        <p><strong>Revisor:</strong> ${escapeHtml(submission.reviewer.name || 'Nao informado')}</p>
        <p><strong>Email:</strong> ${escapeHtml(submission.reviewer.email || 'Nao informado')}</p>
        <p><strong>Enviado em:</strong> ${escapeHtml(submission.createdAt)}</p>
        <p><strong>Viewport:</strong> ${submission.viewport.width}x${submission.viewport.height}</p>
      </section>
      ${rows}
    </main>
  </body>
</html>`;
}

function renderFeedbackText(submission, tokenPayload) {
  const lines = [
    `Feedback de ${tokenPayload.client}`,
    `Projeto: ${tokenPayload.projectName}`,
    `Rota: ${tokenPayload.route}`,
    `Revisor: ${submission.reviewer.name || 'Nao informado'}`,
    `Email: ${submission.reviewer.email || 'Nao informado'}`,
    '',
  ];

  submission.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${labelType(item.type)} - ${item.label}`);
    if (item.originalText) lines.push(`Texto atual: ${item.originalText}`);
    if (item.suggestedText) lines.push(`Texto sugerido: ${item.suggestedText}`);
    if (item.comment) lines.push(`Comentario: ${item.comment}`);
    if (item.imageSrc) lines.push(`Imagem: ${item.imageSrc}`);
    lines.push(`Selector: ${item.selector}`);
    lines.push('');
  });

  return lines.join('\n');
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
