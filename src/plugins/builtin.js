/**
 * 内置插件示例
 * 演示如何将现有 Agent 定义为插件
 */

import { createAgentPlugin } from './factory.js';
import { HOOK_POINTS } from './types.js';

/**
 * PPT 大师插件示例（演示用）
 * 实际实现在 projects/ppt-master/src/index.js
 */
export const pptMasterPlugin = createAgentPlugin({
  name: 'ppt-master',
  version: '1.0.0',
  definition: {
    name: 'PPT 大师',
    subtitle: '从需求到PPT，一键生成',
    icon: 'P',
    colorKey: 'purple',
    capabilities: ['文档分析', '大纲生成', 'SVG幻灯片设计', 'PPTX转换', '多模板支持'],
    systemPrompt: 'You are a PPT generation expert...',
  },
  capabilities: ['文档分析', '大纲生成', 'SVG幻灯片设计', 'PPTX转换', '多模板支持'],
  
  /**
   * 执行函数（动态加载实际实现）
   */
  async execute(task, options) {
    try {
      const { generatePPT } = await import('../../projects/ppt-master/src/index.js');
      return await generatePPT(task, options);
    } catch (error) {
      console.error('[PPTMasterPlugin] Error:', error);
      throw error;
    }
  },

  /**
   * 注册时回调
   */
  async onRegister({ pluginManager }) {
    console.log('[PPTMasterPlugin] Registered successfully');
  },

  /**
   * 激活时回调
   */
  async onActivate({ pluginManager }) {
    console.log('[PPTMasterPlugin] Activated');
  },
});

/**
 * 清扫者插件示例（演示用）
 */
export const cleanerPlugin = createAgentPlugin({
  name: 'cleaner',
  version: '1.0.0',
  definition: {
    name: '清扫者',
    subtitle: '智能清理系统垃圾',
    icon: 'C',
    colorKey: 'teal',
    capabilities: ['磁盘扫描', '垃圾文件识别', '安全清理', '空间统计', '清理报告'],
    systemPrompt: 'You are a disk cleaning expert...',
  },
  capabilities: ['磁盘扫描', '垃圾文件识别', '安全清理', '空间统计', '清理报告'],

  async execute(task, options) {
    try {
      const { cleanDisk } = await import('../../projects/cleaner/src/index.js');
      return await cleanDisk(task, options);
    } catch (error) {
      console.error('[CleanerPlugin] Error:', error);
      throw error;
    }
  },

  async onRegister() {
    console.log('[CleanerPlugin] Registered');
  },
});

/**
 * 生图插件示例（演示用）
 */
export const imageGenPlugin = createAgentPlugin({
  name: 'image-gen',
  version: '1.0.0',
  definition: {
    name: '生图',
    subtitle: 'AI图像生成',
    icon: 'I',
    colorKey: 'blue',
    capabilities: ['文生图', '异步任务轮询', '多尺寸支持', '自动命名', '批量生成'],
    systemPrompt: 'You are an image generation expert...',
  },
  capabilities: ['文生图', '异步任务轮询', '多尺寸支持', '自动命名', '批量生成'],

  async execute(task, options) {
    try {
      const { generateImage } = await import('../../projects/image-gen/src/image_gen.js');
      return await generateImage(task, options);
    } catch (error) {
      console.error('[ImageGenPlugin] Error:', error);
      throw error;
    }
  },

  async onRegister() {
    console.log('[ImageGenPlugin] Registered');
  },
});

/**
 * 注册所有内置插件
 * @param {PluginManager} manager - 插件管理器实例
 */
export async function registerBuiltinPlugins(manager) {
  try {
    await manager.register(pptMasterPlugin);
    await manager.register(cleanerPlugin);
    await manager.register(imageGenPlugin);
    
    console.log('[Plugins] Built-in plugins registered successfully');
  } catch (error) {
    console.error('[Plugins] Error registering built-in plugins:', error);
    throw error;
  }
}