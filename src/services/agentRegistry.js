export const AGENT_TYPES = {
  REPO_RESEARCHER: 'repo_researcher',
  CODE_WRITER: 'code_writer',
  TEST_RUNNER: 'test_runner',
  CODE_REVIEWER: 'code_reviewer',
  INTEGRATION_AGENT: 'integration_agent',
  DOC_WRITER: 'doc_writer',
  SECURITY_REVIEWER: 'security_reviewer'
};

export const PERMISSION_MODE = {
  STRICT: 'strict',
  INTERACTIVE: 'interactive',
  PLAN_ONLY: 'plan_only'
};

const registry = new Map();

export function registerAgent(agentDef) {
  const errors = [];
  if (!agentDef.type) errors.push('type is required');
  if (!agentDef.name) errors.push('name is required');
  if (!agentDef.capabilities || !agentDef.capabilities.length) errors.push('capabilities must be a non-empty array');

  if (errors.length > 0) {
    throw new Error(`Agent validation failed: ${errors.join(', ')}`);
  }

  const agent = {
    type: agentDef.type,
    name: agentDef.name,
    description: agentDef.description || '',
    capabilities: agentDef.capabilities,
    permission_mode: agentDef.permission_mode || PERMISSION_MODE.INTERACTIVE,
    max_retries: agentDef.max_retries ?? 3,
    timeout_ms: agentDef.timeout_ms ?? 30000,
    created_at: new Date().toISOString()
  };

  registry.set(agent.type, agent);
  return agent;
}

export function getAgentByType(type) {
  return registry.get(type) || null;
}

export function getAllAgents() {
  return Array.from(registry.values());
}

export function unregisterAgent(type) {
  return registry.delete(type);
}

export function clearRegistry() {
  registry.clear();
}

export function initBuiltinAgents() {
  const builtins = [
    {
      type: AGENT_TYPES.REPO_RESEARCHER,
      name: 'Repository Researcher',
      description: 'Analyzes codebase structure, dependencies, and patterns',
      capabilities: ['code_search', 'dependency_analysis', 'pattern_detection']
    },
    {
      type: AGENT_TYPES.CODE_WRITER,
      name: 'Code Writer',
      description: 'Generates and modifies source code',
      capabilities: ['code_generation', 'refactoring', 'file_editing']
    },
    {
      type: AGENT_TYPES.TEST_RUNNER,
      name: 'Test Runner',
      description: 'Executes tests and reports results',
      capabilities: ['test_execution', 'coverage_analysis', 'flaky_detection']
    },
    {
      type: AGENT_TYPES.CODE_REVIEWER,
      name: 'Code Reviewer',
      description: 'Reviews code for quality, style, and correctness',
      capabilities: ['code_review', 'style_check', 'complexity_analysis']
    },
    {
      type: AGENT_TYPES.INTEGRATION_AGENT,
      name: 'Integration Agent',
      description: 'Handles merge conflicts and integration tasks',
      capabilities: ['merge_resolution', 'ci_setup', 'deployment']
    },
    {
      type: AGENT_TYPES.DOC_WRITER,
      name: 'Documentation Writer',
      description: 'Generates and updates documentation',
      capabilities: ['doc_generation', 'readme_update', 'api_docs']
    },
    {
      type: AGENT_TYPES.SECURITY_REVIEWER,
      name: 'Security Reviewer',
      description: 'Scans for vulnerabilities and security issues',
      capabilities: ['vulnerability_scan', 'dependency_audit', 'secrets_detection']
    }
  ];

  for (const def of builtins) {
    if (!registry.has(def.type)) {
      registerAgent(def);
    }
  }

  return getAllAgents();
}
