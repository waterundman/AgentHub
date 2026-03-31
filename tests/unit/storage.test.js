import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as storage from "../../src/services/storage";

describe("storage service", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("fmtTs", () => {
    it("formats timestamp to Chinese locale", () => {
      const ts = new Date("2024-03-15T10:30:00+08:00").getTime();
      const result = storage.fmtTs(ts);
      expect(result).toMatch(/\d{2}\/\d{2} \d{2}:\d{2}/);
    });
  });

  describe("load/save agents", () => {
    it("returns null for missing agents", async () => {
      const result = await storage.loadAgents();
      expect(result).toBeNull();
    });

    it("saves and loads agents", async () => {
      const agents = [{ hash: "abc123", name: "test" }];
      await storage.saveAgents(agents);
      const result = await storage.loadAgents();
      expect(result).toEqual(agents);
    });
  });

  describe("load/save versions", () => {
    it("returns null for missing versions", async () => {
      const result = await storage.loadVersions();
      expect(result).toBeNull();
    });

    it("saves and loads versions", async () => {
      const versions = { abc123: [{ sha: "def456", message: "test" }] };
      await storage.saveVersions(versions);
      const result = await storage.loadVersions();
      expect(result).toEqual(versions);
    });
  });
});
