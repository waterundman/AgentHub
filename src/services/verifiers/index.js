import { verifyStep } from './stepVerifier';
import { verifyIntegration } from './integrationVerifier';
import { verifyGoal } from './goalVerifier';

export { verifyStep, verifyIntegration, verifyGoal };

export function verifyAll(goalContract, steps, stepReports, options = {}) {
  const results = {
    stepResults: [],
    integration: null,
    goal: null,
    pass: true
  };

  steps.forEach(step => {
    const report = stepReports.find(r => r.step_id === step.step_id);
    const result = verifyStep(step, report, options);
    results.stepResults.push({ step_id: step.step_id, ...result });
    if (!result.pass) results.pass = false;
  });

  results.integration = verifyIntegration(steps, stepReports);
  if (!results.integration.pass) results.pass = false;

  results.goal = verifyGoal(goalContract, stepReports);
  if (!results.goal.pass) results.pass = false;

  return results;
}
