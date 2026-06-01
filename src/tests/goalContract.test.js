import { describe, it, expect, beforeEach } from 'vitest';
import { createGoalContract, validateGoalContract, GOAL_STATUS } from '../types/goalContract';
import { compileGoal } from '../services/goalCompiler';
import { useGoalStore } from '../store/useGoalStore';

describe('createGoalContract', () => {
  it('should create a contract with defaults', () => {
    const contract = createGoalContract({ goal_text: 'Test goal' });
    expect(contract.goal_id).toMatch(/^goal_/);
    expect(contract.goal_text).toBe('Test goal');
    expect(contract.success_definition).toEqual([]);
    expect(contract.non_goals).toEqual([]);
    expect(contract.constraints).toEqual({});
    expect(contract.budget).toEqual({ max_iterations: 3 });
    expect(contract.status).toBe(GOAL_STATUS.DRAFT);
    expect(contract.created_at).toBeDefined();
  });

  it('should accept all fields', () => {
    const contract = createGoalContract({
      goal_text: 'Build feature',
      success_definition: ['Unit tests pass', 'No regressions'],
      non_goals: ['UI polish'],
      constraints: { scope: 'backend' },
      budget: { max_iterations: 5 }
    });
    expect(contract.success_definition).toHaveLength(2);
    expect(contract.non_goals).toEqual(['UI polish']);
    expect(contract.constraints.scope).toBe('backend');
    expect(contract.budget.max_iterations).toBe(5);
  });

  it('should generate unique ids', () => {
    const a = createGoalContract({ goal_text: 'A' });
    const b = createGoalContract({ goal_text: 'B' });
    expect(a.goal_id).not.toBe(b.goal_id);
  });
});

describe('validateGoalContract', () => {
  it('should pass valid contract', () => {
    const contract = createGoalContract({
      goal_text: 'Test',
      success_definition: ['Done']
    });
    const result = validateGoalContract(contract);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail without goal_text', () => {
    const contract = createGoalContract({ goal_text: '', success_definition: ['x'] });
    const result = validateGoalContract(contract);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('goal_text is required');
  });

  it('should fail without success_definition', () => {
    const contract = createGoalContract({ goal_text: 'Test' });
    const result = validateGoalContract(contract);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('success_definition must have at least 1 item');
  });
});

describe('compileGoal', () => {
  it('should compile simple text', () => {
    const contract = compileGoal('实现登录功能');
    expect(contract.goal_text).toBe('实现登录功能');
    expect(contract.goal_id).toMatch(/^goal_/);
  });

  it('should extract success definition from semicolons', () => {
    const contract = compileGoal('用户可以登录；密码可以重置；支持记住我');
    expect(contract.success_definition.length).toBeGreaterThanOrEqual(2);
  });

  it('should extract constraints', () => {
    const contract = compileGoal('实现API，仅限后端，不修改数据库');
    expect(contract.constraints.scope).toBe('backend');
    expect(contract.constraints.no_db_changes).toBe(true);
  });
});

describe('useGoalStore', () => {
  beforeEach(() => {
    useGoalStore.setState({ goals: [], activeGoalId: null });
  });

  it('should create a goal from string', () => {
    const { createGoal } = useGoalStore.getState();
    const goal = createGoal('实现用户认证');
    expect(goal.goal_id).toMatch(/^goal_/);
    expect(useGoalStore.getState().goals).toHaveLength(1);
  });

  it('should create a goal from contract object', () => {
    const { createGoal } = useGoalStore.getState();
    const contract = createGoalContract({
      goal_text: 'Test',
      success_definition: ['Done']
    });
    const goal = createGoal(contract);
    expect(goal.goal_text).toBe('Test');
  });

  it('should update a goal', () => {
    const { createGoal, updateGoal } = useGoalStore.getState();
    const goal = createGoal('Test goal');
    updateGoal(goal.goal_id, { goal_text: 'Updated goal' });
    const updated = useGoalStore.getState().goals.find(g => g.goal_id === goal.goal_id);
    expect(updated.goal_text).toBe('Updated goal');
  });

  it('should delete a goal', () => {
    const { createGoal, deleteGoal } = useGoalStore.getState();
    const goal = createGoal('To delete');
    deleteGoal(goal.goal_id);
    expect(useGoalStore.getState().goals).toHaveLength(0);
  });

  it('should set and get active goal', () => {
    const { createGoal, setActiveGoal, getActiveGoal } = useGoalStore.getState();
    const goal = createGoal('Active goal');
    setActiveGoal(goal.goal_id);
    expect(getActiveGoal().goal_id).toBe(goal.goal_id);
  });

  it('should return null when no active goal', () => {
    const { getActiveGoal } = useGoalStore.getState();
    expect(getActiveGoal()).toBeNull();
  });

  it('should complete a goal', () => {
    const { createGoal, completeGoal } = useGoalStore.getState();
    const goal = createGoal('Complete me');
    completeGoal(goal.goal_id);
    const updated = useGoalStore.getState().goals.find(g => g.goal_id === goal.goal_id);
    expect(updated.status).toBe(GOAL_STATUS.COMPLETED);
    expect(updated.completed_at).toBeDefined();
  });

  it('should clear activeGoalId when deleting active goal', () => {
    const { createGoal, setActiveGoal, deleteGoal } = useGoalStore.getState();
    const goal = createGoal('Active to delete');
    setActiveGoal(goal.goal_id);
    deleteGoal(goal.goal_id);
    expect(useGoalStore.getState().activeGoalId).toBeNull();
  });

  it('should filter goals by status', () => {
    const { createGoal, completeGoal, getGoalsByStatus } = useGoalStore.getState();
    const g1 = createGoal('A');
    const g2 = createGoal('B');
    completeGoal(g1.goal_id);
    expect(getGoalsByStatus(GOAL_STATUS.DRAFT)).toHaveLength(1);
    expect(getGoalsByStatus(GOAL_STATUS.COMPLETED)).toHaveLength(1);
  });
});
