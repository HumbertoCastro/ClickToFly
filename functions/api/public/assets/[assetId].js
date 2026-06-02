import { getUploadedAsset } from '../../../_shared/client-content-db.js';
import { json, methodNotAllowed } from '../../../_shared/responses.js';

export async function onRequestGet({ env, params }) {
  const assetId = String(params.assetId || '').trim();

  if (!assetId) {
    return json({ error: 'Asset invalido.' }, { status: 400 });
  }

  if (!env?.CLIENT_ASSETS_BUCKET?.get) {
    return json({ error: 'CLIENT_ASSETS_BUCKET nao configurado.' }, { status: 500 });
  }

  const asset = await getUploadedAsset(env, assetId);

  if (!asset.ok) {
    return json({ error: asset.error }, { status: 500 });
  }

  if (!asset.asset) {
    return json({ error: 'Imagem nao encontrada.' }, { status: 404 });
  }

  const object = await env.CLIENT_ASSETS_BUCKET.get(asset.asset.storageKey);

  if (!object) {
    return json({ error: 'Imagem nao encontrada.' }, { status: 404 });
  }

  const headers = {
      'Content-Type': asset.asset.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
  };

  if (asset.asset.sha256 || object.httpEtag) {
    headers.ETag = asset.asset.sha256 || object.httpEtag;
  }

  return new Response(object.body, { headers });
}

export function onRequestPost() {
  return methodNotAllowed();
}
