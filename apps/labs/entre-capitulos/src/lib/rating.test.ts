import { describe, expect, it } from "vitest";
import { calculateAverageRating, formatRating } from "./rating";

describe("calculateAverageRating", () => {
  it("returns null when no criterion was filled", () => {
    expect(calculateAverageRating({})).toBeNull();
    expect(formatRating(null)).toBe("Sem avaliação");
  });

  it("uses only filled criteria and rounds to one decimal", () => {
    expect(
      calculateAverageRating({
        writing_quality: 10,
        engagement: 8,
        theme: 7,
      }),
    ).toBe(8.3);
  });

  it("accepts the score boundaries", () => {
    expect(
      calculateAverageRating({
        writing_quality: 1,
        ending: 10,
      }),
    ).toBe(5.5);
  });

  it("ignores values outside the accepted range", () => {
    expect(
      calculateAverageRating({
        writing_quality: 0,
        engagement: 11,
        ending: 8,
      }),
    ).toBe(8);
  });
});
