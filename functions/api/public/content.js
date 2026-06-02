import {
  getEditableFields,
  getLatestPublicContent,
} from '../../_shared/client-content-db.js';
import { json, methodNotAllowed } from '../../_shared/responses.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const projectSlug = normalizeProject(url.searchParams.get('project'));

  if (!projectSlug) {
    return json({ error: 'Projeto invalido.' }, { status: 400 });
  }

  const [fields, published] = await Promise.all([
    getEditableFields(env, projectSlug),
    getLatestPublicContent(env, projectSlug),
  ]);

  if (!fields.ok || !published.ok) {
    return json({ error: 'Conteudo indisponivel.' }, { status: 500 });
  }

  return json(
    {
      projectSlug,
      version: published.version?.versionNumber || null,
      publishedAt: published.version?.publishedAt || '',
      content: published.version?.content || {},
      fields: fields.fields.map((field) => ({
        key: field.key,
        type: field.type,
        target: field.validation?.target || null,
      })),
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    },
  );
}

export function onRequestPost() {
  return methodNotAllowed();
}

function normalizeProject(value) {
  const slug = String(value || '').trim();
  return /^[a-z0-9-]+$/.test(slug) ? slug : '';
}
