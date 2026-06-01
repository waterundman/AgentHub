/**
 * 转写规则定义
 * 支持多种外部Agent项目格式的导入
 */

// 预定义转写规则
export const TRANSCRIPTION_RULES = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    description: '从Claude Code项目导入',
    sourceFormat: 'claude-code',
    matchers: [
      { type: 'file', pattern: '.claude/settings.json' },
      { type: 'file', pattern: '.claude/prompts/*.md' },
      { type: 'file', pattern: '.claude/*.md' },
    ],
    transformers: [
      { field: 'name', source: 'settings.project_name', transform: 'string' },
      { field: 'agents', source: 'prompts', transform: 'mapPrompts' },
    ],
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    description: '从OpenCode项目导入',
    sourceFormat: 'opencode',
    matchers: [
      { type: 'file', pattern: 'opencode.json' },
      { type: 'file', pattern: 'opencode.jsonc' },
      { type: 'file', pattern: '.opencode/*.json' },
    ],
    transformers: [
      { field: 'name', source: 'project', transform: 'string' },
      { field: 'agents', source: 'agents', transform: 'mapAgents' },
    ],
  },
  {
    id: 'cursor',
    name: 'Cursor',
    description: '从Cursor项目导入',
    sourceFormat: 'cursor',
    matchers: [
      { type: 'file', pattern: '.cursorrules' },
      { type: 'file', pattern: '.cursor/rules/*' },
    ],
    transformers: [
      { field: 'name', source: 'filename', transform: 'string' },
      { field: 'agents', source: 'rules', transform: 'mapCursorRules' },
    ],
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    description: '从Windsurf项目导入',
    sourceFormat: 'windsurf',
    matchers: [
      { type: 'file', pattern: '.windsurfrules' },
      { type: 'file', pattern: '.windsurf/*' },
    ],
    transformers: [
      { field: 'name', source: 'filename', transform: 'string' },
      { field: 'agents', source: 'rules', transform: 'mapWindsurfRules' },
    ],
  },
  {
    id: 'markdown',
    name: 'Markdown',
    description: '从Markdown文档导入',
    sourceFormat: 'markdown',
    matchers: [
      { type: 'file', pattern: '*.md' },
      { type: 'content', pattern: '# Agent.*' },
      { type: 'content', pattern: '# System Prompt.*' },
    ],
    transformers: [
      { field: 'name', source: 'title', transform: 'string' },
      { field: 'agents', source: 'sections', transform: 'mapMarkdownSections' },
    ],
  },
  {
    id: 'autogpt',
    name: 'AutoGPT',
    description: '从AutoGPT配置导入',
    sourceFormat: 'autogpt',
    matchers: [
      { type: 'file', pattern: 'ai_settings.yaml' },
      { type: 'file', pattern: 'ai_settings.yml' },
      { type: 'file', pattern: '.autogpt/*' },
    ],
    transformers: [
      { field: 'name', source: 'ai_name', transform: 'string' },
      { field: 'agents', source: 'agents', transform: 'mapAutoGPTAgents' },
    ],
  },
  {
    id: 'langchain',
    name: 'LangChain',
    description: '从LangChain Python脚本导入',
    sourceFormat: 'langchain',
    matchers: [
      { type: 'file', pattern: '*.py' },
      { type: 'content', pattern: 'from langchain.*import.*Agent' },
      { type: 'content', pattern: 'from langchain.*import.*LLMChain' },
    ],
    transformers: [
      { field: 'name', source: 'filename', transform: 'string' },
      { field: 'agents', source: 'agent_definitions', transform: 'mapLangChainAgents' },
    ],
  },
  {
    id: 'crewai',
    name: 'CrewAI',
    description: '从CrewAI项目导入',
    sourceFormat: 'crewai',
    matchers: [
      { type: 'file', pattern: 'crew.py' },
      { type: 'file', pattern: 'agents.yaml' },
      { type: 'content', pattern: 'from crewai.*import.*Agent' },
    ],
    transformers: [
      { field: 'name', source: 'crew_name', transform: 'string' },
      { field: 'agents', source: 'agents', transform: 'mapCrewAIAgents' },
    ],
  },
  {
    id: 'autogen',
    name: 'AutoGen',
    description: '从AutoGen项目导入',
    sourceFormat: 'autogen',
    matchers: [
      { type: 'file', pattern: 'autogen_config.json' },
      { type: 'content', pattern: 'from autogen.*import.*AssistantAgent' },
    ],
    transformers: [
      { field: 'name', source: 'project', transform: 'string' },
      { field: 'agents', source: 'agents', transform: 'mapAutoGenAgents' },
    ],
  },
  {
    id: 'generic-json',
    name: 'Generic JSON',
    description: '从通用JSON配置导入',
    sourceFormat: 'generic-json',
    matchers: [
      { type: 'file', pattern: 'agents.json' },
      { type: 'file', pattern: 'agent-config.json' },
      { type: 'file', pattern: 'config.json' },
    ],
    transformers: [
      { field: 'name', source: 'name', transform: 'string' },
      { field: 'agents', source: 'agents', transform: 'mapGenericAgents' },
    ],
  },
];

/**
 * 根据格式获取规则
 * @param {string} format - 源格式
 * @returns {Object|undefined} 匹配的规则
 */
export function getRuleByFormat(format) {
  return TRANSCRIPTION_RULES.find(r => r.sourceFormat === format);
}

/**
 * 获取所有规则
 * @returns {Array} 规则列表
 */
export function getRules() {
  return TRANSCRIPTION_RULES;
}

/**
 * 获取支持的格式列表
 * @returns {Array} 格式列表
 */
export function getSupportedFormats() {
  return TRANSCRIPTION_RULES.map(r => ({
    id: r.sourceFormat,
    name: r.name,
    description: r.description,
  }));
}
