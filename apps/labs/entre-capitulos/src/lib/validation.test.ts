import { describe, expect, it } from "vitest";
import type { LibraryEntryDraft } from "../types";
import { validateLibraryEntry } from "./validation";

function draft(): LibraryEntryDraft {
  return {
    profileId: "profile-1",
    book: {
      source: "manual",
      sourceId: null,
      title: "Livro",
      subtitle: "",
      authors: ["Autora"],
      publisher: "",
      publishedDate: "",
      pageCount: 300,
      language: "pt",
      description: "",
      categories: [],
      isbn10: "",
      isbn13: "",
      coverUrl: "",
    },
    status: "reading",
    categories: [],
    startedAt: "2026-07-10",
    endedAt: "",
    currentPage: 120,
    review: "",
    storySummary: "",
    containsSpoilers: false,
    ratings: {},
  };
}

describe("library entry validation", () => {
  it("accepts a valid reading", () => {
    expect(validateLibraryEntry(draft())).toEqual({});
  });

  it("rejects a final date before the start", () => {
    const value = draft();
    value.endedAt = "2026-07-01";
    expect(validateLibraryEntry(value).dates).toBeTruthy();
  });

  it("rejects progress beyond page count", () => {
    const value = draft();
    value.currentPage = 301;
    expect(validateLibraryEntry(value).currentPage).toBeTruthy();
  });

  it("requires title and at least one author", () => {
    const value = draft();
    value.book.title = " ";
    value.book.authors = [];
    expect(validateLibraryEntry(value)).toMatchObject({
      title: expect.any(String),
      authors: expect.any(String),
    });
  });
});
