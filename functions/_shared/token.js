const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function verifyReviewToken(token, secret) {
  if (!secret || typeof secret !== 'string' || secret.length < 16) {
    return { ok: false, error: 'FEEDBACK_TOKEN_SECRET nao configurado.' };
  }

  if (!token || typeof token !== 'string') {
    return { ok: false, error: 'Token ausente.' };
  }

  const parts = token.split('.');

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { ok: false, error: 'Token invalido.' };
  }

  const [payloadPart, signaturePart] = parts;
  const expected = await sign(payloadPart, secret);
  const actual = base64UrlToBytes(signaturePart);

  if (!timingSafeEqual(expected, actual)) {
    return { ok: false, error: 'Assinatura invalida.' };
  }

  let payload;

  try {
    payload = JSON.parse(decoder.decode(base64UrlToBytes(payloadPart)));
  } catch {
    return { ok: false, error: 'Payload invalido.' };
  }

  const normalized = normalizePayload(payload);

  if (!normalized.ok) {
    return normalized;
  }

  const now = Math.floor(Date.now() / 1000);

  if (normalized.payload.expiresAt < now) {
    return { ok: false, error: 'Link expirado.' };
  }

  return { ok: true, payload: normalized.payload };
}

export async function createReviewToken(payload, secret) {
  if (!secret || typeof secret !== 'string' || secret.length < 16) {
    return { ok: false, error: 'FEEDBACK_TOKEN_SECRET nao configurado.' };
  }

  const normalized = normalizePayload(payload);

  if (!normalized.ok) {
    return normalized;
  }

  const payloadPart = bytesToBase64Url(
    encoder.encode(JSON.stringify({ ...normalized.payload, v: 1 })),
  );
  const signaturePart = bytesToBase64Url(await sign(payloadPart, secret));

  return { ok: true, token: `${payloadPart}.${signaturePart}`, payload: normalized.payload };
}

export function buildPreviewUrl(projectSlug, route) {
  const normalizedRoute = normalizeRoute(route);
  const suffix = normalizedRoute === '/' ? '/' : `${trimTrailingSlash(normalizedRoute)}/`;
  return `/projetos/${projectSlug}${suffix}`;
}

export function normalizeRoute(value) {
  const route = typeof value === 'string' && value.trim() ? value.trim() : '/';
  const withLeadingSlash = route.startsWith('/') ? route : `/${route}`;
  const clean = withLeadingSlash.replace(/\/{2,}/g, '/');

  if (clean.includes('..') || clean.includes('*') || clean.includes(':')) {
    return '/';
  }

  return clean;
}

function normalizePayload(payload) {
  if (!payload || payload.v !== 1) {
    return { ok: false, error: 'Versao de token invalida.' };
  }

  const projectSlug = String(payload.projectSlug || payload.project || '').trim();

  if (!/^[a-z0-9-]+$/.test(projectSlug)) {
    return { ok: false, error: 'Projeto invalido.' };
  }

  const route = normalizeRoute(payload.route);
  const client = String(payload.client || 'Cliente').slice(0, 120);
  const projectName = String(payload.projectName || projectSlug).slice(0, 120);
  const issuedAt = Number(payload.issuedAt || 0);
  const expiresAt = Number(payload.expiresAt || 0);

  if (!Number.isFinite(expiresAt) || expiresAt <= 0) {
    return { ok: false, error: 'Expiracao invalida.' };
  }

  return {
    ok: true,
    payload: {
      v: 1,
      projectSlug,
      projectName,
      client,
      route,
      issuedAt: Number.isFinite(issuedAt) ? issuedAt : 0,
      expiresAt,
    },
  };
}

async function sign(payloadPart, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadPart));
  return new Uint8Array(signature);
}

function base64UrlToBytes(value) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function bytesToBase64Url(bytes) {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function timingSafeEqual(left, right) {
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;

  for (let index = 0; index < length; index += 1) {
    diff |= (left[index] || 0) ^ (right[index] || 0);
  }

  return diff === 0;
}

function trimTrailingSlash(value) {
  return value.length > 1 ? value.replace(/\/+$/, '') : value;
}
