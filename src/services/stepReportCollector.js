import { createStepReport, validateStepReport, REPORT_STATUS } from '../types/stepReport';

const reports = new Map();

export function collectStepReport(stepId, result) {
  const report = createStepReport({
    step_id: stepId,
    attempt: result.attempt || 1,
    status: result.status || REPORT_STATUS.COMPLETED,
    summary: result.summary || '',
    artifacts: result.artifacts || [],
    evidence: result.evidence || [],
    risks: result.risks || [],
    confidence: result.confidence ?? 0.5
  });

  if (result.blocked_by) report.blocked_by = result.blocked_by;
  if (result.suggested_next_steps) report.suggested_next_steps = result.suggested_next_steps;
  if (result.resource_usage) report.resource_usage = result.resource_usage;

  const validation = validateStepReport(report);
  if (!validation.valid) {
    throw new Error(`Invalid step report: ${validation.errors.join(', ')}`);
  }

  if (!reports.has(stepId)) {
    reports.set(stepId, []);
  }
  reports.get(stepId).push(report);

  return report;
}

export function getStepReports(stepId) {
  return reports.get(stepId) || [];
}

export function getLatestReport(stepId) {
  const stepReports = getStepReports(stepId);
  return stepReports.length > 0 ? stepReports[stepReports.length - 1] : null;
}

export function calculateAverageConfidence(stepIds) {
  let totalConfidence = 0;
  let count = 0;

  for (const stepId of stepIds) {
    const latest = getLatestReport(stepId);
    if (latest && latest.confidence != null) {
      totalConfidence += latest.confidence;
      count++;
    }
  }

  return count > 0 ? totalConfidence / count : 0;
}

export function clearReports() {
  reports.clear();
}
