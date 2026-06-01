import { describe, it, expect, beforeEach } from 'vitest';
import { useTaskStore } from '../store/useTaskStore';

describe('useTaskStore', () => {
  beforeEach(() => {
    useTaskStore.setState({ tasks: [], taskLogs: [] });
  });

  it('should add a task', () => {
    const { addTask } = useTaskStore.getState();
    const task = addTask({ title: 'Test task', description: 'desc', priority: 'high', tags: ['a'] });

    expect(task.id).toBeDefined();
    expect(task.title).toBe('Test task');
    expect(task.status).toBe('pending');
    expect(task.claimedBy).toBeNull();
    expect(task.priority).toBe('high');
    expect(task.tags).toEqual(['a']);

    const { tasks } = useTaskStore.getState();
    expect(tasks).toHaveLength(1);
  });

  it('should claim a task', () => {
    const { addTask, claimTask } = useTaskStore.getState();
    const task = addTask({ title: 'Claim me' });

    const claimed = claimTask(task.id, 'agent-hash-1');
    expect(claimed.status).toBe('claimed');
    expect(claimed.claimedBy).toBe('agent-hash-1');
    expect(claimed.claimedAt).toBeDefined();
  });

  it('should not claim a non-pending task', () => {
    const { addTask, claimTask, completeTask } = useTaskStore.getState();
    const task = addTask({ title: 'Done task' });
    completeTask(task.id);

    const result = claimTask(task.id, 'agent-hash-1');
    expect(result).toBeNull();
  });

  it('should complete a task', () => {
    const { addTask, claimTask, completeTask } = useTaskStore.getState();
    const task = addTask({ title: 'Complete me' });
    claimTask(task.id, 'agent-hash-1');
    completeTask(task.id);

    const updated = useTaskStore.getState().tasks.find(t => t.id === task.id);
    expect(updated.status).toBe('completed');
    expect(updated.completedAt).toBeDefined();
  });

  it('should filter tasks by status', () => {
    const { addTask, getTasksByStatus } = useTaskStore.getState();
    addTask({ title: 'A' });
    const t2 = addTask({ title: 'B' });
    useTaskStore.getState().claimTask(t2.id, 'agent-1');

    expect(getTasksByStatus('pending')).toHaveLength(1);
    expect(getTasksByStatus('claimed')).toHaveLength(1);
    expect(getTasksByStatus('completed')).toHaveLength(0);
  });

  it('should filter tasks by agent', () => {
    const { addTask, claimTask, getTasksByAgent } = useTaskStore.getState();
    const t1 = addTask({ title: 'A' });
    const t2 = addTask({ title: 'B' });
    addTask({ title: 'C' });
    claimTask(t1.id, 'agent-1');
    claimTask(t2.id, 'agent-1');

    expect(getTasksByAgent('agent-1')).toHaveLength(2);
    expect(getTasksByAgent('agent-2')).toHaveLength(0);
  });
});
