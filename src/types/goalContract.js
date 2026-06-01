import { uid } from '../utils/uid';

export const GOAL_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
  ABORTED: 'aborted'
};

export function createGoalContract({
  goal_text,
  success_definition = [],
  non_goals = [],
  constraints = {},
  budget = { max_iterations: 3 }
}) {
  return {
    goal_id: `goal_${uid()}`,
    goal_text,
    success_definition,
    non_goals,
    constraints,
    budget,
    status: GOAL_STATUS.DRAFT,
    created_at: new Date().toISOString()
  };
}

export function validateGoalContract(contract) {
  const errors = [];
  if (!contract.goal_text) errors.push('goal_text is required');
  if (!contract.success_definition?.length) errors.push('success_definition must have at least 1 item');
  return { valid: errors.length === 0, errors };
}
