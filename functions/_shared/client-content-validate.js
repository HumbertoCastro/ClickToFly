import { getUploadedAssetForProject } from './client-content-db.js';

const MAX_TEXT_LENGTH = 1200;

export async function validateContent(env, projectSlug, fields, rawContent) {
  if (!rawContent || typeof rawContent !== 'object' || Array.isArray(rawContent)) {
    return { ok: false, error: 'Conteudo invalido.' };
  }

  const fieldMap = new Map(fields.map((field) => [field.key, field]));
  const normalized = {};

  for (const key of Object.keys(rawContent)) {
    const field = fieldMap.get(key);

    if (!field) {
      return { ok: false, error: `Campo nao permitido: ${key}` };
    }

    const value = await normalizeValue(env, projectSlug, field, rawContent[key]);

    if (!value.ok) {
      return value;
    }

    normalized[key] = value.value;
  }

  return { ok: true, content: normalized };
}

export function summarizeDiff(previous = {}, next = {}) {
  const keys = [...new Set([...Object.keys(previous || {}), ...Object.keys(next || {})])];
  const changedKeys = keys.filter(
    (key) => JSON.stringify(previous?.[key] ?? null) !== JSON.stringify(next?.[key] ?? null),
  );

  return {
    changedCount: changedKeys.length,
    changedKeys: changedKeys.slice(0, 80),
  };
}

async function normalizeValue(env, projectSlug, field, rawValue) {
  if (field.type === 'text') {
    const text =
      typeof rawValue === 'string' ? rawValue : typeof rawValue?.value === 'string' ? rawValue.value : '';
    const maxLength = clampNumber(field.validation?.maxLength, 1, 4000) || MAX_TEXT_LENGTH;
    const cleaned = cleanText(text, maxLength);

    if (text && !cleaned) {
      return { ok: false, error: `Texto invalido em ${field.label}.` };
    }

    if (/[<>]/.test(cleaned) || /javascript:/i.test(cleaned)) {
      return { ok: false, error: `HTML ou script nao e permitido em ${field.label}.` };
    }

    return {
      ok: true,
      value: {
        type: 'text',
        value: cleaned,
      },
    };
  }

  if (field.type === 'sectionVisible') {
    const visible = typeof rawValue === 'boolean' ? rawValue : Boolean(rawValue?.visible);

    return {
      ok: true,
      value: {
        type: 'sectionVisible',
        visible,
      },
    };
  }

  if (field.type === 'image') {
    const assetId = cleanText(rawValue?.assetId || rawValue?.id || rawValue, 120);

    if (!assetId) {
      return { ok: false, error: `Imagem ausente em ${field.label}.` };
    }

    const asset = await getUploadedAssetForProject(env, assetId, projectSlug);

    if (!asset.ok) {
      return asset;
    }

    if (!asset.asset) {
      return { ok: false, error: `Imagem nao encontrada para ${field.label}.` };
    }

    return {
      ok: true,
      value: {
        type: 'image',
        assetId,
        url: asset.asset.publicUrl,
      },
    };
  }

  return { ok: false, error: `Tipo de campo nao suportado: ${field.type}` };
}

function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

function clampNumber(value, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(max, Math.max(min, Math.round(number)));
}
