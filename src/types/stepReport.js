import { uid } from '../utils/uid';

export const REPORT_STATUS = {
  COMPLETED: 'completed',
  PARTIAL: 'partial',
  FAILED: 'failed',
  BLOCKED: 'blocked'
};

export function createStepReport({
  step_id,
  attempt = 1,
  status,
  summary,
  artifacts = [],
  evidence = [],
  risks = [],
  confidence
}) {
  return {
    report_id: `sr_${step_id}_a${attempt}_${uid().slice(-6)}`,
    step_id,
    attempt,
    status,
    summary,
    artifacts,
    evidence,
    risks,
    blocked_by: [],
    suggested_next_steps: [],
    resource_usage: {},
    confidence,
    created_at: new Date().toISOString()
  };
}

export function validateStepReport(report) {
  const errors = [];
  if (!report.step_id) errors.push('step_id is required');
  if (!report.status) errors.push('status is required');
  if (!Object.values(REPORT_STATUS).includes(report.status)) {
    errors.push(`status must be one of: ${Object.values(REPORT_STATUS).join(', ')}`);
  }
  if (!report.summary) errors.push('summary is required');
  if (report.confidence != null && (report.confidence < 0 || report.confidence > 1)) {
    errors.push('confidence must be between 0 and 1');
  }
  return { valid: errors.length === 0, errors };
}
