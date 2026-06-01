import { describe, it, expect, beforeEach } from 'vitest';
import { useHandoffStore, HANDOFF_STATUS, RULE_TYPES } from '../store/useHandoffStore';
import { useAgentStore } from '../store/useAgentStore';
import { useTaskStore } from '../store/useTaskStore';
import { handoffTask, acceptHandoff, rejectHandoff, getHandoffHistory } from '../services/agentHandoff';
import { addGuardrailRule, removeGuardrailRule, validateInput, validateOutput, getGuardrailRules } from '../services/agentGuardrails';

const AGENT_A = 'agent-a-hash';
const AGENT_B = 'agent-b-hash';

describe('agentHandoff', () => {
  beforeEach(() => {
    useHandoffStore.setState({ handoffs: [], guardrailRules: [] });
    useTaskStore.setState({ tasks: [], taskLogs: [] });
    useAgentStore.setState({
      agents: [
        { hash: AGENT_A, name: 'Agent A', colorKey: 'purple' },
        { hash: AGENT_B, name: 'Agent B', colorKey: 'teal' },
      ],
    });
  });

  it('should handoff task between agents', async () => {
    const task = useTaskStore.getState().addTask({ title: 'Test task' });
    const record = await handoffTask(AGENT_A, AGENT_B, task, '需要B处理');

    expect(record.id).toBeDefined();
    expect(record.fromAgent).toBe(AGENT_A);
    expect(record.toAgent).toBe(AGENT_B);
    expect(record.status).toBe(HANDOFF_STATUS.PENDING);
    expect(record.reason).toBe('需要B处理');
    expect(record.task.id).toBe(task.id);

    const store = useHandoffStore.getState();
    expect(store.handoffs).toHaveLength(1);
  });

  it('should throw for invalid agent', async () => {
    const task = useTaskStore.getState().addTask({ title: 'T' });
    await expect(handoffTask('nonexistent', AGENT_B, task)).rejects.toThrow('源 Agent 不存在');
    await expect(handoffTask(AGENT_A, 'nonexistent', task)).rejects.toThrow('目标 Agent 不存在');
  });

  it('should throw for invalid task', async () => {
    await expect(handoffTask(AGENT_A, AGENT_B, null)).rejects.toThrow('无效的任务对象');
    await expect(handoffTask(AGENT_A, AGENT_B, {})).rejects.toThrow('无效的任务对象');
  });

  it('should accept handoff and claim task', async () => {
    const task = useTaskStore.getState().addTask({ title: 'Accept me' });
    const record = await handoffTask(AGENT_A, AGENT_B, task);

    await acceptHandoff(record.id, AGENT_B);

    const handoff = useHandoffStore.getState().handoffs.find(h => h.id === record.id);
    expect(handoff.status).toBe(HANDOFF_STATUS.ACCEPTED);
    expect(handoff.completedAt).toBeDefined();

    const updatedTask = useTaskStore.getState().tasks.find(t => t.id === task.id);
    expect(updatedTask.claimedBy).toBe(AGENT_B);
  });

  it('should reject handoff by non-target agent', async () => {
    const task = useTaskStore.getState().addTask({ title: 'Reject test' });
    const record = await handoffTask(AGENT_A, AGENT_B, task);

    await expect(acceptHandoff(record.id, AGENT_A)).rejects.toThrow('只有目标 Agent 可以接受');
  });

  it('should not accept already accepted handoff', async () => {
    const task = useTaskStore.getState().addTask({ title: 'Once only' });
    const record = await handoffTask(AGENT_A, AGENT_B, task);
    await acceptHandoff(record.id, AGENT_B);

    await expect(acceptHandoff(record.id, AGENT_B)).rejects.toThrow('状态不允许接受');
  });

  it('should reject handoff and unclaim task', async () => {
    const task = useTaskStore.getState().addTask({ title: 'Reject me' });
    useTaskStore.getState().claimTask(task.id, AGENT_A);
    const record = await handoffTask(AGENT_A, AGENT_B, task);

    await rejectHandoff(record.id, AGENT_B, '不接受此任务');

    const handoff = useHandoffStore.getState().handoffs.find(h => h.id === record.id);
    expect(handoff.status).toBe(HANDOFF_STATUS.REJECTED);
  });

  it('should get handoff history for agent', async () => {
    const t1 = useTaskStore.getState().addTask({ title: 'T1' });
    const t2 = useTaskStore.getState().addTask({ title: 'T2' });
    await handoffTask(AGENT_A, AGENT_B, t1);
    await handoffTask(AGENT_B, AGENT_A, t2);

    const forA = getHandoffHistory(AGENT_A);
    expect(forA).toHaveLength(2);

    const forB = getHandoffHistory(AGENT_B);
    expect(forB).toHaveLength(2);

    const all = getHandoffHistory();
    expect(all).toHaveLength(2);
  });
});

describe('agentGuardrails', () => {
  beforeEach(() => {
    useHandoffStore.setState({ handoffs: [], guardrailRules: [] });
  });

  it('should add and remove rules', () => {
    const rule = addGuardrailRule({ name: 'Test', type: RULE_TYPES.INPUT_LENGTH, config: { maxLength: 100 } });
    expect(getGuardrailRules()).toHaveLength(1);

    removeGuardrailRule(rule.id);
    expect(getGuardrailRules()).toHaveLength(0);
  });

  it('should throw for invalid rule', () => {
    expect(() => addGuardrailRule({})).toThrow('必须包含 name 和 type');
  });

  it('should validate input length', () => {
    addGuardrailRule({ name: '限长', type: RULE_TYPES.INPUT_LENGTH, config: { maxLength: 5 } });

    const ok = validateInput(AGENT_A, 'abc');
    expect(ok.valid).toBe(true);

    const fail = validateInput(AGENT_A, 'abcdefg');
    expect(fail.valid).toBe(false);
    expect(fail.errors[0].message).toContain('5');
  });

  it('should validate output length', () => {
    addGuardrailRule({ name: '输出限长', type: RULE_TYPES.OUTPUT_LENGTH, config: { maxLength: 10 } });

    const ok = validateOutput(AGENT_A, 'short');
    expect(ok.valid).toBe(true);

    const fail = validateOutput(AGENT_A, 'a'.repeat(20));
    expect(fail.valid).toBe(false);
  });

  it('should validate content filter', () => {
    addGuardrailRule({
      name: '敏感词',
      type: RULE_TYPES.CONTENT_FILTER,
      config: { blockedWords: ['密码', 'secret'] },
    });

    const ok = validateInput(AGENT_A, '正常内容');
    expect(ok.valid).toBe(true);

    const fail = validateInput(AGENT_A, '请提供密码');
    expect(fail.valid).toBe(false);
  });

  it('should skip disabled rules', () => {
    const rule = addGuardrailRule({ name: '禁用', type: RULE_TYPES.INPUT_LENGTH, config: { maxLength: 1 } });
    useHandoffStore.setState(state => ({
      guardrailRules: state.guardrailRules.map(r => r.id === rule.id ? { ...r, enabled: false } : r),
    }));

    const result = validateInput(AGENT_A, 'long text here');
    expect(result.valid).toBe(true);
  });

  it('should run custom validator', () => {
    addGuardrailRule({
      name: '自定义',
      type: RULE_TYPES.CUSTOM,
      config: { validator: (hash, input) => input !== 'blocked' || '被自定义规则拦截' },
    });

    const ok = validateInput(AGENT_A, 'safe');
    expect(ok.valid).toBe(true);

    const fail = validateInput(AGENT_A, 'blocked');
    expect(fail.valid).toBe(false);
    expect(fail.errors[0].message).toBe('被自定义规则拦截');
  });
});
