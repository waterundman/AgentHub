import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { uid } from '../utils/uid';

export const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      taskLogs: [],

      addTask: ({ title, description = '', priority = 'medium', tags = [] }) => {
        const task = {
          id: uid(),
          title,
          description,
          status: 'pending',
          claimedBy: null,
          claimedAt: null,
          createdAt: new Date().toISOString(),
          completedAt: null,
          priority,
          tags,
        };
        set(state => ({ tasks: [...state.tasks, task] }));
        get().addLog(task.id, 'created', { title });
        return task;
      },

      claimTask: (taskId, agentHash) => {
        let claimed = null;
        set(state => ({
          tasks: state.tasks.map(t => {
            if (t.id === taskId && t.status === 'pending') {
              claimed = { ...t, status: 'claimed', claimedBy: agentHash, claimedAt: new Date().toISOString() };
              return claimed;
            }
            return t;
          })
        }));
        if (claimed) get().addLog(taskId, 'claimed', { agentHash });
        return claimed;
      },

      unclaimTask: (taskId) => {
        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === taskId && t.status === 'claimed'
              ? { ...t, status: 'pending', claimedBy: null, claimedAt: null }
              : t
          )
        }));
        get().addLog(taskId, 'unclaimed');
      },

      updateTaskStatus: (taskId, status) => {
        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === taskId ? { ...t, status } : t
          )
        }));
        get().addLog(taskId, 'status_changed', { status });
      },

      completeTask: (taskId) => {
        const now = new Date().toISOString();
        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === taskId ? { ...t, status: 'completed', completedAt: now } : t
          )
        }));
        get().addLog(taskId, 'completed');
      },

      deleteTask: (taskId) => {
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== taskId)
        }));
      },

      getTasksByStatus: (status) => {
        return get().tasks.filter(t => t.status === status);
      },

      getTasksByAgent: (agentHash) => {
        return get().tasks.filter(t => t.claimedBy === agentHash);
      },

      addLog: (taskId, action, details = {}) => {
        const entry = {
          id: uid(),
          taskId,
          action,
          details,
          timestamp: new Date().toISOString(),
        };
        set(state => ({ taskLogs: [...state.taskLogs, entry] }));
      },
    }),
    {
      name: 'task-storage',
      partialize: (state) => ({ tasks: state.tasks, taskLogs: state.taskLogs })
    }
  )
);
