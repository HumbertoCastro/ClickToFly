const encoder = new TextEncoder();
const decoder = new TextDecoder();
const jwksCache = new Map();

export async function verifySupabaseRequest(request, env) {
  const token = getBearerToken(request);

  if (!token) {
    return { ok: false, error: 'Sessao ausente.' };
  }

  return verifySupabaseJwt(token, env);
}

export async function requireClientProjectAccess(request, env, projectSlug) {
  const auth = await verifySupabaseRequest(request, env);

  if (!auth.ok) {
    return auth;
  }

  const db = requireClientDb(env);

  if (!db.ok) {
    return db;
  }

  const row = await db.db
    .prepare(
      `SELECT
        access.id,
        access.client_id,
        access.project_slug,
        access.role,
        access.email,
        clients.name AS client_name
      FROM client_project_access access
      LEFT JOIN clients ON clients.id = access.client_id
      WHERE access.project_slug = ?
        AND access.status = 'active'
        AND (
          access.supabase_user_id = ?
          OR lower(access.email) = lower(?)
        )
      LIMIT 1`,
    )
    .bind(projectSlug, auth.user.id, auth.user.email)
    .first();

  if (!row) {
    return { ok: false, error: 'Usuario sem permissao para este projeto.', status: 403 };
  }

  return {
    ok: true,
    user: auth.user,
    access: {
      id: row.id,
      clientId: row.client_id,
      clientName: row.client_name || '',
      projectSlug: row.project_slug,
      role: row.role || 'client',
      email: row.email || auth.user.email,
    },
  };
}

export async function listClientProjectAccess(request, env) {
  const auth = await verifySupabaseRequest(request, env);

  if (!auth.ok) {
    return auth;
  }

  const db = requireClientDb(env);

  if (!db.ok) {
    return db;
  }

  const result = await db.db
    .prepare(
      `SELECT
        access.id,
        access.client_id,
        access.project_slug,
        access.role,
        access.email,
        clients.name AS client_name
      FROM client_project_access access
      LEFT JOIN clients ON clients.id = access.client_id
      WHERE access.status = 'active'
        AND (
          access.supabase_user_id = ?
          OR lower(access.email) = lower(?)
        )
      ORDER BY access.project_slug ASC`,
    )
    .bind(auth.user.id, auth.user.email)
    .all();

  return {
    ok: true,
    user: auth.user,
    projects: (result.results || []).map((row) => ({
      accessId: row.id,
      clientId: row.client_id,
      clientName: row.client_name || '',
      projectSlug: row.project_slug,
      role: row.role || 'client',
      email: row.email || auth.user.email,
    })),
  };
}

export function requireClientDb(env) {
  if (!env?.FEEDBACK_DB?.prepare) {
    return { ok: false, error: 'FEEDBACK_DB nao configurado.' };
  }

  return { ok: true, db: env.FEEDBACK_DB };
}

async function verifySupabaseJwt(token, env) {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return { ok: false, error: 'Sessao invalida.' };
  }

  const [headerPart, payloadPart, signaturePart] = parts;
  const header = parseJsonPart(headerPart);
  const payload = parseJsonPart(payloadPart);

  if (!header || !payload) {
    return { ok: false, error: 'Sessao invalida.' };
  }

  const signature = base64UrlToBytes(signaturePart);
  const signedData = encoder.encode(`${headerPart}.${payloadPart}`);
  const verified = await verifySignature(header, signedData, signature, env);

  if (!verified.ok) {
    return verified;
  }

  const validation = validatePayload(payload, env);

  if (!validation.ok) {
    return validation;
  }

  return {
    ok: true,
    user: {
      id: String(payload.sub || ''),
      email: String(payload.email || ''),
      role: String(payload.role || ''),
      aal: String(payload.aal || ''),
      token,
    },
    payload,
  };
}

async function verifySignature(header, signedData, signature, env) {
  if (header.alg === 'HS256' && env.SUPABASE_JWT_SECRET) {
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(env.SUPABASE_JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const ok = await crypto.subtle.verify('HMAC', key, signature, signedData);
    return ok ? { ok: true } : { ok: false, error: 'Assinatura invalida.' };
  }

  if (header.alg !== 'RS256') {
    return { ok: false, error: 'Algoritmo de sessao nao suportado.' };
  }

  const supabaseUrl = normalizeSupabaseUrl(env.SUPABASE_URL);

  if (!supabaseUrl) {
    return { ok: false, error: 'SUPABASE_URL nao configurado.' };
  }

  const jwks = await getJwks(`${supabaseUrl}/auth/v1/.well-known/jwks.json`);
  const jwk = jwks.keys?.find((key) => key.kid === header.kid);

  if (!jwk) {
    return { ok: false, error: 'Chave de sessao nao encontrada.' };
  }

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signedData);

  return ok ? { ok: true } : { ok: false, error: 'Assinatura invalida.' };
}

function validatePayload(payload, env) {
  const now = Math.floor(Date.now() / 1000);
  const expectedIssuer =
    env.SUPABASE_JWT_ISSUER || `${normalizeSupabaseUrl(env.SUPABASE_URL)}/auth/v1`;
  const expectedAudience = env.SUPABASE_JWT_AUDIENCE || 'authenticated';

  if (!payload.sub || !payload.email) {
    return { ok: false, error: 'Sessao sem usuario.' };
  }

  if (Number(payload.exp || 0) <= now) {
    return { ok: false, error: 'Sessao expirada.' };
  }

  if (payload.nbf && Number(payload.nbf) > now) {
    return { ok: false, error: 'Sessao ainda nao e valida.' };
  }

  if (expectedIssuer && payload.iss !== expectedIssuer) {
    return { ok: false, error: 'Emissor de sessao invalido.' };
  }

  if (!audienceMatches(payload.aud, expectedAudience)) {
    return { ok: false, error: 'Audiencia de sessao invalida.' };
  }

  if (env.SUPABASE_REQUIRE_AAL2 === '1' && payload.aal !== 'aal2') {
    return { ok: false, error: 'MFA obrigatorio para publicar.' };
  }

  return { ok: true };
}

async function getJwks(url) {
  const cached = jwksCache.get(url);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Nao foi possivel buscar as chaves do Supabase.');
  }

  const value = await response.json();
  jwksCache.set(url, { value, expiresAt: now + 10 * 60 * 1000 });
  return value;
}

function getBearerToken(request) {
  const header = request.headers.get('Authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1] || '';
}

function parseJsonPart(value) {
  try {
    return JSON.parse(decoder.decode(base64UrlToBytes(value)));
  } catch {
    return null;
  }
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

function normalizeSupabaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

function audienceMatches(actual, expected) {
  if (!expected) {
    return true;
  }

  if (Array.isArray(actual)) {
    return actual.includes(expected);
  }

  return actual === expected;
}
