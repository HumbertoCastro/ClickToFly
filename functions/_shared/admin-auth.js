const ADMIN_COOKIE = 'hc_preview_admin';
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function createAdminSessionCookie(request, env) {
  const secret = getAdminSecret(env);

  if (!secret) {
    return { ok: false, error: 'PREVIEW_ADMIN_SECRET ou FEEDBACK_TOKEN_SECRET nao configurado.' };
  }

  const now = Math.floor(Date.now() / 1000);
  const payloadPart = bytesToBase64Url(
    encoder.encode(
      JSON.stringify({
        v: 1,
        iat: now,
        exp: now + SESSION_TTL_SECONDS,
      }),
    ),
  );
  const signaturePart = bytesToBase64Url(await sign(payloadPart, secret));
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';

  return {
    ok: true,
    cookie: `${ADMIN_COOKIE}=${payloadPart}.${signaturePart}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`,
  };
}

export async function verifyAdminRequest(request, env) {
  const secret = getAdminSecret(env);

  if (!secret) {
    return { ok: false, error: 'PREVIEW_ADMIN_SECRET ou FEEDBACK_TOKEN_SECRET nao configurado.' };
  }

  const cookie = getCookie(request.headers.get('Cookie') || '', ADMIN_COOKIE);

  if (!cookie) {
    return { ok: false, error: 'Sessao admin ausente.' };
  }

  const parts = cookie.split('.');

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { ok: false, error: 'Sessao admin invalida.' };
  }

  const [payloadPart, signaturePart] = parts;
  const expected = await sign(payloadPart, secret);
  const actual = base64UrlToBytes(signaturePart);

  if (!timingSafeEqual(expected, actual)) {
    return { ok: false, error: 'Sessao admin invalida.' };
  }

  let payload;

  try {
    payload = JSON.parse(decoder.decode(base64UrlToBytes(payloadPart)));
  } catch {
    return { ok: false, error: 'Sessao admin invalida.' };
  }

  const now = Math.floor(Date.now() / 1000);

  if (payload?.v !== 1 || Number(payload.exp || 0) < now) {
    return { ok: false, error: 'Sessao admin expirada.' };
  }

  return { ok: true, payload };
}

export function clearAdminSessionCookie(request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function isValidAdminPassword(password, env) {
  const expected = env.PREVIEW_ADMIN_PASSWORD;

  if (!expected || typeof expected !== 'string' || expected.length < 6) {
    return { ok: false, error: 'PREVIEW_ADMIN_PASSWORD nao configurado.' };
  }

  return {
    ok: timingSafeStringEqual(String(password || ''), expected),
    error: 'Senha invalida.',
  };
}

function getAdminSecret(env) {
  return env.PREVIEW_ADMIN_SECRET || env.FEEDBACK_TOKEN_SECRET || '';
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

function getCookie(header, name) {
  const prefix = `${name}=`;
  return header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
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

function timingSafeStringEqual(left, right) {
  return timingSafeEqual(encoder.encode(left), encoder.encode(right));
}

function timingSafeEqual(left, right) {
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;

  for (let index = 0; index < length; index += 1) {
    diff |= (left[index] || 0) ^ (right[index] || 0);
  }

  return diff === 0;
}
