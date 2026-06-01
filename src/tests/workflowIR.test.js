import { describe, it, expect, beforeEach } from 'vitest';
import { createWorkflow, createStep, WORKFLOW_STATUS, STEP_KIND, STEP_STATUS } from '../types/workflowIR';
import { createPatch, applyPatch, revertPatch, PATCH_OPS } from '../services/patchEngine';
import { useWorkflowStore } from '../store/useWorkflowStore';

const mockGoal = { goal_id: 'goal_test123', goal_text: 'Test goal' };

describe('createWorkflow', () => {
  it('should create workflow from goal contract', () => {
    const wf = createWorkflow(mockGoal);
    expect(wf.workflow_id).toBe('wf_goal_test123');
    expect(wf.goal_id).toBe('goal_test123');
    expect(wf.version).toBe(1);
    expect(wf.status).toBe(WORKFLOW_STATUS.DRAFT);
    expect(wf.steps).toEqual([]);
    expect(wf.control_policy.max_parallel_steps).toBe(2);
    expect(wf.created_at).toBeDefined();
  });
});

describe('createStep', () => {
  it('should create a step with defaults', () => {
    const step = createStep({
      title: 'Research phase',
      kind: STEP_KIND.RESEARCH,
      agent_type: 'researcher',
      mode: 'sequential',
      task: 'Analyze requirements'
    });
    expect(step.step_id).toMatch(/^S/);
    expect(step.title).toBe('Research phase');
    expect(step.kind).toBe(STEP_KIND.RESEARCH);
    expect(step.status).toBe(STEP_STATUS.PENDING);
    expect(step.dependencies).toEqual([]);
    expect(step.acceptance_criteria).toEqual([]);
  });

  it('should accept dependencies and acceptance criteria', () => {
    const step = createStep({
      title: 'Implement',
      kind: STEP_KIND.IMPLEMENT,
      agent_type: 'coder',
      mode: 'sequential',
      task: 'Write code',
      dependencies: ['S001'],
      acceptance_criteria: ['Tests pass']
    });
    expect(step.dependencies).toEqual(['S001']);
    expect(step.acceptance_criteria).toEqual(['Tests pass']);
  });
});

describe('Patch apply/revert', () => {
  let wf;

  beforeEach(() => {
    wf = createWorkflow(mockGoal);
    const s1 = createStep({ title: 'Step 1', kind: STEP_KIND.RESEARCH, agent_type: 'r', mode: 's', task: 't1' });
    wf.steps = [s1];
  });

  it('should apply ADD_STEP patch', () => {
    const s2 = createStep({ title: 'Step 2', kind: STEP_KIND.IMPLEMENT, agent_type: 'c', mode: 's', task: 't2' });
    const patch = createPatch(wf.workflow_id, 1, 2, [
      { type: PATCH_OPS.ADD_STEP, step: s2 }
    ], 'add implementation step');

    const result = applyPatch(wf, patch);
    expect(result.version).toBe(2);
    expect(result.steps).toHaveLength(2);
    expect(result.steps[1].title).toBe('Step 2');
  });

  it('should apply REMOVE_STEP patch', () => {
    const patch = createPatch(wf.workflow_id, 1, 2, [
      { type: PATCH_OPS.REMOVE_STEP, step_id: wf.steps[0].step_id, _removed: wf.steps[0] }
    ], 'remove step');

    const result = applyPatch(wf, patch);
    expect(result.steps).toHaveLength(0);
  });

  it('should apply REPLACE patch', () => {
    const patch = createPatch(wf.workflow_id, 1, 2, [
      { type: PATCH_OPS.REPLACE, step_id: wf.steps[0].step_id, updates: { title: 'Updated', status: STEP_STATUS.RUNNING }, _original: { title: wf.steps[0].title, status: wf.steps[0].status } }
    ], 'update step');

    const result = applyPatch(wf, patch);
    expect(result.steps[0].title).toBe('Updated');
    expect(result.steps[0].status).toBe(STEP_STATUS.RUNNING);
  });

  it('should apply MOVE_STEP patch', () => {
    const s2 = createStep({ title: 'Step 2', kind: STEP_KIND.TEST, agent_type: 't', mode: 's', task: 't2' });
    wf.steps.push(s2);

    const patch = createPatch(wf.workflow_id, 1, 2, [
      { type: PATCH_OPS.MOVE_STEP, step_id: s2.step_id, to_index: 0, _from_index: 1 }
    ], 'reorder');

    const result = applyPatch(wf, patch);
    expect(result.steps[0].step_id).toBe(s2.step_id);
    expect(result.steps[1].step_id).toBe(wf.steps[0].step_id);
  });

  it('should revert ADD_STEP patch', () => {
    const s2 = createStep({ title: 'Step 2', kind: STEP_KIND.IMPLEMENT, agent_type: 'c', mode: 's', task: 't2' });
    const patch = createPatch(wf.workflow_id, 1, 2, [
      { type: PATCH_OPS.ADD_STEP, step: s2 }
    ], 'add step');

    const applied = applyPatch(wf, patch);
    const reverted = revertPatch(applied, patch);
    expect(reverted.version).toBe(1);
    expect(reverted.steps).toHaveLength(1);
  });

  it('should revert REPLACE patch', () => {
    const patch = createPatch(wf.workflow_id, 1, 2, [
      { type: PATCH_OPS.REPLACE, step_id: wf.steps[0].step_id, updates: { title: 'Updated' }, _original: { title: wf.steps[0].title } }
    ], 'update');

    const applied = applyPatch(wf, patch);
    const reverted = revertPatch(applied, patch);
    expect(reverted.steps[0].title).toBe('Step 1');
  });

  it('should reject version mismatch on apply', () => {
    const patch = createPatch(wf.workflow_id, 5, 6, [
      { type: PATCH_OPS.ADD_STEP, step: createStep({ title: 'X', kind: STEP_KIND.TEST, agent_type: 't', mode: 's', task: 'x' }) }
    ], 'bad version');

    expect(() => applyPatch(wf, patch)).toThrow('Version mismatch');
  });

  it('should reject version mismatch on revert', () => {
    const patch = createPatch(wf.workflow_id, 1, 2, [
      { type: PATCH_OPS.ADD_STEP, step: createStep({ title: 'X', kind: STEP_KIND.TEST, agent_type: 't', mode: 's', task: 'x' }) }
    ], 'test');

    expect(() => revertPatch(wf, patch)).toThrow('Version mismatch');
  });

  it('should handle multiple ops in one patch', () => {
    const s2 = createStep({ title: 'S2', kind: STEP_KIND.TEST, agent_type: 't', mode: 's', task: 't2' });
    const s3 = createStep({ title: 'S3', kind: STEP_KIND.VERIFY, agent_type: 'v', mode: 's', task: 't3' });
    const patch = createPatch(wf.workflow_id, 1, 2, [
      { type: PATCH_OPS.ADD_STEP, step: s2 },
      { type: PATCH_OPS.ADD_STEP, step: s3 },
      { type: PATCH_OPS.REPLACE, step_id: wf.steps[0].step_id, updates: { status: STEP_STATUS.COMPLETED }, _original: { status: STEP_STATUS.PENDING } }
    ], 'batch update');

    const result = applyPatch(wf, patch);
    expect(result.steps).toHaveLength(3);
    expect(result.steps[0].status).toBe(STEP_STATUS.COMPLETED);
  });
});

describe('useWorkflowStore', () => {
  beforeEach(() => {
    useWorkflowStore.setState({ workflows: [], activeWorkflowId: null, patches: [] });
  });

  it('should create a workflow', () => {
    const { createWorkflow: create } = useWorkflowStore.getState();
    const wf = create(mockGoal);
    expect(wf.workflow_id).toBe('wf_goal_test123');
    expect(useWorkflowStore.getState().workflows).toHaveLength(1);
    expect(useWorkflowStore.getState().activeWorkflowId).toBe(wf.workflow_id);
  });

  it('should add a step', () => {
    const { createWorkflow: create, addStep } = useWorkflowStore.getState();
    const wf = create(mockGoal);
    const step = addStep(wf.workflow_id, {
      title: 'Research',
      kind: STEP_KIND.RESEARCH,
      agent_type: 'r',
      mode: 's',
      task: 'do research'
    });
    const stored = useWorkflowStore.getState().workflows.find(w => w.workflow_id === wf.workflow_id);
    expect(stored.steps).toHaveLength(1);
    expect(step.step_id).toMatch(/^S/);
  });

  it('should add a pre-built step', () => {
    const { createWorkflow: create, addStep } = useWorkflowStore.getState();
    const wf = create(mockGoal);
    const built = createStep({ title: 'Built', kind: STEP_KIND.TEST, agent_type: 't', mode: 's', task: 'x' });
    addStep(wf.workflow_id, built);
    const stored = useWorkflowStore.getState().workflows.find(w => w.workflow_id === wf.workflow_id);
    expect(stored.steps[0].step_id).toBe(built.step_id);
  });

  it('should update a step', () => {
    const { createWorkflow: create, addStep, updateStep } = useWorkflowStore.getState();
    const wf = create(mockGoal);
    const step = addStep(wf.workflow_id, { title: 'A', kind: STEP_KIND.IMPLEMENT, agent_type: 'c', mode: 's', task: 't' });
    updateStep(wf.workflow_id, step.step_id, { status: STEP_STATUS.RUNNING });
    const stored = useWorkflowStore.getState().workflows.find(w => w.workflow_id === wf.workflow_id);
    expect(stored.steps[0].status).toBe(STEP_STATUS.RUNNING);
  });

  it('should remove a step', () => {
    const { createWorkflow: create, addStep, removeStep } = useWorkflowStore.getState();
    const wf = create(mockGoal);
    const step = addStep(wf.workflow_id, { title: 'A', kind: STEP_KIND.TEST, agent_type: 't', mode: 's', task: 't' });
    removeStep(wf.workflow_id, step.step_id);
    const stored = useWorkflowStore.getState().workflows.find(w => w.workflow_id === wf.workflow_id);
    expect(stored.steps).toHaveLength(0);
  });

  it('should apply patch and store it', () => {
    const { createWorkflow: create, addStep, applyPatch: apply } = useWorkflowStore.getState();
    const wf = create(mockGoal);
    addStep(wf.workflow_id, { title: 'S1', kind: STEP_KIND.RESEARCH, agent_type: 'r', mode: 's', task: 't' });

    const s2 = createStep({ title: 'S2', kind: STEP_KIND.IMPLEMENT, agent_type: 'c', mode: 's', task: 't2' });
    const patch = createPatch(wf.workflow_id, 1, 2, [
      { type: PATCH_OPS.ADD_STEP, step: s2 }
    ], 'add step');

    const result = apply(patch);
    expect(result.version).toBe(2);
    expect(result.steps).toHaveLength(2);
    expect(useWorkflowStore.getState().patches).toHaveLength(1);
  });

  it('should get active workflow', () => {
    const { createWorkflow: create, getActiveWorkflow } = useWorkflowStore.getState();
    const wf = create(mockGoal);
    expect(getActiveWorkflow().workflow_id).toBe(wf.workflow_id);
  });

  it('should return null when no active workflow', () => {
    const { getActiveWorkflow } = useWorkflowStore.getState();
    expect(getActiveWorkflow()).toBeNull();
  });

  it('should get workflow versions', () => {
    const { createWorkflow: create, applyPatch: apply, getWorkflowVersions } = useWorkflowStore.getState();
    const wf = create(mockGoal);
    const p1 = createPatch(wf.workflow_id, 1, 2, [
      { type: PATCH_OPS.ADD_STEP, step: createStep({ title: 'X', kind: STEP_KIND.TEST, agent_type: 't', mode: 's', task: 'x' }) }
    ], 'v2');
    apply(p1);
    const versions = getWorkflowVersions(wf.workflow_id);
    expect(versions).toHaveLength(1);
    expect(versions[0].to_version).toBe(2);
  });

  it('should set active workflow', () => {
    const { createWorkflow: create, setActiveWorkflow } = useWorkflowStore.getState();
    const wf1 = create({ goal_id: 'g1', goal_text: 'A' });
    const wf2 = create({ goal_id: 'g2', goal_text: 'B' });
    setActiveWorkflow(wf2.workflow_id);
    expect(useWorkflowStore.getState().activeWorkflowId).toBe(wf2.workflow_id);
  });

  it('should delete workflow and its patches', () => {
    const { createWorkflow: create, applyPatch: apply, deleteWorkflow } = useWorkflowStore.getState();
    const wf = create(mockGoal);
    const patch = createPatch(wf.workflow_id, 1, 2, [
      { type: PATCH_OPS.ADD_STEP, step: createStep({ title: 'X', kind: STEP_KIND.TEST, agent_type: 't', mode: 's', task: 'x' }) }
    ], 'test');
    apply(patch);
    deleteWorkflow(wf.workflow_id);
    expect(useWorkflowStore.getState().workflows).toHaveLength(0);
    expect(useWorkflowStore.getState().patches).toHaveLength(0);
    expect(useWorkflowStore.getState().activeWorkflowId).toBeNull();
  });
});
