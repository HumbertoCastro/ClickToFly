import { requireClientProjectAccess } from '../../../../_shared/client-auth.js';
import {
  createContentVersion,
  getContentVersionById,
  getEditableFields,
  getLatestDraftContent,
  getLatestPublicContent,
  insertAuditLog,
  insertPublishEvent,
} from '../../../../_shared/client-content-db.js';
import {
  summarizeDiff,
  validateContent,
} from '../../../../_shared/client-content-validate.js';
import { json, methodNotAllowed } from '../../../../_shared/responses.js';

const MAX_BODY_BYTES = 160_000;

export async function onRequestPost({ request, env, params }) {
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
    return json({ error: 'Publicacao muito grande.' }, { status: 413 });
  }

  const body = bodyText ? parseJson(bodyText) : {};

  if (!body) {
    return json({ error: 'JSON invalido.' }, { status: 400 });
  }

  const fields = await getEditableFields(env, projectSlug);

  if (!fields.ok) {
    return json({ error: fields.error }, { status: 500 });
  }

  const contentResult = await resolveContentToPublish(env, projectSlug, access.user.id, body);

  if (!contentResult.ok) {
    return json({ error: contentResult.error }, { status: contentResult.status || 400 });
  }

  const validation = await validateContent(env, projectSlug, fields.fields, contentResult.content);

  if (!validation.ok) {
    return json({ error: validation.error }, { status: 400 });
  }

  const previous = await getLatestPublicContent(env, projectSlug);
  const previousContent = previous.ok && previous.version ? previous.version.content : {};
  const diffSummary = summarizeDiff(previousContent, validation.content);
  const version = await createContentVersion(env, {
    projectSlug,
    status: 'published',
    content: validation.content,
    userId: access.user.id,
    email: access.user.email,
  });

  if (!version.ok) {
    return json({ error: version.error }, { status: 500 });
  }

  await insertPublishEvent(env, {
    projectSlug,
    versionId: version.version.id,
    eventType: 'publish',
    userId: access.user.id,
    email: access.user.email,
    diffSummary,
  });
  await insertAuditLog(env, {
    projectSlug,
    userId: access.user.id,
    email: access.user.email,
    action: 'content.publish',
    metadata: {
      versionId: version.version.id,
      versionNumber: version.version.versionNumber,
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

async function resolveContentToPublish(env, projectSlug, userId, body) {
  if (body?.content) {
    return { ok: true, content: body.content };
  }

  if (body?.draftVersionId) {
    const version = await getContentVersionById(env, projectSlug, String(body.draftVersionId));

    if (!version.ok) {
      return version;
    }

    if (!version.version || version.version.status !== 'draft' || version.version.createdByUserId !== userId) {
      return { ok: false, error: 'Rascunho nao encontrado.', status: 404 };
    }

    return { ok: true, content: version.version.content };
  }

  const draft = await getLatestDraftContent(env, projectSlug, userId);

  if (!draft.ok) {
    return draft;
  }

  if (!draft.version) {
    return { ok: false, error: 'Nenhum rascunho para publicar.', status: 400 };
  }

  return { ok: true, content: draft.version.content };
}

function normalizeProject(value) {
  const slug = String(value || '').trim();
  return /^[a-z0-9-]+$/.test(slug) ? slug : '';
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
