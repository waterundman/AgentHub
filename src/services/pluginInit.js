/**
 * 插件系统初始化
 * 在应用启动时调用
 */

import { pluginManager } from '../plugins/index.js';
import { initProjectAgents } from './projectAgents.js';

let initialized = false;

/**
 * 初始化插件系统
 * 注册所有内置插件并激活
 */
export async function initializePlugins() {
  if (initialized) {
    console.log('[PluginInit] Already initialized');
    return;
  }

  try {
    console.log('[PluginInit] Starting plugin system initialization...');
    
    // 初始化项目 Agent 到插件系统
    await initProjectAgents(pluginManager);
    
    // 激活所有已注册的插件
    const plugins = Array.from(pluginManager.getAll().keys());
    for (const pluginName of plugins) {
      try {
        await pluginManager.activate(pluginName);
      } catch (error) {
        console.error(`[PluginInit] Failed to activate plugin ${pluginName}:`, error);
      }
    }
    
    initialized = true;
    console.log('[PluginInit] Plugin system initialized successfully');
    console.log(`[PluginInit] ${plugins.length} plugins loaded:`, plugins);
    
  } catch (error) {
    console.error('[PluginInit] Plugin system initialization failed:', error);
    throw error;
  }
}

/**
 * 获取插件管理器实例
 */
export function getPluginManager() {
  return pluginManager;
}

/**
 * 检查插件系统是否已初始化
 */
export function isPluginSystemInitialized() {
  return initialized;
}