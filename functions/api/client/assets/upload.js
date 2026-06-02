import { verifySupabaseRequest } from '../../../_shared/client-auth.js';
import {
  getAssetUploadForUser,
  insertAuditLog,
  markAssetUploaded,
} from '../../../_shared/client-content-db.js';
import { json, methodNotAllowed } from '../../../_shared/responses.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function onRequestPost({ request, env }) {
  const auth = await verifySupabaseRequest(request, env);

  if (!auth.ok) {
    return json({ error: auth.error }, { status: auth.status || 401 });
  }

  if (!env?.CLIENT_ASSETS_BUCKET?.put) {
    return json({ error: 'CLIENT_ASSETS_BUCKET nao configurado.' }, { status: 500 });
  }

  const url = new URL(request.url);
  const assetId = String(url.searchParams.get('assetId') || '').trim();

  if (!assetId) {
    return json({ error: 'Asset ausente.' }, { status: 400 });
  }

  const asset = await getAssetUploadForUser(env, assetId, auth.user.id);

  if (!asset.ok) {
    return json({ error: asset.error }, { status: 500 });
  }

  if (!asset.asset) {
    return json({ error: 'Upload nao encontrado.' }, { status: 404 });
  }

  if (asset.asset.status !== 'pending') {
    return json({ error: 'Upload ja processado.' }, { status: 409 });
  }

  const contentType = String(request.headers.get('Content-Type') || '').toLowerCase();

  if (contentType !== asset.asset.contentType) {
    return json({ error: 'Tipo de arquivo diferente do declarado.' }, { status: 400 });
  }

  const declaredLength = Number(request.headers.get('Content-Length') || 0);

  if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) {
    return json({ error: 'Imagem acima do limite de 5MB.' }, { status: 413 });
  }

  const buffer = await request.arrayBuffer();

  if (buffer.byteLength <= 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
    return json({ error: 'Imagem acima do limite de 5MB.' }, { status: 413 });
  }

  const sha256 = await sha256Hex(buffer);

  await env.CLIENT_ASSETS_BUCKET.put(asset.asset.storageKey, buffer, {
    httpMetadata: {
      contentType: asset.asset.contentType,
    },
    customMetadata: {
      assetId: asset.asset.id,
      projectSlug: asset.asset.projectSlug,
      uploadedBy: auth.user.email,
      sha256,
    },
  });

  await markAssetUploaded(env, asset.asset.id, sha256, buffer.byteLength);
  await insertAuditLog(env, {
    projectSlug: asset.asset.projectSlug,
    userId: auth.user.id,
    email: auth.user.email,
    action: 'asset.upload',
    metadata: {
      assetId: asset.asset.id,
      byteSize: buffer.byteLength,
      sha256,
    },
    ip: request.headers.get('CF-Connecting-IP') || '',
    userAgent: request.headers.get('User-Agent') || '',
  });

  return json({
    asset: {
      ...asset.asset,
      byteSize: buffer.byteLength,
      sha256,
      status: 'uploaded',
      publicUrl: `/api/public/assets/${asset.asset.id}`,
    },
  });
}

export function onRequestGet() {
  return methodNotAllowed();
}

async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
