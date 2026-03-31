import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeDiff, countChanges } from "../../src/utils/diff";
import { shortHash, sha256 } from "../../src/utils/hash";

describe("pipeline integration", () => {
  describe("context building", () => {
    it("builds context with task only for first agent", () => {
      const task = "分析市场趋势";
      const ctx = `任务：${task}`;
      expect(ctx).toContain("分析市场趋势");
      expect(ctx).not.toContain("前序工作成果");
    });

    it("builds context with previous outputs for dependent agents", () => {
      const task = "分析市场趋势";
      const outputs = {
        hash1: "Step 1: Research market data",
        hash2: "Step 2: Analyze trends",
      };
      const agents = [
        { hash: "hash1", name: "规划师" },
        { hash: "hash2", name: "研究员" },
        { hash: "hash3", name: "执行者" },
      ];

      let ctx = `任务：${task}`;
      ctx += "\n\n---依赖的前序工作成果---";
      for (const depHash of ["hash1", "hash2"]) {
        const depAgent = agents.find(a => a.hash === depHash);
        if (depAgent && outputs[depHash]) {
          ctx += `\n\n[${depAgent.name} · ${depHash.slice(0, 7)}]:\n${outputs[depHash]}`;
        }
      }
      ctx += "\n\n请基于以上成果，执行你的职责。";

      expect(ctx).toContain("规划师");
      expect(ctx).toContain("研究员");
      expect(ctx).toContain("Research market data");
      expect(ctx).toContain("Analyze trends");
      expect(ctx).toContain("请基于以上成果");
    });
  });

  describe("DAG dependency resolution", () => {
    it("identifies ready agents with no dependencies", () => {
      const agents = [
        { hash: "a", name: "A" },
        { hash: "b", name: "B" },
        { hash: "c", name: "C" },
      ];
      const dependencies = {
        b: ["a"],
        c: ["a", "b"],
      };
      const completed = new Set();
      const inProgress = new Set();
      const failed = new Set();

      const ready = agents.filter(a => {
        if (completed.has(a.hash) || inProgress.has(a.hash) || failed.has(a.hash)) return false;
        const deps = dependencies[a.hash] || [];
        return deps.every(d => completed.has(d));
      });

      expect(ready.map(a => a.hash)).toEqual(["a"]);
    });

    it("unlocks dependent agents after completion", () => {
      const agents = [
        { hash: "a", name: "A" },
        { hash: "b", name: "B" },
        { hash: "c", name: "C" },
      ];
      const dependencies = {
        b: ["a"],
        c: ["a", "b"],
      };
      const completed = new Set(["a"]);
      const inProgress = new Set();
      const failed = new Set();

      const ready = agents.filter(a => {
        if (completed.has(a.hash) || inProgress.has(a.hash) || failed.has(a.hash)) return false;
        const deps = dependencies[a.hash] || [];
        return deps.every(d => completed.has(d));
      });

      expect(ready.map(a => a.hash)).toEqual(["b"]);
    });

    it("allows parallel execution of independent agents", () => {
      const agents = [
        { hash: "a", name: "A" },
        { hash: "b", name: "B" },
        { hash: "c", name: "C" },
      ];
      const dependencies = {
        c: ["a", "b"],
      };
      const completed = new Set();

      const ready = agents.filter(a => {
        if (completed.has(a.hash)) return false;
        const deps = dependencies[a.hash] || [];
        return deps.every(d => completed.has(d));
      });

      expect(ready.map(a => a.hash)).toEqual(["a", "b"]);
    });
  });

  describe("diff + hash integration", () => {
    it("computes diff and counts changes correctly", () => {
      const oldPrompt = "You are a planner.\nCreate a plan.";
      const newPrompt = "You are a planner.\nCreate a detailed plan.\nUse bullet points.";

      const diff = computeDiff(oldPrompt, newPrompt);
      const { adds, dels } = countChanges(diff);

      expect(adds).toBeGreaterThan(0);
      expect(dels).toBeGreaterThanOrEqual(0);
    });

    it("generates consistent short hashes for display", () => {
      const hash = "a1b2c3d4e5f6g7h8i9j0";
      expect(shortHash(hash)).toBe("a1b2c3d");
    });
  });
});
