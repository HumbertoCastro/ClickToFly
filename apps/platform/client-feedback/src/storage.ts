import type { FeedbackItem, StoredDraft } from './types';

const STORAGE_PREFIX = 'hc-feedback:v1:';

export function loadStoredDraft(token: string): StoredDraft | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${token}`);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredDraft;

    if (parsed.version !== 1 || !Array.isArray(parsed.items)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredDraft(
  token: string,
  reviewer: StoredDraft['reviewer'],
  items: FeedbackItem[],
) {
  const payload: StoredDraft = {
    version: 1,
    reviewer,
    items,
    savedAt: new Date().toISOString(),
  };

  localStorage.setItem(`${STORAGE_PREFIX}${token}`, JSON.stringify(payload));
}

export function clearStoredDraft(token: string) {
  localStorage.removeItem(`${STORAGE_PREFIX}${token}`);
}
