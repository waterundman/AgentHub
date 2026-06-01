import { describe, it, expect } from 'vitest';
import { verifyStep } from '../services/verifiers/stepVerifier';
import { verifyIntegration } from '../services/verifiers/integrationVerifier';
import { verifyGoal } from '../services/verifiers/goalVerifier';
import { verifyAll } from '../services/verifiers';
import { REPORT_STATUS } from '../types/stepReport';
import { STEP_STATUS } from '../types/workflowIR';

// Helpers
function makeStep(overrides = {}) {
  return {
    step_id: 'S001',
    title: 'Test Step',
    kind: 'implement',
    agent_type: 'coder',
    mode: 'auto',
    task: 'Do something',
    dependencies: [],
    acceptance_criteria: [],
    status: STEP_STATUS.PENDING,
    created_at: new Date().toISOString(),
    ...overrides
  };
}

function makeReport(overrides = {}) {
  return {
    report_id: 'sr_S001_a1_abc123',
    step_id: 'S001',
    attempt: 1,
    status: REPORT_STATUS.COMPLETED,
    summary: 'Done',
    artifacts: [],
    evidence: [],
    risks: [],
    blocked_by: [],
    suggested_next_steps: [],
    resource_usage: {},
    confidence: 0.9,
    created_at: new Date().toISOString(),
    ...overrides
  };
}

function makeGoalContract(overrides = {}) {
  return {
    goal_id: 'goal_test',
    goal_text: 'Test goal',
    success_definition: [],
    non_goals: [],
    constraints: {},
    budget: { max_iterations: 3 },
    status: 'draft',
    created_at: new Date().toISOString(),
    ...overrides
  };
}

// StepVerifier
describe('verifyStep', () => {
  it('should pass completed step with high confidence', () => {
    const step = makeStep();
    const report = makeReport();
    const result = verifyStep(step, report);
    expect(result.pass).toBe(true);
    expect(result.findings).toHaveLength(0);
  });

  it('should fail when report is missing', () => {
    const step = makeStep();
    const result = verifyStep(step, null);
    expect(result.pass).toBe(false);
    expect(result.findings[0].code).toBe('MISSING_REPORT');
  });

  it('should fail when step is missing', () => {
    const report = makeReport();
    const result = verifyStep(null, report);
    expect(result.pass).toBe(false);
    expect(result.findings[0].code).toBe('MISSING_STEP');
  });

  it('should fail when report status is failed', () => {
    const step = makeStep();
    const report = makeReport({ status: REPORT_STATUS.FAILED });
    const result = verifyStep(step, report);
    expect(result.pass).toBe(false);
    expect(result.findings.some(f => f.code === 'STEP_FAILED')).toBe(true);
  });

  it('should fail when report status is blocked', () => {
    const step = makeStep();
    const report = makeReport({ status: REPORT_STATUS.BLOCKED, blocked_by: ['S000'] });
    const result = verifyStep(step, report);
    expect(result.pass).toBe(false);
    expect(result.findings.some(f => f.code === 'STEP_BLOCKED')).toBe(true);
  });

  it('should warn on partial status', () => {
    const step = makeStep();
    const report = makeReport({ status: REPORT_STATUS.PARTIAL });
    const result = verifyStep(step, report);
    expect(result.pass).toBe(true);
    expect(result.findings.some(f => f.code === 'STEP_PARTIAL')).toBe(true);
  });

  it('should fail when acceptance criteria not met', () => {
    const step = makeStep({ acceptance_criteria: ['All tests pass', 'No lint errors'] });
    const report = makeReport({ evidence: [{ summary: 'Tests pass' }] });
    const result = verifyStep(step, report);
    // "All tests pass" should match via "Tests pass", but "No lint errors" won't
    expect(result.findings.some(f => f.code === 'CRITERION_UNMET')).toBe(true);
  });

  it('should pass when acceptance criteria are met via evidence', () => {
    const step = makeStep({ acceptance_criteria: ['Tests pass'] });
    const report = makeReport({ evidence: [{ summary: 'All unit tests pass successfully' }] });
    const result = verifyStep(step, report);
    expect(result.pass).toBe(true);
  });

  it('should fail when confidence is below threshold', () => {
    const step = makeStep();
    const report = makeReport({ confidence: 0.3 });
    const result = verifyStep(step, report, { confidenceThreshold: 0.6 });
    expect(result.pass).toBe(false);
    expect(result.findings.some(f => f.code === 'LOW_CONFIDENCE')).toBe(true);
  });

  it('should pass when confidence meets threshold', () => {
    const step = makeStep();
    const report = makeReport({ confidence: 0.8 });
    const result = verifyStep(step, report, { confidenceThreshold: 0.6 });
    expect(result.pass).toBe(true);
  });

  it('should warn on empty artifacts', () => {
    const step = makeStep();
    const report = makeReport({ artifacts: [{ name: 'output.txt' }] });
    const result = verifyStep(step, report);
    expect(result.findings.some(f => f.code === 'EMPTY_ARTIFACT')).toBe(true);
  });

  it('should warn on high risks', () => {
    const step = makeStep();
    const report = makeReport({ risks: [{ severity: 'high', description: 'Data loss possible' }] });
    const result = verifyStep(step, report);
    expect(result.findings.some(f => f.code === 'HIGH_RISK')).toBe(true);
  });
});

// IntegrationVerifier
describe('verifyIntegration', () => {
  it('should pass with no steps', () => {
    const result = verifyIntegration([], []);
    expect(result.pass).toBe(true);
  });

  it('should pass when all steps have successful reports', () => {
    const steps = [makeStep({ step_id: 'S1' }), makeStep({ step_id: 'S2' })];
    const reports = [makeReport({ step_id: 'S1' }), makeReport({ step_id: 'S2' })];
    const result = verifyIntegration(steps, reports);
    expect(result.pass).toBe(true);
  });

  it('should fail when a step has no report', () => {
    const steps = [makeStep({ step_id: 'S1' }), makeStep({ step_id: 'S2' })];
    const reports = [makeReport({ step_id: 'S1' })];
    const result = verifyIntegration(steps, reports);
    expect(result.pass).toBe(false);
    expect(result.conflictMap.some(c => c.code === 'NO_REPORT')).toBe(true);
  });

  it('should fail when dependency has failed report', () => {
    const steps = [
      makeStep({ step_id: 'S1' }),
      makeStep({ step_id: 'S2', dependencies: ['S1'] })
    ];
    const reports = [
      makeReport({ step_id: 'S1', status: REPORT_STATUS.FAILED }),
      makeReport({ step_id: 'S2' })
    ];
    const result = verifyIntegration(steps, reports);
    expect(result.pass).toBe(false);
    expect(result.conflictMap.some(c => c.code === 'DEP_FAILED')).toBe(true);
  });

  it('should fail when dependency has no report', () => {
    const steps = [
      makeStep({ step_id: 'S1' }),
      makeStep({ step_id: 'S2', dependencies: ['S1'] })
    ];
    const reports = [makeReport({ step_id: 'S2' })];
    const result = verifyIntegration(steps, reports);
    expect(result.pass).toBe(false);
    expect(result.conflictMap.some(c => c.code === 'DEP_NO_REPORT')).toBe(true);
  });

  it('should detect artifact conflicts', () => {
    const steps = [makeStep({ step_id: 'S1' }), makeStep({ step_id: 'S2' })];
    const reports = [
      makeReport({ step_id: 'S1', artifacts: [{ path: '/output/result.txt' }] }),
      makeReport({ step_id: 'S2', artifacts: [{ path: '/output/result.txt' }] })
    ];
    const result = verifyIntegration(steps, reports);
    expect(result.pass).toBe(false);
    expect(result.conflictMap.some(c => c.code === 'DUPLICATE_ARTIFACT')).toBe(true);
  });
});

// GoalVerifier
describe('verifyGoal', () => {
  it('should pass with no success_definition', () => {
    const goal = makeGoalContract({ success_definition: [] });
    const result = verifyGoal(goal, []);
    expect(result.pass).toBe(true);
  });

  it('should fail when no goal contract provided', () => {
    const result = verifyGoal(null, []);
    expect(result.pass).toBe(false);
  });

  it('should pass when report summary matches clause', () => {
    const goal = makeGoalContract({ success_definition: ['User can login'] });
    const reports = [makeReport({ summary: 'User can login successfully with email and password' })];
    const result = verifyGoal(goal, reports);
    expect(result.pass).toBe(true);
  });

  it('should fail when no report matches clause', () => {
    const goal = makeGoalContract({ success_definition: ['User can export data'] });
    const reports = [makeReport({ summary: 'Login feature implemented' })];
    const result = verifyGoal(goal, reports);
    expect(result.pass).toBe(false);
    expect(result.unmetClauses).toHaveLength(1);
    expect(result.unmetClauses[0].clause).toBe('User can export data');
  });

  it('should pass when evidence matches clause keywords', () => {
    const goal = makeGoalContract({ success_definition: ['Tests pass'] });
    const reports = [makeReport({ evidence: [{ summary: 'All unit tests pass' }] })];
    const result = verifyGoal(goal, reports);
    expect(result.pass).toBe(true);
  });

  it('should only consider successful reports', () => {
    const goal = makeGoalContract({ success_definition: ['Feature done'] });
    const reports = [makeReport({ status: REPORT_STATUS.FAILED, summary: 'Feature done but crashed' })];
    const result = verifyGoal(goal, reports);
    expect(result.pass).toBe(false);
  });

  it('should detect non-goal violations', () => {
    const goal = makeGoalContract({
      success_definition: ['Login works'],
      non_goals: ['Database migration']
    });
    const reports = [makeReport({ summary: 'Login works, also did database migration' })];
    const result = verifyGoal(goal, reports);
    expect(result.pass).toBe(false);
    expect(result.unmetClauses.some(c => c.clause.includes('NON-GOAL VIOLATION'))).toBe(true);
  });
});

// verifyAll
describe('verifyAll', () => {
  it('should pass when all three layers pass', () => {
    const goal = makeGoalContract({ success_definition: ['Feature complete'] });
    const steps = [makeStep({ step_id: 'S1' })];
    const reports = [makeReport({ step_id: 'S1', summary: 'Feature complete' })];
    const result = verifyAll(goal, steps, reports);
    expect(result.pass).toBe(true);
    expect(result.stepResults).toHaveLength(1);
    expect(result.integration.pass).toBe(true);
    expect(result.goal.pass).toBe(true);
  });

  it('should fail overall when any layer fails', () => {
    const goal = makeGoalContract({ success_definition: ['Export works'] });
    const steps = [makeStep({ step_id: 'S1' })];
    const reports = [makeReport({ step_id: 'S1', status: REPORT_STATUS.FAILED, summary: 'Crashed' })];
    const result = verifyAll(goal, steps, reports);
    expect(result.pass).toBe(false);
  });

  it('should run all three layers independently', () => {
    const goal = makeGoalContract({ success_definition: ['Done'] });
    const steps = [
      makeStep({ step_id: 'S1' }),
      makeStep({ step_id: 'S2', dependencies: ['S1'] })
    ];
    const reports = [
      makeReport({ step_id: 'S1', summary: 'Done' }),
      makeReport({ step_id: 'S2', summary: 'Also done' })
    ];
    const result = verifyAll(goal, steps, reports);
    expect(result.stepResults).toHaveLength(2);
    expect(result.integration).toBeDefined();
    expect(result.goal).toBeDefined();
  });
});
