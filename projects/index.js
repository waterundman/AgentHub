/**
 * AgentHub 项目 Agent 统一接口
 * 所有项目 Agent 通过此模块导出，符合 AgentHub 开发范式
 */

export { PPT_MASTER_AGENT, analyzeDocument, generatePPT } from "./ppt-master/src";
export { CLEANER_AGENT, scanPaths, cleanPaths } from "./cleaner/src";
export { IMAGE_GEN_AGENT, generateImage, generateBatch } from "./image-gen/src";

export const PROJECT_REGISTRY = {
  "ppt-master": {
    agent: "PPT_MASTER_AGENT",
    entry: "./ppt-master/src",
    capabilities: ["文档分析", "大纲生成", "SVG 幻灯片设计", "PPTX 转换", "多模板支持"],
  },
  "cleaner": {
    agent: "CLEANER_AGENT",
    entry: "./cleaner/src",
    capabilities: ["磁盘扫描", "垃圾文件识别", "安全清理", "空间统计", "清理报告"],
  },
  "image-gen": {
    agent: "IMAGE_GEN_AGENT",
    entry: "./image-gen/src",
    capabilities: ["文生图", "异步任务轮询", "多尺寸支持", "自动命名", "批量生成"],
  },
};
