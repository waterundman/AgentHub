/**
 * 插件系统入口文件
 * 导出所有插件相关的类、函数和常量
 */

export { pluginManager, default as PluginManager } from './index.js';
export { PluginHooks, globalHooks } from './hooks.js';
export { PLUGIN_TYPES, HOOK_POINTS } from './types.js';
export {
  createAgentPlugin,
  createProviderPlugin,
  createToolPlugin,
  createStoragePlugin,
} from './factory.js';