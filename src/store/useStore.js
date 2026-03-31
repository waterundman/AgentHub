import { create } from "zustand";
import { agentHash, sha256 } from "../utils/hash";
import { loadAgents, saveAgents, loadVersions, saveVersions } from "../services/storage";
import { PRESET_DEFS } from "../constants/presets";

const COLOR_KEYS = ["purple", "teal", "coral", "blue", "amber", "green"];
const ICON_CHARS = "ABCDEFGHIJKLMNOP";

export const useStore = create((set, get) => ({
  agents: [],
  versions: {},
  ready: false,

  init: async () => {
    const [savedAgents, savedVers] = await Promise.all([loadAgents(), loadVersions()]);
    if (savedAgents && savedAgents.length) {
      set({ agents: savedAgents, ready: true });
    } else {
      const withHashes = await Promise.all(PRESET_DEFS.map(async (d, i) => ({
        ...d,
        hash: await agentHash(d.name, d.colorKey, Date.now() + i),
      })));
      set({ agents: withHashes, ready: true });
      await saveAgents(withHashes);
    }
    if (savedVers) set({ versions: savedVers });
  },

  persistAgents: async (agents) => {
    set({ agents });
    await saveAgents(agents);
  },

  addAgent: async () => {
    const { agents } = get();
    const idx = agents.length;
    const hash = await agentHash(`Agent ${idx + 1}`, COLOR_KEYS[idx % COLOR_KEYS.length], Date.now());
    const newAgent = {
      hash, name: `Agent ${idx + 1}`, subtitle: "Custom",
      icon: ICON_CHARS[idx % ICON_CHARS.length],
      colorKey: COLOR_KEYS[idx % COLOR_KEYS.length],
      systemPrompt: "You are a helpful agent. Based on the context from previous agents, complete your assigned task. Respond in Chinese.",
    };
    const updated = [...agents, newAgent];
    set({ agents: updated });
    await saveAgents(updated);
  },

  commitVer: async (agent, msg) => {
    const { versions } = get();
    const contentHash = await sha256(agent.systemPrompt + agent.name + agent.colorKey + Date.now());
    const entry = {
      sha: contentHash.slice(0, 7), fullSha: contentHash,
      message: msg.trim() || "无备注", ts: Date.now(),
      name: agent.name, systemPrompt: agent.systemPrompt, colorKey: agent.colorKey,
    };
    const updated = { ...versions, [agent.hash]: [entry, ...(versions[agent.hash] || [])] };
    set({ versions: updated });
    await saveVersions(updated);
  },

  revertTo: async (agentHash, v) => {
    const { agents } = get();
    const updated = agents.map(a => a.hash === agentHash ? { ...a, name: v.name, systemPrompt: v.systemPrompt, colorKey: v.colorKey } : a);
    set({ agents: updated });
    await saveAgents(updated);
  },

  deleteVer: async (agentHash, sha) => {
    const { versions } = get();
    const updated = { ...versions, [agentHash]: (versions[agentHash] || []).filter(v => v.sha !== sha) };
    set({ versions: updated });
    await saveVersions(updated);
  },
}));
