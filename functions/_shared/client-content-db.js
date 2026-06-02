import { requireClientDb } from './client-auth.js';

const PUBLIC_STATUSES = new Set(['published', 'rollback']);

export async function getEditableFields(env, projectSlug) {
  const database = requireClientDb(env);

  if (!database.ok) {
    return database;
  }

  const result = await database.db
    .prepare(
      `SELECT
        project_slug,
        field_key,
        label,
        field_type,
        default_json,
        validation_json,
        sort_order,
        enabled
      FROM editable_fields
      WHERE project_slug = ? AND enabled = 1
      ORDER BY sort_order ASC, field_key ASC`,
    )
    .bind(projectSlug)
    .all();

  return {
    ok: true,
    fields: (result.results || []).map(mapFieldRow),
  };
}

export async function getLatestPublicContent(env, projectSlug) {
  return getLatestContentVersion(env, projectSlug, ['published', 'rollback']);
}

export async function getLatestDraftContent(env, projectSlug, userId) {
  const database = requireClientDb(env);

  if (!database.ok) {
    return database;
  }

  const row = await database.db
    .prepare(
      `SELECT *
      FROM content_versions
      WHERE project_slug = ?
        AND status = 'draft'
        AND created_by_user_id = ?
      ORDER BY created_at DESC
      LIMIT 1`,
    )
    .bind(projectSlug, userId)
    .first();

  return { ok: true, version: row ? mapVersionRow(row) : null };
}

export async function getContentVersionById(env, projectSlug, id) {
  const database = requireClientDb(env);

  if (!database.ok) {
    return database;
  }

  const row = await database.db
    .prepare(
      `SELECT *
      FROM content_versions
      WHERE project_slug = ? AND id = ?
      LIMIT 1`,
    )
    .bind(projectSlug, id)
    .first();

  return { ok: true, version: row ? mapVersionRow(row) : null };
}

export async function getPublicVersionByNumber(env, projectSlug, versionNumber) {
  const database = requireClientDb(env);

  if (!database.ok) {
    return database;
  }

  const row = await database.db
    .prepare(
      `SELECT *
      FROM content_versions
      WHERE project_slug = ?
        AND version_number = ?
        AND status IN ('published', 'rollback')
      LIMIT 1`,
    )
    .bind(projectSlug, versionNumber)
    .first();

  return { ok: true, version: row ? mapVersionRow(row) : null };
}

export async function listPublicVersions(env, projectSlug) {
  const database = requireClientDb(env);

  if (!database.ok) {
    return database;
  }

  const result = await database.db
    .prepare(
      `SELECT
        id,
        project_slug,
        version_number,
        status,
        content_json,
        created_by_user_id,
        created_by_email,
        created_at,
        published_at,
        rollback_from_version_id
      FROM content_versions
      WHERE project_slug = ?
        AND status IN ('published', 'rollback')
      ORDER BY version_number DESC
      LIMIT 20`,
    )
    .bind(projectSlug)
    .all();

  return { ok: true, versions: (result.results || []).map(mapVersionRow) };
}

export async function createContentVersion(env, data) {
  const database = requireClientDb(env);

  if (!database.ok) {
    return database;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const versionNumber = await getNextVersionNumber(database.db, data.projectSlug);
  const publishedAt = PUBLIC_STATUSES.has(data.status) ? now : '';

  await database.db
    .prepare(
      `INSERT INTO content_versions (
        id,
        project_slug,
        version_number,
        status,
        content_json,
        created_by_user_id,
        created_by_email,
        created_at,
        published_at,
        rollback_from_version_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      data.projectSlug,
      versionNumber,
      data.status,
      JSON.stringify(data.content || {}),
      data.userId,
      data.email,
      now,
      publishedAt || null,
      data.rollbackFromVersionId || null,
    )
    .run();

  return {
    ok: true,
    version: {
      id,
      projectSlug: data.projectSlug,
      versionNumber,
      status: data.status,
      content: data.content || {},
      createdByUserId: data.userId,
      createdByEmail: data.email,
      createdAt: now,
      publishedAt,
      rollbackFromVersionId: data.rollbackFromVersionId || '',
    },
  };
}

export async function createAssetUpload(env, data) {
  const database = requireClientDb(env);

  if (!database.ok) {
    return database;
  }

  const id = data.id || crypto.randomUUID();
  const now = new Date().toISOString();

  await database.db
    .prepare(
      `INSERT INTO asset_uploads (
        id,
        project_slug,
        storage_key,
        file_name,
        content_type,
        byte_size,
        sha256,
        status,
        created_by_user_id,
        created_by_email,
        created_at,
        uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, '', 'pending', ?, ?, ?, NULL)`,
    )
    .bind(
      id,
      data.projectSlug,
      data.storageKey,
      data.fileName,
      data.contentType,
      data.byteSize,
      data.userId,
      data.email,
      now,
    )
    .run();

  return {
    ok: true,
    asset: {
      id,
      projectSlug: data.projectSlug,
      storageKey: data.storageKey,
      fileName: data.fileName,
      contentType: data.contentType,
      byteSize: data.byteSize,
      status: 'pending',
      createdByUserId: data.userId,
      createdByEmail: data.email,
      createdAt: now,
      uploadedAt: '',
      publicUrl: `/api/public/assets/${id}`,
    },
  };
}

export async function getAssetUploadForUser(env, id, userId) {
  const database = requireClientDb(env);

  if (!database.ok) {
    return database;
  }

  const row = await database.db
    .prepare(
      `SELECT *
      FROM asset_uploads
      WHERE id = ? AND created_by_user_id = ?
      LIMIT 1`,
    )
    .bind(id, userId)
    .first();

  return { ok: true, asset: row ? mapAssetRow(row) : null };
}

export async function getUploadedAsset(env, id) {
  const database = requireClientDb(env);

  if (!database.ok) {
    return database;
  }

  const row = await database.db
    .prepare(
      `SELECT *
      FROM asset_uploads
      WHERE id = ? AND status = 'uploaded'
      LIMIT 1`,
    )
    .bind(id)
    .first();

  return { ok: true, asset: row ? mapAssetRow(row) : null };
}

export async function getUploadedAssetForProject(env, id, projectSlug) {
  const database = requireClientDb(env);

  if (!database.ok) {
    return database;
  }

  const row = await database.db
    .prepare(
      `SELECT *
      FROM asset_uploads
      WHERE id = ?
        AND project_slug = ?
        AND status = 'uploaded'
      LIMIT 1`,
    )
    .bind(id, projectSlug)
    .first();

  return { ok: true, asset: row ? mapAssetRow(row) : null };
}

export async function markAssetUploaded(env, id, sha256, byteSize) {
  const database = requireClientDb(env);

  if (!database.ok) {
    return database;
  }

  const now = new Date().toISOString();

  await database.db
    .prepare(
      `UPDATE asset_uploads
      SET status = 'uploaded',
          sha256 = ?,
          byte_size = ?,
          uploaded_at = ?
      WHERE id = ?`,
    )
    .bind(sha256, byteSize, now, id)
    .run();

  return { ok: true, uploadedAt: now };
}

export async function insertPublishEvent(env, data) {
  const database = requireClientDb(env);

  if (!database.ok) {
    return database;
  }

  await database.db
    .prepare(
      `INSERT INTO publish_events (
        id,
        project_slug,
        version_id,
        event_type,
        actor_user_id,
        actor_email,
        diff_summary_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      data.projectSlug,
      data.versionId,
      data.eventType,
      data.userId,
      data.email,
      JSON.stringify(data.diffSummary || {}),
      new Date().toISOString(),
    )
    .run();

  return { ok: true };
}

export async function insertAuditLog(env, data) {
  const database = requireClientDb(env);

  if (!database.ok) {
    return database;
  }

  await database.db
    .prepare(
      `INSERT INTO audit_log (
        id,
        project_slug,
        actor_user_id,
        actor_email,
        action,
        metadata_json,
        ip,
        user_agent,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      data.projectSlug,
      data.userId,
      data.email,
      data.action,
      JSON.stringify(data.metadata || {}),
      data.ip || '',
      data.userAgent || '',
      new Date().toISOString(),
    )
    .run();

  return { ok: true };
}

async function getLatestContentVersion(env, projectSlug, statuses) {
  const database = requireClientDb(env);

  if (!database.ok) {
    return database;
  }

  const placeholders = statuses.map(() => '?').join(', ');
  const row = await database.db
    .prepare(
      `SELECT *
      FROM content_versions
      WHERE project_slug = ?
        AND status IN (${placeholders})
      ORDER BY version_number DESC
      LIMIT 1`,
    )
    .bind(projectSlug, ...statuses)
    .first();

  return { ok: true, version: row ? mapVersionRow(row) : null };
}

async function getNextVersionNumber(db, projectSlug) {
  const row = await db
    .prepare(
      `SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version
      FROM content_versions
      WHERE project_slug = ?`,
    )
    .bind(projectSlug)
    .first();

  return Number(row?.next_version || 1);
}

function mapFieldRow(row) {
  return {
    projectSlug: row.project_slug,
    key: row.field_key,
    label: row.label,
    type: row.field_type,
    defaultValue: parseJson(row.default_json, null),
    validation: parseJson(row.validation_json, {}),
    sortOrder: Number(row.sort_order || 0),
    enabled: Boolean(row.enabled),
  };
}

function mapVersionRow(row) {
  return {
    id: row.id,
    projectSlug: row.project_slug,
    versionNumber: Number(row.version_number || 0),
    status: row.status,
    content: parseJson(row.content_json, {}),
    createdByUserId: row.created_by_user_id || '',
    createdByEmail: row.created_by_email || '',
    createdAt: row.created_at || '',
    publishedAt: row.published_at || '',
    rollbackFromVersionId: row.rollback_from_version_id || '',
  };
}

function mapAssetRow(row) {
  return {
    id: row.id,
    projectSlug: row.project_slug,
    storageKey: row.storage_key,
    fileName: row.file_name,
    contentType: row.content_type,
    byteSize: Number(row.byte_size || 0),
    sha256: row.sha256 || '',
    status: row.status,
    createdByUserId: row.created_by_user_id || '',
    createdByEmail: row.created_by_email || '',
    createdAt: row.created_at || '',
    uploadedAt: row.uploaded_at || '',
    publicUrl: `/api/public/assets/${row.id}`,
  };
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
