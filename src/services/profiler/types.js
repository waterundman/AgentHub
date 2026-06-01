/**
 * Agent画像数据结构定义
 * 五层评述框架：工具层、Skill层、行为层、能力层、专业化层
 */

/**
 * 工具层数据结构
 * @typedef {Object} ToolLayer
 * @property {Array} tools - 工具列表
 * @property {Object} categories - 工具分类统计
 * @property {Object} sources - 工具来源统计（内置/插件/自定义）
 * @property {number} totalCount - 工具总数
 * @property {number} uniqueCount - 唯一工具数
 */
export const createToolLayer = () => ({
  tools: [],
  categories: {},
  sources: { builtin: 0, plugin: 0, custom: 0 },
  totalCount: 0,
  uniqueCount: 0
});

/**
 * Skill层数据结构
 * @typedef {Object} SkillLayer
 * @property {Array} skills - Skill列表
 * @property {Object} domains - 领域分布
 * @property {number} averageDepth - 平均深度
 * @property {number} maxDepth - 最大深度
 * @property {Array} topSkills - 顶级技能
 */
export const createSkillLayer = () => ({
  skills: [],
  domains: {},
  averageDepth: 0,
  maxDepth: 0,
  topSkills: []
});

/**
 * 行为层数据结构
 * @typedef {Object} BehaviorLayer
 * @property {Object} callFrequency - 调用频率统计
 * @property {Array} sequencePatterns - 顺序模式
 * @property {Array} combinationPatterns - 组合模式
 * @property {number} totalCalls - 总调用次数
 * @property {number} averageCallDuration - 平均调用时长
 */
export const createBehaviorLayer = () => ({
  callFrequency: {},
  sequencePatterns: [],
  combinationPatterns: [],
  totalCalls: 0,
  averageCallDuration: 0
});

/**
 * 能力层数据结构
 * @typedef {Object} CapabilityLayer
 * @property {Object} coverage - 能力覆盖
 * @property {Object} depth - 能力深度
 * @property {Array} boundaries - 能力边界
 * @property {number} overallScore - 综合能力评分
 */
export const createCapabilityLayer = () => ({
  coverage: {},
  depth: {},
  boundaries: [],
  gaps: [],
  overallScore: 0
});

/**
 * 专业化层数据结构
 * @typedef {Object} SpecializationLayer
 * @property {number} specializationIndex - 专业化指数 (0-1)
 * @property {Array} expertAreas - 擅长领域
 * @property {Array} uniqueCapabilities - 独特能力
 * @property {string} primaryFocus - 主要专注点
 */
export const createSpecializationLayer = () => ({
  specializationIndex: 0,
  expertAreas: [],
  uniqueCapabilities: [],
  primaryFocus: ''
});

/**
 * 完整Agent画像
 * @typedef {Object} AgentProfile
 * @property {string} agentHash - Agent哈希值
 * @property {string} agentName - Agent名称
 * @property {number} timestamp - 画像生成时间
 * @property {ToolLayer} toolLayer - 工具层
 * @property {SkillLayer} skillLayer - Skill层
 * @property {BehaviorLayer} behaviorLayer - 行为层
 * @property {CapabilityLayer} capabilityLayer - 能力层
 * @property {SpecializationLayer} specializationLayer - 专业化层
 */
export const createAgentProfile = (agentHash, agentName) => ({
  agentHash,
  agentName,
  timestamp: Date.now(),
  toolLayer: createToolLayer(),
  skillLayer: createSkillLayer(),
  behaviorLayer: createBehaviorLayer(),
  capabilityLayer: createCapabilityLayer(),
  specializationLayer: createSpecializationLayer()
});

/**
 * 画像对比结果
 * @typedef {Object} ProfileComparison
 * @property {string} profile1Hash - 画像1的Agent哈希
 * @property {string} profile2Hash - 画像2的Agent哈希
 * @property {Object} toolDiff - 工具层差异
 * @property {Object} skillDiff - Skill层差异
 * @property {Object} behaviorDiff - 行为层差异
 * @property {Object} capabilityDiff - 能力层差异
 * @property {Object} specializationDiff - 专业化层差异
 * @property {number} similarity - 相似度评分 (0-1)
 */
export const createProfileComparison = (profile1Hash, profile2Hash) => ({
  profile1Hash,
  profile2Hash,
  toolDiff: {},
  skillDiff: {},
  behaviorDiff: {},
  capabilityDiff: {},
  specializationDiff: {},
  similarity: 0
});
