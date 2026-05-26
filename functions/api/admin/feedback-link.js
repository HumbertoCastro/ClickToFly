import { verifyAdminRequest } from '../../_shared/admin-auth.js';
import { json, methodNotAllowed } from '../../_shared/responses.js';
import { createReviewToken, normalizeRoute } from '../../_shared/token.js';

const MAX_DAYS = 60;

export async function onRequestPost({ request, env }) {
  const session = await verifyAdminRequest(request, env);

  if (!session.ok) {
    return json({ error: session.error }, { status: 401 });
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON invalido.' }, { status: 400 });
  }

  const projectSlug = cleanText(body?.projectSlug, 80);
  const projectName = cleanText(body?.projectName, 120) || projectSlug;
  const client = cleanText(body?.client, 120);
  const rawRoute = cleanText(body?.route || '/', 200);
  const route = normalizeRoute(rawRoute);
  const days = clampDays(body?.days);

  if (!/^[a-z0-9-]+$/.test(projectSlug)) {
    return json({ error: 'Projeto invalido.' }, { status: 400 });
  }

  if (!client) {
    return json({ error: 'Informe o nome do cliente.' }, { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);
  const tokenResult = await createReviewToken(
    {
      v: 1,
      projectSlug,
      projectName,
      client,
      route,
      issuedAt: now,
      expiresAt: now + days * 24 * 60 * 60,
    },
    env.FEEDBACK_TOKEN_SECRET,
  );

  if (!tokenResult.ok) {
    return json({ error: tokenResult.error }, { status: 500 });
  }

  const feedbackUrl = new URL(`/feedback/?token=${tokenResult.token}`, request.url).toString();

  return json({
    ok: true,
    url: feedbackUrl,
    token: tokenResult.token,
    payload: tokenResult.payload,
  });
}

export function onRequestGet() {
  return methodNotAllowed();
}

function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/\u0000/g, '')
    .trim()
    .slice(0, maxLength);
}

function clampDays(value) {
  const days = Number(value || 14);

  if (!Number.isFinite(days)) {
    return 14;
  }

  return Math.min(MAX_DAYS, Math.max(1, Math.round(days)));
}
