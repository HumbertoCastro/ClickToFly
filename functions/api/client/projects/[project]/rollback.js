import { requireClientProjectAccess } from '../../../../_shared/client-auth.js';
import {
  createContentVersion,
  getContentVersionById,
  getLatestPublicContent,
  getPublicVersionByNumber,
  insertAuditLog,
  insertPublishEvent,
} from '../../../../_shared/client-content-db.js';
import { summarizeDiff } from '../../../../_shared/client-content-validate.js';
import { json, methodNotAllowed } from '../../../../_shared/responses.js';

export async function onRequestPost({ request, env, params }) {
  const projectSlug = normalizeProject(params.project);

  if (!projectSlug) {
    return json({ error: 'Projeto invalido.' }, { status: 400 });
  }

  const access = await requireClientProjectAccess(request, env, projectSlug);

  if (!access.ok) {
    return json({ error: access.error }, { status: access.status || 401 });
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON invalido.' }, { status: 400 });
  }

  const target = await resolveRollbackTarget(env, projectSlug, body);

  if (!target.ok) {
    return json({ error: target.error }, { status: target.status || 400 });
  }

  const previous = await getLatestPublicContent(env, projectSlug);
  const previousContent = previous.ok && previous.version ? previous.version.content : {};
  const diffSummary = summarizeDiff(previousContent, target.version.content);
  const version = await createContentVersion(env, {
    projectSlug,
    status: 'rollback',
    content: target.version.content,
    userId: access.user.id,
    email: access.user.email,
    rollbackFromVersionId: target.version.id,
  });

  if (!version.ok) {
    return json({ error: version.error }, { status: 500 });
  }

  await insertPublishEvent(env, {
    projectSlug,
    versionId: version.version.id,
    eventType: 'rollback',
    userId: access.user.id,
    email: access.user.email,
    diffSummary,
  });
  await insertAuditLog(env, {
    projectSlug,
    userId: access.user.id,
    email: access.user.email,
    action: 'content.rollback',
    metadata: {
      versionId: version.version.id,
      versionNumber: version.version.versionNumber,
      rollbackFromVersionId: target.version.id,
      diffSummary,
    },
    ip: request.headers.get('CF-Connecting-IP') || '',
    userAgent: request.headers.get('User-Agent') || '',
  });

  return json({ published: version.version, diffSummary });
}

export function onRequestGet() {
  return methodNotAllowed();
}

async function resolveRollbackTarget(env, projectSlug, body) {
  if (body?.versionId) {
    const result = await getContentVersionById(env, projectSlug, String(body.versionId));

    if (!result.ok) {
      return result;
    }

    if (!result.version || !['published', 'rollback'].includes(result.version.status)) {
      return { ok: false, error: 'Versao publicada nao encontrada.', status: 404 };
    }

    return { ok: true, version: result.version };
  }

  const versionNumber = Number(body?.versionNumber);

  if (!Number.isFinite(versionNumber) || versionNumber <= 0) {
    return { ok: false, error: 'Informe a versao para rollback.' };
  }

  const result = await getPublicVersionByNumber(env, projectSlug, Math.round(versionNumber));

  if (!result.ok) {
    return result;
  }

  if (!result.version) {
    return { ok: false, error: 'Versao publicada nao encontrada.', status: 404 };
  }

  return { ok: true, version: result.version };
}

function normalizeProject(value) {
  const slug = String(value || '').trim();
  return /^[a-z0-9-]+$/.test(slug) ? slug : '';
}
