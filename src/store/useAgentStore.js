import { create } from 'zustand';
import { agentHash } from '../utils/hash';
import { loadAgents, saveAgents, loadVersions, saveVersions } from '../services/storage';
import { PRESET_DEFS } from '../constants/presets';

const COLOR_KEYS = ["purple", "teal", "coral", "blue", "amber", "green"];
const ICON_CHARS = "ABCDEFGHIJKLMNOP";

export const useAgentStore = create((set, get) => ({
  // 状态
  agents: [],
  versions: {},
  ready: false,

  // 初始化
  init: async () => {
    const [savedAgents, savedVers] = await Promise.all([loadAgents(), loadVersions()]);
    if (savedAgents && savedAgents.length) {
      const agentsWithLLMConfig = savedAgents.map(agent => ({
        ...agent,
        llmConfig: agent.llmConfig || null
      }));
      set({ agents: agentsWithLLMConfig, ready: true });
    } else {
      const withHashes = await Promise.all(PRESET_DEFS.map(async (d, i) => ({
        ...d,
        hash: await agentHash(d.name, d.colorKey, Date.now() + i),
      })));
      set({ agents: withHashes, ready: true });
      await saveAgents(withHashes);
    }
    if (savedVers) set({ versions: savedVers });
    return get().versions;
  },

  // Agent操作
  addAgent: async (currentAgents) => {
    const agents = currentAgents || get().agents;
    const idx = agents.length;
    const hash = await agentHash(`Agent ${idx + 1}`, COLOR_KEYS[idx % COLOR_KEYS.length], Date.now());
    const newAgent = {
      hash, name: `Agent ${idx + 1}`, subtitle: "Custom",
      icon: ICON_CHARS[idx % ICON_CHARS.length],
      colorKey: COLOR_KEYS[idx % COLOR_KEYS.length],
      systemPrompt: "You are a helpful agent. Based on the context from previous agents, complete your assigned task. Respond in Chinese.",
      llmConfig: null,
    };
    const updated = [...agents, newAgent];
    set({ agents: updated });
    await saveAgents(updated);
    return newAgent;
  },

  updateAgent: (hash, updates) => {
    set(state => ({
      agents: state.agents.map(a => 
        a.hash === hash ? { ...a, ...updates } : a
      )
    }));
  },

  deleteAgent: (hash) => {
    set(state => ({
      agents: state.agents.filter(a => a.hash !== hash)
    }));
  },

  persistAgents: async (newAgents) => {
    set({ agents: newAgents });
    await saveAgents(newAgents);
  },

  updateAgentLLMConfig: async (hash, llmConfig) => {
    const { agents } = get();
    const updated = agents.map(agent =>
      agent.hash === hash
        ? { ...agent, llmConfig }
        : agent
    );
    set({ agents: updated });
    await saveAgents(updated);
  },

  // 版本操作
  setVersions: (versions) => {
    set({ versions });
  },

  addVersion: async (agentHash, version) => {
    const { versions } = get();
    const updated = { 
      ...versions, 
      [agentHash]: [version, ...(versions[agentHash] || [])] 
    };
    set({ versions: updated });
    await saveVersions(updated);
  },

  deleteVersion: async (agentHash, sha) => {
    const { versions } = get();
    const updated = { 
      ...versions, 
      [agentHash]: (versions[agentHash] || []).filter(v => v.sha !== sha) 
    };
    set({ versions: updated });
    await saveVersions(updated);
  },

  // 版本提交
  commitVer: async (agent, msg) => {
    const { versions } = get();
    const contentHash = await agentHash(agent.systemPrompt + agent.name + agent.colorKey + Date.now());
    const entry = {
      sha: contentHash.slice(0, 7), fullSha: contentHash,
      message: msg.trim() || "无备注", ts: Date.now(),
      name: agent.name, systemPrompt: agent.systemPrompt, colorKey: agent.colorKey,
    };
    const updated = { ...versions, [agent.hash]: [entry, ...(versions[agent.hash] || [])] };
    set({ versions: updated });
    await saveVersions(updated);
    return get().versions;
  },

  // 版本回滚
  revertTo: async (agentHash, v) => {
    const { agents } = get();
    const updated = agents.map(a => a.hash === agentHash ? { ...a, name: v.name, systemPrompt: v.systemPrompt, colorKey: v.colorKey } : a);
    set({ agents: updated });
    await saveAgents(updated);
  },

  // 项目导入
  importProject: async (project) => {
    const { agents } = get();
    const existingNames = new Set(agents.map(a => a.name));
    const newAgents = project.agents.filter(a => !existingNames.has(a.name));
    const updated = [...agents, ...newAgents];
    set({ agents: updated });
    await saveAgents(updated);
    return {
      imported: newAgents.length,
      skipped: project.agents.length - newAgents.length,
    };
  },

  // 选择器
  getAgentByHash: (hash) => {
    return get().agents.find(a => a.hash === hash);
  },

  getAgentsByHashes: (hashes) => {
    const { agents } = get();
    return hashes.map(hash => agents.find(a => a.hash === hash)).filter(Boolean);
  },
}));