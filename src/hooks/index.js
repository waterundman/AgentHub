import { useAgentStore } from '../store/useAgentStore';
import { usePipelineStore } from '../store/usePipelineStore';

// 保持向后兼容的hooks
export function useAgents() {
  const store = useAgentStore();
  return {
    agents: store.agents,
    ready: store.ready,
    init: store.init,
    persistAgents: store.persistAgents,
    addAgent: store.addAgent,
    updateAgentLLMConfig: store.updateAgentLLMConfig,
  };
}

export function useVersions(initialVersions) {
  const store = useAgentStore();
  return {
    versions: store.versions,
    setVersions: store.setVersions,
    commitVer: async (agent, msg) => {
      const updatedVersions = await store.commitVer(agent, msg);
      return updatedVersions;
    },
    revertTo: async (agentHash, v, agents, persistAgents) => {
      // 使用store中的revertTo，但需要更新agents
      const updated = agents.map(a => 
        a.hash === agentHash ? { ...a, name: v.name, systemPrompt: v.systemPrompt, colorKey: v.colorKey } : a
      );
      await persistAgents(updated);
    },
    deleteVer: async (agentHash, sha) => {
      await store.deleteVersion(agentHash, sha);
    },
  };
}

export function usePipeline(config) {
  const store = usePipelineStore();
  return {
    running: store.running,
    statuses: store.statuses,
    logs: store.logs,
    finalOutput: store.finalOutput,
    doneCount: store.doneCount,
    tokenStats: store.tokenStats,
    run: (task, agents, dependencies) => store.run(task, agents, dependencies, config),
    stop: store.stop,
    clearLogs: store.clearLogs,
  };
}

export { useToolLayer } from './useToolLayer.js';
export { useTracing, useTracingContext } from './useTracing.js';