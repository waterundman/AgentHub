/**
 * 插件工厂函数
 * 辅助创建符合规范的插件
 */

import { PLUGIN_TYPES } from './types.js';

/**
 * 创建Agent插件
 * @param {Object} config - 插件配置
 * @param {string} config.name - 插件名称
 * @param {string} config.version - 版本号
 * @param {Object} config.definition - Agent定义
 * @param {Function} config.execute - 执行函数
 * @param {string[]} [config.capabilities] - 能力列表
 * @returns {import('./types.js').AgentPlugin}
 */
export function createAgentPlugin(config) {
  return {
    name: config.name,
    version: config.version || '1.0.0',
    type: PLUGIN_TYPES.AGENT,
    displayName: config.definition?.name || config.name,
    description: config.definition?.subtitle || '',
    capabilities: config.capabilities || [],
    definition: config.definition,
    execute: config.execute,
    onRegister: config.onRegister,
    onActivate: config.onActivate,
    onDeactivate: config.onDeactivate,
  };
}

/**
 * 创建Provider插件
 * @param {Object} config - 插件配置
 * @param {string} config.name - 插件名称
 * @param {string} config.version - 版本号
 * @param {Function} config.getHeaders - 获取请求头
 * @param {Function} config.buildRequest - 构建请求体
 * @param {Function} config.parseResponse - 解析响应
 * @returns {import('./types.js').AgentPlugin}
 */
export function createProviderPlugin(config) {
  return {
    name: config.name,
    version: config.version || '1.0.0',
    type: PLUGIN_TYPES.PROVIDER,
    displayName: config.displayName || config.name,
    description: config.description || '',
    execute: config.execute,
    getHeaders: config.getHeaders,
    buildRequest: config.buildRequest,
    parseResponse: config.parseResponse,
    onRegister: config.onRegister,
  };
}

/**
 * 创建Tool插件
 * @param {Object} config - 插件配置
 * @param {string} config.name - 插件名称
 * @param {string} config.version - 版本号
 * @param {string} config.toolName - 工具名称
 * @param {Function} config.execute - 执行函数
 * @returns {import('./types.js').AgentPlugin}
 */
export function createToolPlugin(config) {
  return {
    name: config.name,
    version: config.version || '1.0.0',
    type: PLUGIN_TYPES.TOOL,
    displayName: config.displayName || config.name,
    description: config.description || '',
    toolName: config.toolName,
    execute: config.execute,
    onRegister: config.onRegister,
  };
}

/**
 * 创建Storage插件
 * @param {Object} config - 插件配置
 * @param {string} config.name - 插件名称
 * @param {string} config.version - 版本号
 * @param {Function} config.get - 获取数据
 * @param {Function} config.set - 设置数据
 * @returns {import('./types.js').AgentPlugin}
 */
export function createStoragePlugin(config) {
  return {
    name: config.name,
    version: config.version || '1.0.0',
    type: PLUGIN_TYPES.STORAGE,
    displayName: config.displayName || config.name,
    description: config.description || '',
    get: config.get,
    set: config.set,
    onRegister: config.onRegister,
  };
}