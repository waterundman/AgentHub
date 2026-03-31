import { describe, it, expect } from "vitest";
import { computeDiff, countChanges } from "../../src/utils/diff";

describe("diff utilities", () => {
  describe("computeDiff", () => {
    it("returns empty array for identical strings", () => {
      expect(computeDiff("hello", "hello")).toEqual([]);
    });

    it("detects added lines", () => {
      const result = computeDiff("line1\nline2", "line1\nline2\nline3");
      expect(result).toContainEqual({ type: "add", text: "line3" });
    });

    it("detects removed lines", () => {
      const result = computeDiff("line1\nline2\nline3", "line1\nline2");
      expect(result).toContainEqual({ type: "del", text: "line3" });
    });

    it("detects changed lines", () => {
      const result = computeDiff("old", "new");
      expect(result).toContainEqual({ type: "del", text: "old" });
      expect(result).toContainEqual({ type: "add", text: "new" });
    });

    it("handles empty strings", () => {
      expect(computeDiff("", "")).toEqual([]);
      expect(computeDiff("", "line")).toEqual([{ type: "add", text: "line" }]);
      expect(computeDiff("line", "")).toEqual([{ type: "del", text: "line" }]);
    });

    it("preserves order of same lines", () => {
      const result = computeDiff("a\nb\nc", "a\nb\nc");
      expect(result).toEqual([
        { type: "same", text: "a" },
        { type: "same", text: "b" },
        { type: "same", text: "c" },
      ]);
    });
  });

  describe("countChanges", () => {
    it("counts additions and deletions", () => {
      const lines = [
        { type: "same", text: "a" },
        { type: "add", text: "b" },
        { type: "del", text: "c" },
        { type: "add", text: "d" },
      ];
      expect(countChanges(lines)).toEqual({ adds: 2, dels: 1 });
    });

    it("returns zeros for no changes", () => {
      expect(countChanges([])).toEqual({ adds: 0, dels: 0 });
      expect(countChanges([{ type: "same", text: "a" }])).toEqual({ adds: 0, dels: 0 });
    });
  });
});
