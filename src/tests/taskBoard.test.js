import { describe, it, expect, beforeEach } from 'vitest';
import { useTaskStore } from '../store/useTaskStore';

describe('TaskBoard Integration', () => {
  beforeEach(() => {
    useTaskStore.setState({ tasks: [], taskLogs: [] });
  });

  describe('Task Creation and Status', () => {
    it('should create task with pending status', () => {
      useTaskStore.getState().addTask({ title: 'UI Component', priority: 'high', tags: ['frontend'] });
      
      const { tasks } = useTaskStore.getState();
      const task = tasks[0];
      expect(task.status).toBe('pending');
      expect(task.claimedBy).toBeNull();
      expect(task.title).toBe('UI Component');
    });

    it('should track task counts by status', () => {
      const store = useTaskStore.getState();
      store.addTask({ title: 'Task 1' });
      const t2 = store.addTask({ title: 'Task 2' });
      const t3 = store.addTask({ title: 'Task 3' });
      useTaskStore.getState().claimTask(t2.id, 'agent-1');
      useTaskStore.getState().claimTask(t3.id, 'agent-2');
      useTaskStore.getState().completeTask(t3.id);

      const { getTasksByStatus } = useTaskStore.getState();
      expect(getTasksByStatus('pending')).toHaveLength(1);
      expect(getTasksByStatus('claimed')).toHaveLength(1);
      expect(getTasksByStatus('completed')).toHaveLength(1);
    });
  });

  describe('TaskClaimPanel Interactions', () => {
    it('should claim task for agent', () => {
      useTaskStore.getState().addTask({ title: 'Claimable Task' });
      const { tasks } = useTaskStore.getState();
      
      useTaskStore.getState().claimTask(tasks[0].id, 'agent-1');
      const updated = useTaskStore.getState().tasks[0];
      
      expect(updated.status).toBe('claimed');
      expect(updated.claimedBy).toBe('agent-1');
      expect(updated.claimedAt).toBeDefined();
    });

    it('should not allow claiming completed task', () => {
      useTaskStore.getState().addTask({ title: 'Done Task' });
      const { tasks } = useTaskStore.getState();
      useTaskStore.getState().completeTask(tasks[0].id);
      
      const result = useTaskStore.getState().claimTask(tasks[0].id, 'agent-1');
      expect(result).toBeNull();
    });

    it('should unclaim task', () => {
      useTaskStore.getState().addTask({ title: 'Unclaimable' });
      const { tasks } = useTaskStore.getState();
      useTaskStore.getState().claimTask(tasks[0].id, 'agent-1');
      useTaskStore.getState().unclaimTask(tasks[0].id);

      const updated = useTaskStore.getState().tasks[0];
      expect(updated.status).toBe('pending');
      expect(updated.claimedBy).toBeNull();
    });

    it('should complete claimed task', () => {
      useTaskStore.getState().addTask({ title: 'Completable' });
      const { tasks } = useTaskStore.getState();
      useTaskStore.getState().claimTask(tasks[0].id, 'agent-1');
      useTaskStore.getState().completeTask(tasks[0].id);

      const updated = useTaskStore.getState().tasks[0];
      expect(updated.status).toBe('completed');
      expect(updated.completedAt).toBeDefined();
    });
  });

  describe('Task Filtering', () => {
    it('should filter tasks by agent', () => {
      const store = useTaskStore.getState();
      const t1 = store.addTask({ title: 'A' });
      const t2 = store.addTask({ title: 'B' });
      store.addTask({ title: 'C' });
      useTaskStore.getState().claimTask(t1.id, 'agent-1');
      useTaskStore.getState().claimTask(t2.id, 'agent-1');

      const { getTasksByAgent } = useTaskStore.getState();
      expect(getTasksByAgent('agent-1')).toHaveLength(2);
      expect(getTasksByAgent('agent-2')).toHaveLength(0);
    });
  });

  describe('Task Logs', () => {
    it('should log task creation', () => {
      useTaskStore.getState().addTask({ title: 'Logged Task' });

      const { taskLogs } = useTaskStore.getState();
      expect(taskLogs).toHaveLength(1);
      expect(taskLogs[0].action).toBe('created');
    });

    it('should log task claim', () => {
      useTaskStore.getState().addTask({ title: 'Claim Log' });
      const { tasks } = useTaskStore.getState();
      useTaskStore.getState().claimTask(tasks[0].id, 'agent-1');

      const { taskLogs } = useTaskStore.getState();
      expect(taskLogs).toHaveLength(2);
      expect(taskLogs[1].action).toBe('claimed');
      expect(taskLogs[1].details.agentHash).toBe('agent-1');
    });

    it('should log task completion', () => {
      useTaskStore.getState().addTask({ title: 'Complete Log' });
      const { tasks } = useTaskStore.getState();
      useTaskStore.getState().claimTask(tasks[0].id, 'agent-1');
      useTaskStore.getState().completeTask(tasks[0].id);

      const { taskLogs } = useTaskStore.getState();
      expect(taskLogs).toHaveLength(3);
      expect(taskLogs[2].action).toBe('completed');
    });
  });
});
