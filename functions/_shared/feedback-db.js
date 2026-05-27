import { buildPreviewUrl } from './token.js';

const STATUS_VALUES = new Set(['new', 'viewed', 'in_progress', 'resolved']);

export function hasFeedbackDb(env) {
  return Boolean(env?.FEEDBACK_DB?.prepare);
}

export function requireFeedbackDb(env) {
  if (!hasFeedbackDb(env)) {
    return { ok: false, error: 'FEEDBACK_DB nao configurado.' };
  }

  return { ok: true, db: env.FEEDBACK_DB };
}

export function isFeedbackStatus(value) {
  return STATUS_VALUES.has(value);
}

export async function createFeedbackSubmission(env, submission, tokenPayload) {
  const database = requireFeedbackDb(env);

  if (!database.ok) {
    return database;
  }

  const id = crypto.randomUUID();
  const createdAt = submission.createdAt || new Date().toISOString();

  await database.db
    .prepare(
      `INSERT INTO feedback_submissions (
        id,
        project_slug,
        project_name,
        client,
        route,
        reviewer_name,
        reviewer_email,
        viewport_json,
        items_json,
        item_count,
        status,
        created_at,
        email_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, 'pending')`,
    )
    .bind(
      id,
      submission.projectSlug,
      tokenPayload.projectName,
      tokenPayload.client,
      submission.route,
      submission.reviewer.name,
      submission.reviewer.email,
      JSON.stringify(submission.viewport),
      JSON.stringify(submission.items),
      submission.items.length,
      createdAt,
    )
    .run();

  return { ok: true, id, createdAt };
}

export async function listFeedbackSubmissions(env, filters = {}) {
  const database = requireFeedbackDb(env);

  if (!database.ok) {
    return database;
  }

  const where = [];
  const binds = [];

  if (filters.status && isFeedbackStatus(filters.status)) {
    where.push('status = ?');
    binds.push(filters.status);
  }

  if (filters.project) {
    where.push('project_slug = ?');
    binds.push(filters.project);
  }

  const limit = clampLimit(filters.limit);
  const query = `
    SELECT
      id,
      project_slug,
      project_name,
      client,
      route,
      reviewer_name,
      reviewer_email,
      item_count,
      status,
      created_at,
      viewed_at,
      resolved_at,
      email_status,
      email_message_id
    FROM feedback_submissions
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY created_at DESC
    LIMIT ?
  `;
  const result = await database.db
    .prepare(query)
    .bind(...binds, limit)
    .all();

  return {
    ok: true,
    submissions: (result.results || []).map(mapSummaryRow),
  };
}

export async function getFeedbackSubmission(env, id) {
  const database = requireFeedbackDb(env);

  if (!database.ok) {
    return database;
  }

  const row = await database.db
    .prepare(
      `SELECT
        id,
        project_slug,
        project_name,
        client,
        route,
        reviewer_name,
        reviewer_email,
        viewport_json,
        items_json,
        item_count,
        status,
        created_at,
        viewed_at,
        resolved_at,
        email_status,
        email_message_id
      FROM feedback_submissions
      WHERE id = ?`,
    )
    .bind(id)
    .first();

  if (!row) {
    return { ok: false, error: 'Feedback nao encontrado.', status: 404 };
  }

  return { ok: true, submission: mapDetailRow(row) };
}

export async function updateFeedbackSubmissionStatus(env, id, status) {
  const database = requireFeedbackDb(env);

  if (!database.ok) {
    return database;
  }

  if (!isFeedbackStatus(status)) {
    return { ok: false, error: 'Status invalido.', status: 400 };
  }

  const now = new Date().toISOString();
  const viewedAt = status === 'viewed' || status === 'in_progress' || status === 'resolved' ? now : null;
  const resolvedAt = status === 'resolved' ? now : null;

  const result = await database.db
    .prepare(
      `UPDATE feedback_submissions
      SET
        status = ?,
        viewed_at = CASE
          WHEN ? IS NOT NULL AND viewed_at IS NULL THEN ?
          ELSE viewed_at
        END,
        resolved_at = CASE
          WHEN ? IS NOT NULL THEN ?
          WHEN status = 'resolved' AND ? != 'resolved' THEN NULL
          ELSE resolved_at
        END
      WHERE id = ?`,
    )
    .bind(status, viewedAt, viewedAt, resolvedAt, resolvedAt, status, id)
    .run();

  if (!result.meta?.changes) {
    return { ok: false, error: 'Feedback nao encontrado.', status: 404 };
  }

  return getFeedbackSubmission(env, id);
}

export async function updateFeedbackEmailStatus(env, id, emailStatus, messageId = '') {
  const database = requireFeedbackDb(env);

  if (!database.ok) {
    return database;
  }

  await database.db
    .prepare(
      `UPDATE feedback_submissions
      SET email_status = ?, email_message_id = ?
      WHERE id = ?`,
    )
    .bind(emailStatus, messageId, id)
    .run();

  return { ok: true };
}

function mapSummaryRow(row) {
  return {
    id: row.id,
    projectSlug: row.project_slug,
    projectName: row.project_name,
    client: row.client,
    route: row.route,
    reviewer: {
      name: row.reviewer_name || '',
      email: row.reviewer_email || '',
    },
    itemCount: Number(row.item_count || 0),
    status: row.status,
    createdAt: row.created_at,
    viewedAt: row.viewed_at || '',
    resolvedAt: row.resolved_at || '',
    emailStatus: row.email_status || '',
    emailMessageId: row.email_message_id || '',
  };
}

function mapDetailRow(row) {
  const summary = mapSummaryRow(row);

  return {
    ...summary,
    viewport: parseJson(row.viewport_json, { width: 0, height: 0 }),
    items: parseJson(row.items_json, []),
    previewUrl: buildPreviewUrl(summary.projectSlug, summary.route),
  };
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function clampLimit(value) {
  const limit = Number(value || 60);

  if (!Number.isFinite(limit)) {
    return 60;
  }

  return Math.min(100, Math.max(1, Math.round(limit)));
}
