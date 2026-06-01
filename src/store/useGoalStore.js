import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { compileGoal } from '../services/goalCompiler';
import { GOAL_STATUS } from '../types/goalContract';

export const useGoalStore = create(
  persist(
    (set, get) => ({
      goals: [],
      activeGoalId: null,

      createGoal: (input) => {
        const contract = typeof input === 'string' ? compileGoal(input) : input;
        contract.status = GOAL_STATUS.DRAFT;
        set(state => ({ goals: [...state.goals, contract] }));
        return contract;
      },

      updateGoal: (goalId, updates) => {
        set(state => ({
          goals: state.goals.map(g =>
            g.goal_id === goalId ? { ...g, ...updates } : g
          )
        }));
      },

      deleteGoal: (goalId) => {
        set(state => ({
          goals: state.goals.filter(g => g.goal_id !== goalId),
          activeGoalId: state.activeGoalId === goalId ? null : state.activeGoalId
        }));
      },

      setActiveGoal: (goalId) => {
        set({ activeGoalId: goalId });
      },

      getActiveGoal: () => {
        const { goals, activeGoalId } = get();
        return goals.find(g => g.goal_id === activeGoalId) || null;
      },

      completeGoal: (goalId) => {
        set(state => ({
          goals: state.goals.map(g =>
            g.goal_id === goalId
              ? { ...g, status: GOAL_STATUS.COMPLETED, completed_at: new Date().toISOString() }
              : g
          )
        }));
      },

      getGoalsByStatus: (status) => {
        return get().goals.filter(g => g.status === status);
      }
    }),
    { name: 'agenthub-goals' }
  )
);
