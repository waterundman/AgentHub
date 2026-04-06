/**
 * 插件管理器
 * 负责插件的注册、激活、执行和生命周期管理
 */

import { globalHooks, PluginHooks } from './hooks.js';
import { PLUGIN_TYPES, HOOK_POINTS } from './types.js';

class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.agentExecutors = new Map();
    this.providerPlugins = new Map();
    this.toolPlugins = new Map();
    this.storagePlugins = new Map();
    this.hooks = globalHooks;
    this.status = new Map();
  }

  /**
   * 注册插件
   * @param {import('./types.js').AgentPlugin} plugin - 插件对象
   * @returns {boolean} 是否成功
   */
  async register(plugin) {
    if (!this.validatePlugin(plugin)) {
      console.error('[PluginManager] Invalid plugin structure:', plugin);
      return false;
    }

    if (this.plugins.has(plugin.name)) {
      console.warn(`[PluginManager] Plugin "${plugin.name}" already registered`);
      return false;
    }

    this.plugins.set(plugin.name, plugin);
    this.status.set(plugin.name, 'registered');

    await this.hooks.emit(HOOK_POINTS.PLUGIN_REGISTER, { plugin });

    if (plugin.onRegister) {
      try {
        await plugin.onRegister({ pluginManager: this });
      } catch (error) {
        console.error(`[PluginManager] Error in onRegister for "${plugin.name}":`, error);
      }
    }

    this._indexPlugin(plugin);
    console.log(`[PluginManager] Plugin "${plugin.name}" registered successfully`);
    return true;
  }

  /**
   * 激活插件
   * @param {string} pluginName - 插件名称
   * @returns {boolean} 是否成功
   */
  async activate(pluginName) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      console.error(`[PluginManager] Plugin "${pluginName}" not found`);
      return false;
    }

    if (this.status.get(pluginName) === 'active') {
      return true;
    }

    await this.hooks.emit(HOOK_POINTS.PLUGIN_ACTIVATE, { pluginName });

    if (plugin.onActivate) {
      try {
        await plugin.onActivate({ pluginManager: this });
      } catch (error) {
        console.error(`[PluginManager] Error in onActivate for "${pluginName}":`, error);
        return false;
      }
    }

    this.status.set(pluginName, 'active');
    console.log(`[PluginManager] Plugin "${pluginName}" activated`);
    return true;
  }

  /**
   * 停用插件
   * @param {string} pluginName - 插件名称
   * @returns {boolean} 是否成功
   */
  async deactivate(pluginName) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      console.error(`[PluginManager] Plugin "${pluginName}" not found`);
      return false;
    }

    await this.hooks.emit(HOOK_POINTS.PLUGIN_DEACTIVATE, { pluginName });

    if (plugin.onDeactivate) {
      try {
        await plugin.onDeactivate({ pluginManager: this });
      } catch (error) {
        console.error(`[PluginManager] Error in onDeactivate for "${pluginName}":`, error);
      }
    }

    this.status.set(pluginName, 'inactive');
    console.log(`[PluginManager] Plugin "${pluginName}" deactivated`);
    return true;
  }

  /**
   * 获取插件
   * @param {string} pluginName - 插件名称
   * @returns {import('./types.js').AgentPlugin|undefined}
   */
  get(pluginName) {
    return this.plugins.get(pluginName);
  }

  /**
   * 获取所有插件
   * @returns {Map<string, import('./types.js').AgentPlugin>}
   */
  getAll() {
    return this.plugins;
  }

  /**
   * 根据能力获取Agent插件
   * @param {string} capability - 能力名称
   * @returns {import('./types.js').AgentPlugin[]}
   */
  getAgentsByCapability(capability) {
    const agents = [];
    for (const [name, plugin] of this.agentExecutors) {
      if (plugin.capabilities && plugin.capabilities.includes(capability)) {
        agents.push(plugin);
      }
    }
    return agents;
  }

  /**
   * 执行Agent插件
   * @param {string} agentName - Agent名称
   * @param {string} task - 任务描述
   * @param {Object} options - 执行选项
   * @returns {Promise<any>}
   */
  async executeAgent(agentName, task, options = {}) {
    const plugin = this.agentExecutors.get(agentName);
    if (!plugin) {
      throw new Error(`[PluginManager] Agent plugin "${agentName}" not found`);
    }

    if (this.status.get(plugin.name) !== 'active') {
      await this.activate(plugin.name);
    }

    const context = {
      agentName,
      task,
      options,
      plugin,
      timestamp: Date.now(),
    };

    await this.hooks.emit(HOOK_POINTS.AGENT_BEFORE_EXECUTE, context);

    let result;
    try {
      result = await plugin.execute(task, { ...options, agent: plugin.definition });
      context.result = result;
    } catch (error) {
      context.error = error;
      throw error;
    }

    await this.hooks.emit(HOOK_POINTS.AGENT_AFTER_EXECUTE, context);
    return result;
  }

  /**
   * 验证插件结构
   * @param {Object} plugin - 插件对象
   * @returns {boolean}
   */
  validatePlugin(plugin) {
    if (!plugin || typeof plugin !== 'object') return false;
    if (!plugin.name || typeof plugin.name !== 'string') return false;
    if (!plugin.version || typeof plugin.version !== 'string') return false;
    if (!plugin.type || !Object.values(PLUGIN_TYPES).includes(plugin.type)) return false;
    if (plugin.execute && typeof plugin.execute !== 'function') return false;
    if (plugin.onRegister && typeof plugin.onRegister !== 'function') return false;
    if (plugin.onActivate && typeof plugin.onActivate !== 'function') return false;
    if (plugin.onDeactivate && typeof plugin.onDeactivate !== 'function') return false;
    return true;
  }

  /**
   * 内部索引方法
   */
  _indexPlugin(plugin) {
    switch (plugin.type) {
      case PLUGIN_TYPES.AGENT:
        if (plugin.definition) {
          this.agentExecutors.set(plugin.definition.name || plugin.name, plugin);
        }
        break;
      case PLUGIN_TYPES.PROVIDER:
        this.providerPlugins.set(plugin.name, plugin);
        break;
      case PLUGIN_TYPES.TOOL:
        this.toolPlugins.set(plugin.name, plugin);
        break;
      case PLUGIN_TYPES.STORAGE:
        this.storagePlugins.set(plugin.name, plugin);
        break;
    }
  }
}

export const pluginManager = new PluginManager();
export default PluginManager;