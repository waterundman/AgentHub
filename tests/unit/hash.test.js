import { describe, it, expect } from "vitest";
import { shortHash, sha256, agentHash } from "../../src/utils/hash";

describe("hash utilities", () => {
  describe("shortHash", () => {
    it("returns first 7 characters", () => {
      expect(shortHash("abcdef1234567890")).toBe("abcdef1");
    });

    it("handles short strings", () => {
      expect(shortHash("abc")).toBe("abc");
    });

    it("handles empty string", () => {
      expect(shortHash("")).toBe("");
    });
  });

  describe("sha256", () => {
    it("produces consistent 64-char hex hash", async () => {
      const hash = await sha256("test");
      expect(hash.length).toBe(64);
      expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
    });

    it("produces different hashes for different inputs", async () => {
      const hash1 = await sha256("test1");
      const hash2 = await sha256("test2");
      expect(hash1).not.toBe(hash2);
    });

    it("produces same hash for same input", async () => {
      const hash1 = await sha256("test");
      const hash2 = await sha256("test");
      expect(hash1).toBe(hash2);
    });
  });

  describe("agentHash", () => {
    it("produces unique hashes with different random values", async () => {
      const hash1 = await agentHash("test", "purple", 123);
      const hash2 = await agentHash("test", "purple", 123);
      expect(hash1).not.toBe(hash2);
    });

    it("produces 64-char hex hash", async () => {
      const hash = await agentHash("test", "purple", 123);
      expect(hash.length).toBe(64);
    });
  });
});
