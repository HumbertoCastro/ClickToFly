import type { LibraryEntryDraft } from "../types";

export interface ValidationErrors {
  title?: string;
  authors?: string;
  dates?: string;
  currentPage?: string;
}

export function validateLibraryEntry(
  draft: LibraryEntryDraft,
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!draft.book.title.trim()) {
    errors.title = "Informe o título do livro.";
  }

  if (draft.book.authors.filter((author) => author.trim()).length === 0) {
    errors.authors = "Informe pelo menos um autor.";
  }

  if (
    draft.startedAt &&
    draft.endedAt &&
    new Date(draft.endedAt) < new Date(draft.startedAt)
  ) {
    errors.dates = "A data final não pode ser anterior ao início.";
  }

  if (draft.currentPage !== null && draft.currentPage < 0) {
    errors.currentPage = "A página atual não pode ser negativa.";
  } else if (
    draft.currentPage !== null &&
    draft.book.pageCount !== null &&
    draft.currentPage > draft.book.pageCount
  ) {
    errors.currentPage = "A página atual não pode ultrapassar o total.";
  }

  return errors;
}

export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
