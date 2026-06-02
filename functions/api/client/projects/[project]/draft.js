import { requireClientProjectAccess } from '../../../../_shared/client-auth.js';
import {
  createContentVersion,
  getEditableFields,
  getLatestDraftContent,
  getLatestPublicContent,
  insertAuditLog,
  listPublicVersions,
} from '../../../../_shared/client-content-db.js';
import { validateContent } from '../../../../_shared/client-content-validate.js';
import { json } from '../../../../_shared/responses.js';

const MAX_BODY_BYTES = 160_000;

export async function onRequestGet({ request, env, params }) {
  const projectSlug = normalizeProject(params.project);

  if (!projectSlug) {
    return json({ error: 'Projeto invalido.' }, { status: 400 });
  }

  const access = await requireClientProjectAccess(request, env, projectSlug);

  if (!access.ok) {
    return json({ error: access.error }, { status: access.status || 401 });
  }

  const fields = await getEditableFields(env, projectSlug);

  if (!fields.ok) {
    return json({ error: fields.error }, { status: 500 });
  }

  const [published, draft, versions] = await Promise.all([
    getLatestPublicContent(env, projectSlug),
    getLatestDraftContent(env, projectSlug, access.user.id),
    listPublicVersions(env, projectSlug),
  ]);

  if (!published.ok || !draft.ok || !versions.ok) {
    return json({ error: 'Nao foi possivel carregar o projeto.' }, { status: 500 });
  }

  return json({
    project: access.access,
    fields: fields.fields,
    published: published.version,
    draft: draft.version,
    versions: versions.versions,
  });
}

export async function onRequestPut({ request, env, params }) {
  const projectSlug = normalizeProject(params.project);

  if (!projectSlug) {
    return json({ error: 'Projeto invalido.' }, { status: 400 });
  }

  const access = await requireClientProjectAccess(request, env, projectSlug);

  if (!access.ok) {
    return json({ error: access.error }, { status: access.status || 401 });
  }

  const bodyText = await request.text();

  if (bodyText.length > MAX_BODY_BYTES) {
    return json({ error: 'Rascunho muito grande.' }, { status: 413 });
  }

  let body;

  try {
    body = JSON.parse(bodyText);
  } catch {
    return json({ error: 'JSON invalido.' }, { status: 400 });
  }

  const fields = await getEditableFields(env, projectSlug);

  if (!fields.ok) {
    return json({ error: fields.error }, { status: 500 });
  }

  const validation = await validateContent(env, projectSlug, fields.fields, body?.content);

  if (!validation.ok) {
    return json({ error: validation.error }, { status: 400 });
  }

  const version = await createContentVersion(env, {
    projectSlug,
    status: 'draft',
    content: validation.content,
    userId: access.user.id,
    email: access.user.email,
  });

  if (!version.ok) {
    return json({ error: version.error }, { status: 500 });
  }

  await insertAuditLog(env, {
    projectSlug,
    userId: access.user.id,
    email: access.user.email,
    action: 'draft.save',
    metadata: { versionId: version.version.id, versionNumber: version.version.versionNumber },
    ip: request.headers.get('CF-Connecting-IP') || '',
    userAgent: request.headers.get('User-Agent') || '',
  });

  return json({ draft: version.version });
}

export function onRequestPost() {
  return json({ error: 'Metodo nao permitido.' }, { status: 405 });
}

function normalizeProject(value) {
  const slug = String(value || '').trim();
  return /^[a-z0-9-]+$/.test(slug) ? slug : '';
}
