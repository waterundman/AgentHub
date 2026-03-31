/**
 * @typedef {Object} Agent
 * @property {string} hash - 唯一 SHA-256 身份哈希
 * @property {string} name - Agent 名称
 * @property {string} subtitle - 副标题
 * @property {string} icon - 图标字符
 * @property {ColorKey} colorKey - 颜色键
 * @property {string} systemPrompt - 系统提示词
 * @property {string} [description] - 描述
 * @property {string} [version] - 版本号
 * @property {string} [source] - 来源路径
 * @property {string[]} [capabilities] - 能力列表
 * @property {Object} [config] - 配置对象
 */

/**
 * @typedef {Object} Version
 * @property {string} sha - 短哈希 (7 字符)
 * @property {string} fullSha - 完整 SHA-256 哈希
 * @property {string} message - 提交备注
 * @property {number} ts - 时间戳
 * @property {string} name - Agent 名称
 * @property {string} systemPrompt - 系统提示词快照
 * @property {ColorKey} colorKey - 颜色键
 */

/**
 * @typedef {Object} TokenUsage
 * @property {number} inputTokens - 输入 Token 数
 * @property {number} outputTokens - 输出 Token 数
 * @property {number} cacheReadTokens - 缓存读取 Token 数
 * @property {number} cacheWriteTokens - 缓存写入 Token 数
 */

/**
 * @typedef {Object} TokenCost
 * @property {number} input - 输入成本 (USD)
 * @property {number} output - 输出成本 (USD)
 * @property {number} cacheRead - 缓存读取成本 (USD)
 * @property {number} cacheWrite - 缓存写入成本 (USD)
 * @property {number} total - 总成本 (USD)
 */

/**
 * @typedef {'purple'|'teal'|'coral'|'blue'|'amber'|'green'} ColorKey
 * @typedef {'idle'|'running'|'done'|'error'} AgentStatus
 * @typedef {'anthropic'|'openai'} ProviderKey
 */

/**
 * @typedef {Object} APICallResult
 * @property {string} text - 响应文本
 * @property {TokenUsage} usage - Token 使用量
 * @property {number} duration - 耗时 (ms)
 * @property {number} tokenRate - Token 速率 (tok/s)
 */

/**
 * @typedef {Object} PipelineStats
 * @property {Object.<string, AgentTokenData>} agents - 各 Agent 数据
 * @property {PipelineSummary} summary - 汇总数据
 * @property {string} task - 任务描述
 * @property {number} ts - 开始时间戳
 */

/**
 * @typedef {Object} AgentTokenData
 * @property {string} name - Agent 名称
 * @property {number} inputTokens - 输入 Token
 * @property {number} outputTokens - 输出 Token
 * @property {number} cacheReadTokens - 缓存读 Token
 * @property {number} cacheWriteTokens - 缓存写 Token
 * @property {number} totalTokens - 总 Token
 * @property {number} duration - 耗时 (ms)
 * @property {number} tokenRate - 速率 (tok/s)
 * @property {TokenCost|null} cost - 成本
 */

/**
 * @typedef {Object} PipelineSummary
 * @property {number} totalInput - 总输入 Token
 * @property {number} totalOutput - 总输出 Token
 * @property {number} totalCacheRead - 总缓存读 Token
 * @property {number} totalCacheWrite - 总缓存写 Token
 * @property {number} totalTokens - 总 Token
 * @property {number} totalCost - 总成本 (USD)
 * @property {number} totalDuration - 总耗时 (ms)
 * @property {number} agentCount - Agent 数量
 * @property {number} completedCount - 完成数量
 * @property {number} failedCount - 失败数量
 * @property {number} avgTokenRate - 平均速率 (tok/s)
 */
