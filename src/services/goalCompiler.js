import { createGoalContract } from '../types/goalContract';

function extractSuccessDefinition(text) {
  const markers = ['成功标准', 'success criteria', '成功条件', '目标是', '需要完成'];
  let definitionSection = text;

  for (const marker of markers) {
    const idx = text.toLowerCase().indexOf(marker);
    if (idx !== -1) {
      definitionSection = text.slice(idx + marker.length);
      break;
    }
  }

  return definitionSection
    .split(/[;；\n]/)
    .map(s => s.trim())
    .filter(Boolean);
}

function extractNonGoals(text) {
  const markers = ['不需要', '不包括', '非目标', 'excluding', 'non-goals'];
  for (const marker of markers) {
    const idx = text.toLowerCase().indexOf(marker);
    if (idx !== -1) {
      const section = text.slice(idx + marker.length);
      return section
        .split(/[;；\n,，]/)
        .map(s => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function extractConstraints(text) {
  const constraints = {};
  if (/仅限?前端|frontend.only/i.test(text)) constraints.scope = 'frontend';
  if (/仅限?后端|backend.only/i.test(text)) constraints.scope = 'backend';
  if (/不修改数据库|no.db/i.test(text)) constraints.no_db_changes = true;
  if (/保持向后兼容|backward.compat/i.test(text)) constraints.backward_compatible = true;
  return constraints;
}

export function compileGoal(userInput) {
  const success_definition = extractSuccessDefinition(userInput);
  const non_goals = extractNonGoals(userInput);
  const constraints = extractConstraints(userInput);

  return createGoalContract({
    goal_text: userInput,
    success_definition,
    non_goals,
    constraints
  });
}
