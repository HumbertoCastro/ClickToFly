import { describe, expect, it } from "vitest";
import { groupShelfEntries, SHELF_MODULE_CAPACITY } from "./shelf";

describe("groupShelfEntries", () => {
  it("uses four books as the capacity of each shelf module", () => {
    expect(SHELF_MODULE_CAPACITY).toBe(4);
  });

  it.each([
    { count: 0, moduleSizes: [] },
    { count: 1, moduleSizes: [1] },
    { count: 4, moduleSizes: [4] },
    { count: 5, moduleSizes: [4, 1] },
    { count: 9, moduleSizes: [4, 4, 1] },
  ])(
    "groups $count item(s) into modules sized $moduleSizes",
    ({ count, moduleSizes }) => {
      const items = Array.from({ length: count }, (_, index) => index + 1);
      const modules = groupShelfEntries(items);

      expect(modules.map((module) => module.length)).toEqual(moduleSizes);
      expect(modules.flat()).toEqual(items);
    },
  );

  it("preserves item order and leaves the source array unchanged", () => {
    const items = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    const snapshot = [...items];

    expect(groupShelfEntries(items)).toEqual([
      ["A", "B", "C", "D"],
      ["E", "F", "G", "H"],
      ["I"],
    ]);
    expect(items).toEqual(snapshot);
  });
});
