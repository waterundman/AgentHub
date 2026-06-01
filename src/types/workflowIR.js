import { uid } from '../utils/uid';

export const WORKFLOW_STATUS = {
  DRAFT: 'draft',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ABORTED: 'aborted'
};

export const STEP_KIND = {
  RESEARCH: 'research',
  IMPLEMENT: 'implement',
  TEST: 'test',
  VERIFY: 'verify',
  MERGE: 'merge'
};

export const STEP_STATUS = {
  PENDING: 'pending',
  READY: 'ready',
  RUNNING: 'running',
  COMPLETED: 'completed',
  VERIFIED: 'verified',
  FAILED: 'failed',
  BLOCKED: 'blocked'
};

export function createWorkflow(goalContract) {
  return {
    workflow_id: `wf_${goalContract.goal_id}`,
    goal_id: goalContract.goal_id,
    version: 1,
    parent_version: null,
    status: WORKFLOW_STATUS.DRAFT,
    global_context: {},
    steps: [],
    control_policy: {
      max_parallel_steps: 2,
      replan_on_verification_fail: true,
      max_patch_chain: 3
    },
    created_at: new Date().toISOString()
  };
}

export function createStep({ title, kind, agent_type, mode, task, dependencies = [], acceptance_criteria = [] }) {
  return {
    step_id: `S${uid().slice(-6)}`,
    title,
    kind,
    agent_type,
    mode,
    task,
    dependencies,
    acceptance_criteria,
    status: STEP_STATUS.PENDING,
    created_at: new Date().toISOString()
  };
}
