export const PATCH_OPS = {
  ADD_STEP: 'add_step',
  REMOVE_STEP: 'remove_step',
  REPLACE: 'replace',
  MOVE_STEP: 'move_step'
};

export function createPatch(workflowId, fromVersion, toVersion, ops, rationale) {
  return {
    patch_id: `patch_${workflowId}_v${fromVersion}_to_v${toVersion}`,
    workflow_id: workflowId,
    from_version: fromVersion,
    to_version: toVersion,
    basis: {},
    ops,
    rationale,
    created_at: new Date().toISOString()
  };
}

export function applyPatch(workflow, patch) {
  if (workflow.version !== patch.from_version) {
    throw new Error(`Version mismatch: workflow is v${workflow.version}, patch expects v${patch.from_version}`);
  }

  const next = {
    ...workflow,
    version: patch.to_version,
    parent_version: patch.from_version,
    steps: [...workflow.steps],
    global_context: { ...workflow.global_context }
  };

  for (const op of patch.ops) {
    switch (op.type) {
      case PATCH_OPS.ADD_STEP:
        next.steps = [...next.steps, op.step];
        break;

      case PATCH_OPS.REMOVE_STEP:
        next.steps = next.steps.filter(s => s.step_id !== op.step_id);
        break;

      case PATCH_OPS.REPLACE:
        next.steps = next.steps.map(s =>
          s.step_id === op.step_id ? { ...s, ...op.updates } : s
        );
        break;

      case PATCH_OPS.MOVE_STEP:
        next.steps = moveStep(next.steps, op.step_id, op.to_index);
        break;

      default:
        throw new Error(`Unknown patch op: ${op.type}`);
    }
  }

  return next;
}

export function revertPatch(workflow, patch) {
  if (workflow.version !== patch.to_version) {
    throw new Error(`Version mismatch: workflow is v${workflow.version}, patch is v${patch.to_version}`);
  }

  const prev = {
    ...workflow,
    version: patch.from_version,
    parent_version: null,
    steps: [...workflow.steps],
    global_context: { ...workflow.global_context }
  };

  const reversed = [...patch.ops].reverse();
  for (const op of reversed) {
    switch (op.type) {
      case PATCH_OPS.ADD_STEP:
        prev.steps = prev.steps.filter(s => s.step_id !== op.step.step_id);
        break;

      case PATCH_OPS.REMOVE_STEP:
        prev.steps = [...prev.steps, op._removed];
        break;

      case PATCH_OPS.REPLACE:
        prev.steps = prev.steps.map(s =>
          s.step_id === op.step_id ? { ...s, ...op._original } : s
        );
        break;

      case PATCH_OPS.MOVE_STEP:
        prev.steps = moveStep(prev.steps, op.step_id, op._from_index);
        break;

      default:
        throw new Error(`Unknown patch op: ${op.type}`);
    }
  }

  return prev;
}

function moveStep(steps, stepId, toIndex) {
  const idx = steps.findIndex(s => s.step_id === stepId);
  if (idx === -1) return steps;
  const next = [...steps];
  const [moved] = next.splice(idx, 1);
  next.splice(toIndex, 0, moved);
  return next;
}
