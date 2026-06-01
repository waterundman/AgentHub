import { REPORT_STATUS } from '../../types/stepReport';

export function verifyGoal(goalContract, stepReports) {
  const unmetClauses = [];

  if (!goalContract) {
    return { pass: false, unmetClauses: [{ clause: null, index: -1, reason: 'No goal contract provided' }] };
  }

  if (!goalContract.success_definition || goalContract.success_definition.length === 0) {
    return { pass: true, unmetClauses };
  }

  const reports = stepReports || [];

  // Collect all evidence and summaries from successful reports
  const successfulEvidence = [];
  reports.forEach(report => {
    if (report.status === REPORT_STATUS.COMPLETED || report.status === REPORT_STATUS.PARTIAL) {
      if (report.evidence) {
        report.evidence.forEach(e => successfulEvidence.push(e.summary || e.description || e.criterion || ''));
      }
      if (report.summary) {
        successfulEvidence.push(report.summary);
      }
      if (report.artifacts) {
        report.artifacts.forEach(a => {
          if (a.name) successfulEvidence.push(a.name);
          if (a.description) successfulEvidence.push(a.description);
        });
      }
    }
  });

  // Check each success_definition clause
  goalContract.success_definition.forEach((clause, index) => {
    const clauseLower = clause.toLowerCase();
    const matched = successfulEvidence.some(evidence => {
      const evidenceLower = evidence.toLowerCase();
      // Simple keyword overlap matching
      const clauseWords = clauseLower.split(/\s+/).filter(w => w.length > 2);
      const matchedWords = clauseWords.filter(w => evidenceLower.includes(w));
      return matchedWords.length >= Math.ceil(clauseWords.length * 0.5);
    });

    if (!matched) {
      // Also check if any single report fully addresses this clause
      const directMatch = reports.some(report => {
        if (report.status !== REPORT_STATUS.COMPLETED && report.status !== REPORT_STATUS.PARTIAL) return false;
        const text = (report.summary || '').toLowerCase();
        return text.includes(clauseLower) || clauseLower.includes(text);
      });

      if (!directMatch) {
        unmetClauses.push({
          clause,
          index,
          reason: `No step report provides evidence for: "${clause}"`
        });
      }
    }
  });

  // Check non_goals violations
  if (goalContract.non_goals && goalContract.non_goals.length > 0) {
    goalContract.non_goals.forEach((nonGoal, index) => {
      const nonGoalLower = nonGoal.toLowerCase();
      const violated = reports.some(report => {
        if (report.status !== REPORT_STATUS.COMPLETED) return false;
        const text = (report.summary || '').toLowerCase();
        return text.includes(nonGoalLower);
      });
      if (violated) {
        unmetClauses.push({
          clause: `[NON-GOAL VIOLATION] ${nonGoal}`,
          index,
          reason: `Non-goal "${nonGoal}" appears to have been violated`
        });
      }
    });
  }

  return {
    pass: unmetClauses.length === 0,
    unmetClauses
  };
}
