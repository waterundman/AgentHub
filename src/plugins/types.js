/**
 * 插件类型定义
 * @typedef {Object} AgentPlugin
 * @property {string} name - 插件唯一标识
 * @property {string} version - 版本号 (semver)
 * @property {string} type - 插件类型: 'agent' | 'provider' | 'tool' | 'storage' | 'ui'
 * @property {string} displayName - 显示名称
 * @property {string} description - 插件描述
 * @property {string[]} capabilities - 能力列表
 * @property {Object} definition - Agent定义 (type为agent时)
 * @property {Function} execute - 执行函数
 * @property {Function} onRegister - 注册时回调 (可选)
 * @property {Function} onActivate - 激活时回调 (可选)
 * @property {Function} onDeactivate - 停用时回调 (可选)
 */

/**
 * 钩子上下文类型
 * @typedef {Object} HookContext
 * @property {string} hook - 钩子名称
 * @property {Object} data - 钩子数据
 * @property {Function} next - 调用下一个钩子
 */

export const PLUGIN_TYPES = {
  AGENT: 'agent',
  PROVIDER: 'provider',
  TOOL: 'tool',
  STORAGE: 'storage',
  UI: 'ui',
};

export const HOOK_POINTS = {
  PLUGIN_REGISTER: 'plugin:register',
  PLUGIN_ACTIVATE: 'plugin:activate',
  PLUGIN_DEACTIVATE: 'plugin:deactivate',
  
  AGENT_BEFORE_EXECUTE: 'agent:beforeExecute',
  AGENT_AFTER_EXECUTE: 'agent:afterExecute',
  
  PIPELINE_START: 'pipeline:start',
  PIPELINE_END: 'pipeline:end',
  PIPELINE_AGENT_START: 'pipeline:agentStart',
  PIPELINE_AGENT_END: 'pipeline:agentEnd',
  
  PROVIDER_BEFORE_CALL: 'provider:beforeCall',
  PROVIDER_AFTER_CALL: 'provider:afterCall',
  
  STORAGE_BEFORE_SAVE: 'storage:beforeSave',
  STORAGE_AFTER_LOAD: 'storage:afterLoad',
};