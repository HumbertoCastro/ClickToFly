export function compactIsbn(value: string): string {
  return value.replace(/[^0-9Xx]/g, "").toUpperCase();
}

export function isValidIsbn10(value: string): boolean {
  const isbn = compactIsbn(value);
  if (!/^[0-9]{9}[0-9X]$/.test(isbn)) return false;

  const total = [...isbn].reduce((sum, character, index) => {
    const digit = character === "X" ? 10 : Number(character);
    return sum + digit * (10 - index);
  }, 0);
  return total % 11 === 0;
}

export function isValidIsbn13(value: string): boolean {
  const isbn = compactIsbn(value);
  if (!/^[0-9]{13}$/.test(isbn)) return false;

  const total = [...isbn].reduce(
    (sum, character, index) =>
      sum + Number(character) * (index % 2 === 0 ? 1 : 3),
    0,
  );
  return total % 10 === 0;
}

export function validIsbn(value: string): string {
  const isbn = compactIsbn(value);
  return isValidIsbn10(isbn) || isValidIsbn13(isbn) ? isbn : "";
}

export function isbn10To13(value: string): string {
  const isbn10 = compactIsbn(value);
  if (!isValidIsbn10(isbn10)) return "";

  const firstTwelve = `978${isbn10.slice(0, 9)}`;
  const total = [...firstTwelve].reduce(
    (sum, character, index) =>
      sum + Number(character) * (index % 2 === 0 ? 1 : 3),
    0,
  );
  return `${firstTwelve}${(10 - (total % 10)) % 10}`;
}

export function isbnPair(values: unknown): {
  isbn10: string;
  isbn13: string;
} {
  const candidates = Array.isArray(values)
    ? values.filter((value): value is string => typeof value === "string")
    : [];
  const valid = [...new Set(candidates.map(validIsbn).filter(Boolean))];
  const isbn10 = valid.find((value) => value.length === 10) ?? "";
  const explicit13 = valid.find((value) => value.length === 13) ?? "";
  return {
    isbn10,
    isbn13: explicit13 || (isbn10 ? isbn10To13(isbn10) : ""),
  };
}
