import { useHandoffStore, RULE_TYPES } from '../store/useHandoffStore';

export { RULE_TYPES };

const DEFAULT_RULES = [
  {
    name: '输入长度限制',
    type: RULE_TYPES.INPUT_LENGTH,
    config: { maxLength: 10000 },
    enabled: true,
  },
  {
    name: '输出长度限制',
    type: RULE_TYPES.OUTPUT_LENGTH,
    config: { maxLength: 50000 },
    enabled: true,
  },
];

let initialized = false;

function ensureDefaults() {
  if (initialized) return;
  const { guardrailRules, addGuardrailRule } = useHandoffStore.getState();
  if (guardrailRules.length === 0) {
    DEFAULT_RULES.forEach(r => addGuardrailRule(r));
  }
  initialized = true;
}

export function addGuardrailRule(rule) {
  if (!rule.name || !rule.type) throw new Error('规则必须包含 name 和 type');
  return useHandoffStore.getState().addGuardrailRule(rule);
}

export function removeGuardrailRule(ruleId) {
  useHandoffStore.getState().removeGuardrailRule(ruleId);
}

export function validateInput(agentHash, input) {
  ensureDefaults();
  const rules = useHandoffStore.getState().getGuardrailRules();
  const errors = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;

    switch (rule.type) {
      case RULE_TYPES.INPUT_LENGTH:
        if (typeof input === 'string' && input.length > (rule.config.maxLength || Infinity)) {
          errors.push({
            rule: rule.name,
            message: `输入超过最大长度限制 (${rule.config.maxLength})`,
          });
        }
        break;

      case RULE_TYPES.CONTENT_FILTER: {
        const text = typeof input === 'string' ? input : JSON.stringify(input);
        const blocked = rule.config.blockedWords || [];
        for (const word of blocked) {
          if (text.includes(word)) {
            errors.push({
              rule: rule.name,
              message: `输入包含被过滤的内容: "${word}"`,
            });
            break;
          }
        }
        break;
      }

      case RULE_TYPES.CUSTOM:
        if (rule.config.validator && typeof rule.config.validator === 'function') {
          const result = rule.config.validator(agentHash, input);
          if (result !== true) {
            errors.push({ rule: rule.name, message: result || '自定义验证失败' });
          }
        }
        break;
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateOutput(agentHash, output) {
  ensureDefaults();
  const rules = useHandoffStore.getState().getGuardrailRules();
  const errors = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;

    switch (rule.type) {
      case RULE_TYPES.OUTPUT_LENGTH:
        if (typeof output === 'string' && output.length > (rule.config.maxLength || Infinity)) {
          errors.push({
            rule: rule.name,
            message: `输出超过最大长度限制 (${rule.config.maxLength})`,
          });
        }
        break;

      case RULE_TYPES.CONTENT_FILTER: {
        const text = typeof output === 'string' ? output : JSON.stringify(output);
        const blocked = rule.config.blockedWords || [];
        for (const word of blocked) {
          if (text.includes(word)) {
            errors.push({
              rule: rule.name,
              message: `输出包含被过滤的内容: "${word}"`,
            });
            break;
          }
        }
        break;
      }

      case RULE_TYPES.CUSTOM:
        if (rule.config.outputValidator && typeof rule.config.outputValidator === 'function') {
          const result = rule.config.outputValidator(agentHash, output);
          if (result !== true) {
            errors.push({ rule: rule.name, message: result || '自定义验证失败' });
          }
        }
        break;
    }
  }

  return { valid: errors.length === 0, errors };
}

export function getGuardrailRules() {
  ensureDefaults();
  return useHandoffStore.getState().getGuardrailRules();
}
