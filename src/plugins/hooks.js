/**
 * 钩子系统
 * 支持在关键点插入自定义逻辑
 */

export class PluginHooks {
  constructor() {
    this.hooks = {};
  }

  /**
   * 注册钩子监听器
   * @param {string} hookName - 钩子名称
   * @param {Function} callback - 回调函数
   * @param {number} priority - 优先级 (越小越先执行)
   * @returns {Function} 取消注册函数
   */
  on(hookName, callback, priority = 100) {
    if (!this.hooks[hookName]) {
      this.hooks[hookName] = [];
    }
    
    const hook = { callback, priority };
    this.hooks[hookName].push(hook);
    this.hooks[hookName].sort((a, b) => a.priority - b.priority);
    
    return () => this.off(hookName, callback);
  }

  /**
   * 移除钩子监听器
   * @param {string} hookName - 钩子名称
   * @param {Function} callback - 回调函数
   */
  off(hookName, callback) {
    if (!this.hooks[hookName]) return;
    this.hooks[hookName] = this.hooks[hookName].filter(h => h.callback !== callback);
  }

  /**
   * 触发钩子 (异步串行)
   * @param {string} hookName - 钩子名称
   * @param {Object} context - 上下文数据
   * @returns {Promise<void>}
   */
  async emit(hookName, context) {
    const hooks = this.hooks[hookName];
    if (!hooks || hooks.length === 0) return;
    
    for (const hook of hooks) {
      try {
        await hook.callback(context);
      } catch (error) {
        console.error(`[PluginHooks] Error in hook ${hookName}:`, error);
      }
    }
  }

  /**
   * 触发钩子 (瀑布流，可修改数据)
   * @param {string} hookName - 钩子名称
   * @param {Object} data - 数据对象
   * @returns {Promise<Object>} 修改后的数据
   */
  async emitWaterfall(hookName, data) {
    const hooks = this.hooks[hookName];
    if (!hooks || hooks.length === 0) return data;
    
    let result = data;
    for (const hook of hooks) {
      try {
        result = await hook.callback(result);
      } catch (error) {
        console.error(`[PluginHooks] Error in waterfall hook ${hookName}:`, error);
      }
    }
    return result;
  }

  /**
   * 触发钩子 (异步并行)
   * @param {string} hookName - 钩子名称
   * @param {Object} context - 上下文数据
   * @returns {Promise<void>}
   */
  async emitParallel(hookName, context) {
    const hooks = this.hooks[hookName];
    if (!hooks || hooks.length === 0) return;
    
    await Promise.all(hooks.map(hook => 
      hook.callback(context).catch(error => 
        console.error(`[PluginHooks] Error in parallel hook ${hookName}:`, error)
      )
    ));
  }

  /**
   * 清空所有钩子
   */
  clear() {
    this.hooks = {};
  }

  /**
   * 获取所有已注册的钩子
   */
  getRegisteredHooks() {
    return Object.keys(this.hooks);
  }
}

export const globalHooks = new PluginHooks();