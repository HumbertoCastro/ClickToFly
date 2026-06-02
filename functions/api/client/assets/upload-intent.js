import { requireClientProjectAccess } from '../../../_shared/client-auth.js';
import { createAssetUpload, insertAuditLog } from '../../../_shared/client-content-db.js';
import { json, methodNotAllowed } from '../../../_shared/responses.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function onRequestPost({ request, env }) {
  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON invalido.' }, { status: 400 });
  }

  const projectSlug = normalizeProject(body?.projectSlug);

  if (!projectSlug) {
    return json({ error: 'Projeto invalido.' }, { status: 400 });
  }

  const access = await requireClientProjectAccess(request, env, projectSlug);

  if (!access.ok) {
    return json({ error: access.error }, { status: access.status || 401 });
  }

  const contentType = String(body?.contentType || '').toLowerCase();
  const byteSize = Number(body?.byteSize || 0);
  const fileName = sanitizeFileName(body?.fileName || 'imagem');

  if (!ALLOWED_TYPES.has(contentType)) {
    return json({ error: 'Use apenas JPG, PNG ou WebP.' }, { status: 400 });
  }

  if (!Number.isFinite(byteSize) || byteSize <= 0 || byteSize > MAX_IMAGE_BYTES) {
    return json({ error: 'Imagem acima do limite de 5MB.' }, { status: 400 });
  }

  const assetId = crypto.randomUUID();
  const extension = extensionFor(contentType);
  const storageKey = `client-assets/${projectSlug}/${assetId}-${fileName}.${extension}`;
  const asset = await createAssetUpload(env, {
    id: assetId,
    projectSlug,
    storageKey,
    fileName: `${fileName}.${extension}`,
    contentType,
    byteSize,
    userId: access.user.id,
    email: access.user.email,
  });

  if (!asset.ok) {
    return json({ error: asset.error }, { status: 500 });
  }

  await insertAuditLog(env, {
    projectSlug,
    userId: access.user.id,
    email: access.user.email,
    action: 'asset.intent',
    metadata: {
      assetId: asset.asset.id,
      fileName: asset.asset.fileName,
      contentType,
      byteSize,
    },
    ip: request.headers.get('CF-Connecting-IP') || '',
    userAgent: request.headers.get('User-Agent') || '',
  });

  return json({
    asset: asset.asset,
    uploadUrl: `/api/client/assets/upload?assetId=${encodeURIComponent(asset.asset.id)}`,
    maxBytes: MAX_IMAGE_BYTES,
    allowedTypes: [...ALLOWED_TYPES],
  });
}

export function onRequestGet() {
  return methodNotAllowed();
}

function normalizeProject(value) {
  const slug = String(value || '').trim();
  return /^[a-z0-9-]+$/.test(slug) ? slug : '';
}

function sanitizeFileName(value) {
  return String(value || 'imagem')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56) || 'imagem';
}

function extensionFor(contentType) {
  if (contentType === 'image/png') {
    return 'png';
  }

  if (contentType === 'image/webp') {
    return 'webp';
  }

  return 'jpg';
}
