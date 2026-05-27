import { updateFeedbackSubmissionStatus } from '../../../_shared/feedback-db.js';
import { verifyAdminRequest } from '../../../_shared/admin-auth.js';
import { json, methodNotAllowed } from '../../../_shared/responses.js';

export async function onRequestPost({ request, env }) {
  const session = await verifyAdminRequest(request, env);

  if (!session.ok) {
    return json({ error: session.error }, { status: 401 });
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON invalido.' }, { status: 400 });
  }

  const id = cleanText(body?.id, 120);
  const status = cleanText(body?.status, 32);

  if (!id) {
    return json({ error: 'ID ausente.' }, { status: 400 });
  }

  const result = await updateFeedbackSubmissionStatus(env, id, status);

  if (!result.ok) {
    return json({ error: result.error }, { status: result.status || 500 });
  }

  return json({ submission: result.submission });
}

export function onRequestGet() {
  return methodNotAllowed();
}

function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/\u0000/g, '')
    .trim()
    .slice(0, maxLength);
}
