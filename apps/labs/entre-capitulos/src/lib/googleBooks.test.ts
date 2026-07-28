import { describe, expect, it } from "vitest";
import { buildGoogleBooksQuery, normalizeGoogleVolume } from "./googleBooks";

describe("Google Books normalization", () => {
  it("turns ISBN queries into a field-specific search", () => {
    expect(buildGoogleBooksQuery("978-65-80309-31-3")).toBe(
      "isbn:9786580309313",
    );
    expect(buildGoogleBooksQuery("Torto Arado")).toBe("Torto Arado");
  });

  it("normalizes a complete volume and upgrades the cover to HTTPS", () => {
    const book = normalizeGoogleVolume({
      id: "volume-1",
      volumeInfo: {
        title: "Livro de teste",
        authors: ["Autora"],
        categories: ["Ficção", "Ficção"],
        description: "<p>Uma história &amp; sua memória.</p>",
        industryIdentifiers: [
          { type: "ISBN_13", identifier: "9780000000000" },
        ],
        imageLinks: {
          thumbnail: "http://books.google.com/cover&edge=curl",
        },
      },
    });

    expect(book).toMatchObject({
      sourceId: "volume-1",
      title: "Livro de teste",
      authors: ["Autora"],
      categories: ["Ficção"],
      description: "Uma história & sua memória.",
      isbn13: "9780000000000",
      coverUrl: "https://books.google.com/cover",
    });
  });

  it("rejects volumes without title, author or id", () => {
    expect(
      normalizeGoogleVolume({ id: "volume-2", volumeInfo: { title: "Sem autor" } }),
    ).toBeNull();
  });
});
