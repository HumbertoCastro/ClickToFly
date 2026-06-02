import { listClientProjectAccess } from '../../_shared/client-auth.js';
import { getEditableFields, getLatestPublicContent } from '../../_shared/client-content-db.js';
import { json, methodNotAllowed } from '../../_shared/responses.js';

export async function onRequestGet({ request, env }) {
  const access = await listClientProjectAccess(request, env);

  if (!access.ok) {
    return json({ error: access.error }, { status: access.status || 401 });
  }

  const projects = [];

  for (const project of access.projects) {
    const fields = await getEditableFields(env, project.projectSlug);
    const published = await getLatestPublicContent(env, project.projectSlug);

    projects.push({
      ...project,
      editableCount: fields.ok ? fields.fields.length : 0,
      publishedVersion: published.ok && published.version ? published.version.versionNumber : null,
      publishedAt: published.ok && published.version ? published.version.publishedAt : '',
    });
  }

  return json({ user: access.user, projects });
}

export function onRequestPost() {
  return methodNotAllowed();
}
