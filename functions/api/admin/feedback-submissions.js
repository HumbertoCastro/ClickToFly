import {
  getFeedbackSubmission,
  isFeedbackStatus,
  listFeedbackSubmissions,
} from '../../_shared/feedback-db.js';
import { verifyAdminRequest } from '../../_shared/admin-auth.js';
import { json, methodNotAllowed } from '../../_shared/responses.js';

export async function onRequestGet({ request, env }) {
  const session = await verifyAdminRequest(request, env);

  if (!session.ok) {
    return json({ error: session.error }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = cleanText(url.searchParams.get('id'), 120);

  if (id) {
    const result = await getFeedbackSubmission(env, id);

    if (!result.ok) {
      return json({ error: result.error }, { status: result.status || 500 });
    }

    return json({ submission: result.submission });
  }

  const status = cleanText(url.searchParams.get('status'), 32);
  const project = cleanText(url.searchParams.get('project'), 80);
  const limit = cleanText(url.searchParams.get('limit'), 12);

  if (status && !isFeedbackStatus(status)) {
    return json({ error: 'Status invalido.' }, { status: 400 });
  }

  const result = await listFeedbackSubmissions(env, {
    status,
    project,
    limit,
  });

  if (!result.ok) {
    return json({ error: result.error }, { status: 500 });
  }

  return json({ submissions: result.submissions });
}

export function onRequestPost() {
  return methodNotAllowed();
}

function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/\u0000/g, '')
    .trim()
    .slice(0, maxLength);
}
