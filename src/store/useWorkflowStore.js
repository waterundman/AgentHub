import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createWorkflow, createStep, WORKFLOW_STATUS } from '../types/workflowIR';
import { applyPatch } from '../services/patchEngine';

export const useWorkflowStore = create(
  persist(
    (set, get) => ({
      workflows: [],
      activeWorkflowId: null,
      patches: [],

      createWorkflow: (goalContract) => {
        const wf = createWorkflow(goalContract);
        set(state => ({
          workflows: [...state.workflows, wf],
          activeWorkflowId: state.activeWorkflowId ?? wf.workflow_id
        }));
        return wf;
      },

      addStep: (workflowId, stepInput) => {
        const step = stepInput.step_id ? stepInput : createStep(stepInput);
        set(state => ({
          workflows: state.workflows.map(wf =>
            wf.workflow_id === workflowId
              ? { ...wf, steps: [...wf.steps, step] }
              : wf
          )
        }));
        return step;
      },

      updateStep: (workflowId, stepId, updates) => {
        set(state => ({
          workflows: state.workflows.map(wf =>
            wf.workflow_id === workflowId
              ? {
                  ...wf,
                  steps: wf.steps.map(s =>
                    s.step_id === stepId ? { ...s, ...updates } : s
                  )
                }
              : wf
          )
        }));
      },

      removeStep: (workflowId, stepId) => {
        set(state => ({
          workflows: state.workflows.map(wf =>
            wf.workflow_id === workflowId
              ? { ...wf, steps: wf.steps.filter(s => s.step_id !== stepId) }
              : wf
          )
        }));
      },

      applyPatch: (patch) => {
        const { workflows, patches } = get();
        const wf = workflows.find(w => w.workflow_id === patch.workflow_id);
        if (!wf) throw new Error(`Workflow ${patch.workflow_id} not found`);
        const updated = applyPatch(wf, patch);
        set({
          workflows: workflows.map(w =>
            w.workflow_id === patch.workflow_id ? updated : w
          ),
          patches: [...patches, patch]
        });
        return updated;
      },

      getActiveWorkflow: () => {
        const { workflows, activeWorkflowId } = get();
        return workflows.find(w => w.workflow_id === activeWorkflowId) || null;
      },

      setActiveWorkflow: (workflowId) => {
        set({ activeWorkflowId: workflowId });
      },

      getWorkflowVersions: (workflowId) => {
        return get().patches.filter(p => p.workflow_id === workflowId);
      },

      deleteWorkflow: (workflowId) => {
        set(state => ({
          workflows: state.workflows.filter(w => w.workflow_id !== workflowId),
          activeWorkflowId: state.activeWorkflowId === workflowId ? null : state.activeWorkflowId,
          patches: state.patches.filter(p => p.workflow_id !== workflowId)
        }));
      }
    }),
    { name: 'agenthub-workflows' }
  )
);
