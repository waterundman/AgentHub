import { REPORT_STATUS } from '../../types/stepReport';

export function verifyIntegration(steps, stepReports) {
  const conflictMap = [];

  if (!steps || steps.length === 0) {
    return { pass: true, conflictMap };
  }

  const reportMap = new Map();
  (stepReports || []).forEach(r => reportMap.set(r.step_id, r));

  // Check all steps have reports
  steps.forEach(step => {
    if (!reportMap.has(step.step_id)) {
      conflictMap.push({
        type: 'missing_report',
        code: 'NO_REPORT',
        message: `Step ${step.step_id} has no report`,
        step_id: step.step_id
      });
    }
  });

  // Check dependencies are satisfied
  steps.forEach(step => {
    if (!step.dependencies || step.dependencies.length === 0) return;

    step.dependencies.forEach(depId => {
      const depReport = reportMap.get(depId);
      if (!depReport) {
        conflictMap.push({
          type: 'dependency_unmet',
          code: 'DEP_NO_REPORT',
          message: `Step ${step.step_id} depends on ${depId} which has no report`,
          step_id: step.step_id,
          dependency: depId
        });
      } else if (depReport.status === REPORT_STATUS.FAILED) {
        conflictMap.push({
          type: 'dependency_failed',
          code: 'DEP_FAILED',
          message: `Step ${step.step_id} depends on failed step ${depId}`,
          step_id: step.step_id,
          dependency: depId
        });
      } else if (depReport.status === REPORT_STATUS.BLOCKED) {
        conflictMap.push({
          type: 'dependency_blocked',
          code: 'DEP_BLOCKED',
          message: `Step ${step.step_id} depends on blocked step ${depId}`,
          step_id: step.step_id,
          dependency: depId
        });
      }
    });
  });

  // Check artifact conflicts (same output path from multiple steps)
  const artifactPaths = new Map();
  (stepReports || []).forEach(report => {
    if (!report.artifacts) return;
    report.artifacts.forEach(artifact => {
      const key = artifact.path || artifact.name;
      if (!key) return;
      if (artifactPaths.has(key)) {
        conflictMap.push({
          type: 'artifact_conflict',
          code: 'DUPLICATE_ARTIFACT',
          message: `Artifact "${key}" produced by both ${artifactPaths.get(key)} and ${report.step_id}`,
          artifact: key,
          steps: [artifactPaths.get(key), report.step_id]
        });
      } else {
        artifactPaths.set(key, report.step_id);
      }
    });
  });

  return {
    pass: conflictMap.length === 0,
    conflictMap
  };
}
