import { describe, it, expect } from "vitest";
import { PROJECT_AGENTS, getProjectAgent, getProjectAgentsByCapability } from "../../src/services/projectAgents";
import { launchAgent, getAgentInfo } from "../../src/services/agentRunner";

describe("project agents registry", () => {
  it("exports all three project agents", () => {
    expect(PROJECT_AGENTS).toHaveLength(3);
    expect(PROJECT_AGENTS.map(a => a.name)).toContain("PPT 大师");
    expect(PROJECT_AGENTS.map(a => a.name)).toContain("清扫者");
    expect(PROJECT_AGENTS.map(a => a.name)).toContain("生图");
  });

  it("finds agent by name", () => {
    const agent = getProjectAgent("PPT 大师");
    expect(agent).toBeDefined();
    expect(agent.name).toBe("PPT 大师");
  });

  it("returns undefined for unknown agent", () => {
    expect(getProjectAgent("Unknown")).toBeUndefined();
  });

  it("filters agents by capability", () => {
    const agents = getProjectAgentsByCapability("文档分析");
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe("PPT 大师");
  });

  it("each agent has required fields", () => {
    for (const agent of PROJECT_AGENTS) {
      expect(agent.name).toBeDefined();
      expect(agent.subtitle).toBeDefined();
      expect(agent.icon).toBeDefined();
      expect(agent.colorKey).toBeDefined();
      expect(agent.systemPrompt).toBeDefined();
      expect(agent.capabilities).toBeInstanceOf(Array);
      expect(agent.config).toBeDefined();
    }
  });
});

describe("agent runner", () => {
  it("getAgentInfo returns agent info", async () => {
    const info = await getAgentInfo("PPT 大师");
    expect(info).not.toBeNull();
    expect(info.name).toBe("PPT 大师");
    expect(info.capabilities).toBeInstanceOf(Array);
  });

  it("getAgentInfo returns null for unknown agent", async () => {
    const info = await getAgentInfo("Unknown");
    expect(info).toBeNull();
  });

  it("launchAgent throws for unknown agent", async () => {
    await expect(launchAgent("Unknown", "test")).rejects.toThrow();
  });
});
