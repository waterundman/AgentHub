import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { uid } from '../utils/uid';

export const HANDOFF_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
};

export const RULE_TYPES = {
  INPUT_LENGTH: 'input_length',
  OUTPUT_LENGTH: 'output_length',
  CONTENT_FILTER: 'content_filter',
  CUSTOM: 'custom',
};

export const useHandoffStore = create(
  persist(
    (set, get) => ({
      handoffs: [],
      guardrailRules: [],

      // Handoff operations
      addHandoff: ({ fromAgent, toAgent, task, reason = '' }) => {
        const record = {
          id: uid(),
          fromAgent,
          toAgent,
          task,
          status: HANDOFF_STATUS.PENDING,
          createdAt: new Date().toISOString(),
          completedAt: null,
          reason,
        };
        set(state => ({ handoffs: [...state.handoffs, record] }));
        return record;
      },

      updateHandoffStatus: (handoffId, status, agentHash) => {
        set(state => ({
          handoffs: state.handoffs.map(h => {
            if (h.id !== handoffId) return h;
            if (status === HANDOFF_STATUS.ACCEPTED && h.toAgent !== agentHash) return h;
            if (status === HANDOFF_STATUS.REJECTED && h.toAgent !== agentHash) return h;
            return {
              ...h,
              status,
              completedAt: status !== HANDOFF_STATUS.PENDING ? new Date().toISOString() : h.completedAt,
            };
          }),
        }));
      },

      getHandoffsByAgent: (agentHash) => {
        if (!agentHash) return get().handoffs;
        return get().handoffs.filter(
          h => h.fromAgent === agentHash || h.toAgent === agentHash
        );
      },

      getPendingHandoffs: (agentHash) => {
        return get().handoffs.filter(
          h => h.toAgent === agentHash && h.status === HANDOFF_STATUS.PENDING
        );
      },

      // Guardrail operations
      addGuardrailRule: ({ name, type, config = {}, enabled = true }) => {
        const rule = { id: uid(), name, type, config, enabled };
        set(state => ({ guardrailRules: [...state.guardrailRules, rule] }));
        return rule;
      },

      removeGuardrailRule: (ruleId) => {
        set(state => ({
          guardrailRules: state.guardrailRules.filter(r => r.id !== ruleId),
        }));
      },

      toggleGuardrailRule: (ruleId) => {
        set(state => ({
          guardrailRules: state.guardrailRules.map(r =>
            r.id === ruleId ? { ...r, enabled: !r.enabled } : r
          ),
        }));
      },

      getGuardrailRules: () => get().guardrailRules,
    }),
    {
      name: 'handoff-storage',
      partialize: (state) => ({
        handoffs: state.handoffs,
        guardrailRules: state.guardrailRules,
      }),
    }
  )
);
