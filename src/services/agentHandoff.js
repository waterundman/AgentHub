import { useHandoffStore, HANDOFF_STATUS } from '../store/useHandoffStore';
import { useAgentStore } from '../store/useAgentStore';
import { useTaskStore } from '../store/useTaskStore';

export { HANDOFF_STATUS };

export async function handoffTask(fromAgentHash, toAgentHash, task, reason = '') {
  const { getAgentByHash } = useAgentStore.getState();
  const fromAgent = getAgentByHash(fromAgentHash);
  const toAgent = getAgentByHash(toAgentHash);

  if (!fromAgent) throw new Error(`源 Agent 不存在: ${fromAgentHash}`);
  if (!toAgent) throw new Error(`目标 Agent 不存在: ${toAgentHash}`);
  if (!task || !task.id) throw new Error('无效的任务对象');

  const record = useHandoffStore.getState().addHandoff({
    fromAgent: fromAgentHash,
    toAgent: toAgentHash,
    task,
    reason,
  });

  return record;
}

export async function acceptHandoff(handoffId, agentHash) {
  const { handoffs, updateHandoffStatus } = useHandoffStore.getState();
  const handoff = handoffs.find(h => h.id === handoffId);

  if (!handoff) throw new Error(`Handoff 记录不存在: ${handoffId}`);
  if (handoff.toAgent !== agentHash) throw new Error('只有目标 Agent 可以接受 handoff');
  if (handoff.status !== HANDOFF_STATUS.PENDING) throw new Error(`Handoff 状态不允许接受: ${handoff.status}`);

  updateHandoffStatus(handoffId, HANDOFF_STATUS.ACCEPTED, agentHash);

  const { claimTask } = useTaskStore.getState();
  claimTask(handoff.task.id, agentHash);
}

export async function rejectHandoff(handoffId, agentHash, reason = '') {
  const { handoffs, updateHandoffStatus } = useHandoffStore.getState();
  const handoff = handoffs.find(h => h.id === handoffId);

  if (!handoff) throw new Error(`Handoff 记录不存在: ${handoffId}`);
  if (handoff.toAgent !== agentHash) throw new Error('只有目标 Agent 可以拒绝 handoff');
  if (handoff.status !== HANDOFF_STATUS.PENDING) throw new Error(`Handoff 状态不允许拒绝: ${handoff.status}`);

  updateHandoffStatus(handoffId, HANDOFF_STATUS.REJECTED, agentHash);

  const { unclaimTask } = useTaskStore.getState();
  if (handoff.task.claimedBy) {
    unclaimTask(handoff.task.id);
  }
}

export function getHandoffHistory(agentHash) {
  return useHandoffStore.getState().getHandoffsByAgent(agentHash);
}
