import { REPORT_STATUS } from '../../types/stepReport';

const DEFAULT_CONFIDENCE_THRESHOLD = 0.6;

export function verifyStep(step, stepReport, options = {}) {
  const findings = [];
  const { confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD } = options;

  if (!stepReport) {
    findings.push({ type: 'error', code: 'MISSING_REPORT', message: 'No step report provided' });
    return { pass: false, findings };
  }

  if (!step) {
    findings.push({ type: 'error', code: 'MISSING_STEP', message: 'No step definition provided' });
    return { pass: false, findings };
  }

  // Check report status
  if (stepReport.status === REPORT_STATUS.FAILED) {
    findings.push({ type: 'error', code: 'STEP_FAILED', message: `Step ${step.step_id} failed: ${stepReport.summary}` });
  }

  if (stepReport.status === REPORT_STATUS.BLOCKED) {
    findings.push({ type: 'error', code: 'STEP_BLOCKED', message: `Step ${step.step_id} blocked`, blocked_by: stepReport.blocked_by });
  }

  if (stepReport.status === REPORT_STATUS.PARTIAL) {
    findings.push({ type: 'warning', code: 'STEP_PARTIAL', message: `Step ${step.step_id} partially completed` });
  }

  // Check acceptance criteria
  if (step.acceptance_criteria && step.acceptance_criteria.length > 0) {
    const metCriteria = stepReport.evidence
      ? stepReport.evidence.map(e => e.criterion || e.summary || '').filter(Boolean)
      : [];

    step.acceptance_criteria.forEach((criterion, index) => {
      const met = metCriteria.some(e =>
        e.toLowerCase().includes(criterion.toLowerCase()) ||
        criterion.toLowerCase().includes(e.toLowerCase())
      );
      if (!met) {
        findings.push({
          type: 'error',
          code: 'CRITERION_UNMET',
          message: `Acceptance criterion not met: "${criterion}"`,
          criterion,
          index
        });
      }
    });
  }

  // Check artifacts
  if (stepReport.artifacts) {
    stepReport.artifacts.forEach(artifact => {
      if (!artifact.path && !artifact.content && !artifact.url) {
        findings.push({
          type: 'warning',
          code: 'EMPTY_ARTIFACT',
          message: `Artifact "${artifact.name || 'unnamed'}" has no path, content, or url`
        });
      }
    });
  }

  // Check confidence threshold
  if (stepReport.confidence != null) {
    if (stepReport.confidence < confidenceThreshold) {
      findings.push({
        type: 'error',
        code: 'LOW_CONFIDENCE',
        message: `Confidence ${stepReport.confidence} below threshold ${confidenceThreshold}`,
        confidence: stepReport.confidence,
        threshold: confidenceThreshold
      });
    }
  }

  // Check risks
  if (stepReport.risks && stepReport.risks.length > 0) {
    const highRisks = stepReport.risks.filter(r => r.severity === 'high' || r.level === 'high');
    highRisks.forEach(risk => {
      findings.push({
        type: 'warning',
        code: 'HIGH_RISK',
        message: `High risk detected: ${risk.description || risk.summary || JSON.stringify(risk)}`
      });
    });
  }

  return {
    pass: findings.filter(f => f.type === 'error').length === 0,
    findings
  };
}
