import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAgentStore } from '../../src/store/useAgentStore';
import { usePipelineStore } from '../../src/store/usePipelineStore';

vi.mock('../../src/services/storage', () => ({
  loadAgents: vi.fn().mockResolvedValue([]),
  saveAgents: vi.fn().mockResolvedValue(undefined),
  loadVersions: vi.fn().mockResolvedValue({}),
  saveVersions: vi.fn().mockResolvedValue(undefined),
}));

describe('useAgentStore', () => {
  beforeEach(() => {
    useAgentStore.setState({
      agents: [],
      versions: {},
      ready: false
    });
  });

  describe('Agent CRUD', () => {
    it('should add a new agent', async () => {
      const { addAgent } = useAgentStore.getState();
      await addAgent([]);
      const { agents } = useAgentStore.getState();
      expect(agents).toHaveLength(1);
      expect(agents[0]).toHaveProperty('hash');
      expect(agents[0]).toHaveProperty('name', 'Agent 1');
      expect(agents[0]).toHaveProperty('colorKey');
    });

    it('should update an agent', () => {
      const agent = { hash: 'test-1', name: 'Test Agent' };
      useAgentStore.setState({ agents: [agent] });

      const { updateAgent } = useAgentStore.getState();
      updateAgent('test-1', { name: 'Updated Agent' });

      const { agents } = useAgentStore.getState();
      expect(agents[0].name).toBe('Updated Agent');
    });

    it('should not update other agents', () => {
      const agents = [
        { hash: 'test-1', name: 'Agent 1' },
        { hash: 'test-2', name: 'Agent 2' }
      ];
      useAgentStore.setState({ agents });

      const { updateAgent } = useAgentStore.getState();
      updateAgent('test-1', { name: 'Updated' });

      const { agents: updated } = useAgentStore.getState();
      expect(updated[1].name).toBe('Agent 2');
    });

    it('should delete an agent', () => {
      const agents = [
        { hash: 'test-1', name: 'Agent 1' },
        { hash: 'test-2', name: 'Agent 2' }
      ];
      useAgentStore.setState({ agents });

      const { deleteAgent } = useAgentStore.getState();
      deleteAgent('test-1');

      const { agents: remaining } = useAgentStore.getState();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].hash).toBe('test-2');
    });

    it('should get agent by hash', () => {
      const agents = [
        { hash: 'test-1', name: 'Agent 1' },
        { hash: 'test-2', name: 'Agent 2' }
      ];
      useAgentStore.setState({ agents });

      const { getAgentByHash } = useAgentStore.getState();
      expect(getAgentByHash('test-1')).toEqual(agents[0]);
      expect(getAgentByHash('nonexistent')).toBeUndefined();
    });
  });

  describe('Version Management', () => {
    it('should add a version', async () => {
      const { addVersion } = useAgentStore.getState();
      await addVersion('agent-1', { sha: 'v1', timestamp: 1 });

      const { versions } = useAgentStore.getState();
      expect(versions['agent-1']).toHaveLength(1);
      expect(versions['agent-1'][0].sha).toBe('v1');
    });

    it('should prepend new versions', async () => {
      useAgentStore.setState({
        versions: { 'agent-1': [{ sha: 'v1', timestamp: 1 }] }
      });

      const { addVersion } = useAgentStore.getState();
      await addVersion('agent-1', { sha: 'v2', timestamp: 2 });

      const { versions } = useAgentStore.getState();
      expect(versions['agent-1']).toHaveLength(2);
      expect(versions['agent-1'][0].sha).toBe('v2');
    });

    it('should delete a version', async () => {
      useAgentStore.setState({
        versions: {
          'agent-1': [
            { sha: 'v1', timestamp: 1 },
            { sha: 'v2', timestamp: 2 }
          ]
        }
      });

      const { deleteVersion } = useAgentStore.getState();
      await deleteVersion('agent-1', 'v1');

      const { versions } = useAgentStore.getState();
      expect(versions['agent-1']).toHaveLength(1);
      expect(versions['agent-1'][0].sha).toBe('v2');
    });
  });

  describe('LLM Config', () => {
    it('should update agent LLM config', async () => {
      const agents = [{ hash: 'test-1', name: 'Test', llmConfig: null }];
      useAgentStore.setState({ agents });

      const { updateAgentLLMConfig } = useAgentStore.getState();
      await updateAgentLLMConfig('test-1', { provider: 'openai', model: 'gpt-4' });

      const { agents: updated } = useAgentStore.getState();
      expect(updated[0].llmConfig).toEqual({ provider: 'openai', model: 'gpt-4' });
    });
  });

  describe('Project Import', () => {
    it('should import new agents', async () => {
      useAgentStore.setState({ agents: [{ hash: '1', name: 'Existing' }] });

      const { importProject } = useAgentStore.getState();
      const result = await importProject({
        agents: [
          { hash: '2', name: 'New Agent' },
          { hash: '3', name: 'Existing' }
        ]
      });

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(1);

      const { agents } = useAgentStore.getState();
      expect(agents).toHaveLength(2);
    });
  });
});

describe('usePipelineStore', () => {
  beforeEach(() => {
    usePipelineStore.setState({
      running: false,
      statuses: {},
      logs: [],
      finalOutput: "",
      doneCount: 0,
      tokenStats: null,
      abortController: null
    });
  });

  it('should have correct initial state', () => {
    const store = usePipelineStore.getState();
    expect(store.running).toBe(false);
    expect(store.statuses).toEqual({});
    expect(store.logs).toEqual([]);
    expect(store.finalOutput).toBe('');
    expect(store.doneCount).toBe(0);
    expect(store.tokenStats).toBeNull();
  });

  it('should clear logs', () => {
    usePipelineStore.setState({
      logs: [{ id: '1', content: 'test' }],
      finalOutput: 'output',
      statuses: { a: 'done' },
      tokenStats: { summary: {} },
      doneCount: 1
    });

    const { clearLogs } = usePipelineStore.getState();
    clearLogs();

    const state = usePipelineStore.getState();
    expect(state.logs).toEqual([]);
    expect(state.finalOutput).toBe('');
    expect(state.statuses).toEqual({});
    expect(state.tokenStats).toBeNull();
    expect(state.doneCount).toBe(0);
  });

  it('should not run if already running', async () => {
    usePipelineStore.setState({ running: true });

    const { run } = usePipelineStore.getState();
    await run('test', [{ hash: '1' }]);

    expect(usePipelineStore.getState().logs).toEqual([]);
  });

  it('should not run with empty task', async () => {
    const { run } = usePipelineStore.getState();
    await run('', [{ hash: '1' }]);

    expect(usePipelineStore.getState().logs).toEqual([]);
  });

  it('should not run with no agents', async () => {
    const { run } = usePipelineStore.getState();
    await run('test', []);

    expect(usePipelineStore.getState().logs).toEqual([]);
  });
});
