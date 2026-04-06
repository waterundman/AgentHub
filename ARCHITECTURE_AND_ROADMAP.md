# AgentHub 架构分析与迭代规划文档

## 一、项目概述

AgentHub 是一个轻量级多 Agent 协作平台，基于 React 构建，提供类似 Git 的版本控制系统来管理 AI Agent 的配置与演化。

### 核心定位
- **多 Agent 流水线协作**：支持多个 Agent 按顺序执行任务，每个 Agent 可参考前序工作成果
- **Git 式版本管理**：每个 Agent 持有唯一 SHA-256 身份哈希，支持提交、回滚、差异对比
- **开箱即用的预设角色**：规划师 → 研究员 → 执行者 → 审查员 四阶段工作流

---

## 二、当前架构分析

### 2.1 技术栈
| 层级 | 技术 | 说明 |
|------|------|------|
| 框架 | React (JSX) | 使用 hooks (useState, useRef, useEffect, useCallback) |
| API | Anthropic Claude API | 当前硬编码 `claude-sonnet-4-20250514` |
| 存储 | `window.storage` | 自定义存储接口，非标准 Web API |
| 加密 | Web Crypto API | SHA-256 哈希生成 |
| 样式 | Inline CSS + CSS Variables | 依赖 `var(--color-*)` 等 CSS 变量 |

### 2.2 核心模块

```
agent_hub.jsx (510 行)
├── 工具函数 (L4-11)
│   ├── sha256()           - SHA-256 哈希计算
│   ├── shortHash()        - 截取 7 位短哈希
│   └── agentHash()        - Agent 唯一 ID 生成
├── 常量定义 (L14-37)
│   ├── COLORS             - 6 套配色方案
│   ├── STATUS_MAP         - 4 种状态映射
│   └── PRESET_DEFS        - 4 个预设 Agent 定义
├── 版本控制 (L40-51)
│   └── computeDiff()      - 行级差异对比算法
├── 存储层 (L54-63)
│   ├── load/save          - 异步读写封装
│   └── fmtTs              - 时间戳格式化
├── 子组件 (L66-91)
│   ├── HashBadge          - 哈希徽章展示
│   └── DiffView           - 差异视图渲染
└── 主组件 AgentHub (L94-510)
    ├── 状态管理 (14 个 state)
    ├── 版本操作 (commitVer, revertTo, deleteVer)
    ├── 运行控制 (run, callAgent, streamLog)
    ├── Run Tab UI
    └── Config Tab UI
```

### 2.3 数据流

```
用户输入任务 → 启动流水线 → 顺序调用 Agent
  ↓
每个 Agent 接收: 任务 + 前序所有 Agent 输出
  ↓
流式日志更新 → 最终输出展示
  ↓
配置变更 → 检测 dirty → 提交版本 → 生成内容哈希 → 持久化
```

---

## 三、功能特性清单

### ✅ 已实现
| 功能 | 状态 | 说明 |
|------|------|------|
| 多 Agent 流水线执行 | ✅ | 顺序调用 + DAG 并行，上下文传递 |
| Agent 身份哈希系统 | ✅ | SHA-256，修改内容不改变 ID |
| Git 式版本控制 | ✅ | Commit/Diff/Revert/Delete |
| 工作区 vs HEAD 对比 | ✅ | 未提交变更实时 diff |
| 流式日志输出 | ✅ | 逐字显示动画效果 |
| 本地持久化 | ✅ | localStorage 适配层 |
| Agent 增删改 | ✅ | 配置面板完整 CRUD |
| 状态可视化 | ✅ | 待机/工作中/完成/出错 |
| 进度条 | ✅ | 流水线执行进度 |
| 哈希复制 | ✅ | 点击复制完整哈希 |
| 多模型支持 | ✅ | Anthropic / OpenAI 可配置 |
| API Key 管理 | ✅ | 独立 API 配置面板 |
| 错误处理与重试 | ✅ | 指数退避重试机制 |
| 并行执行模式 | ✅ | DAG 依赖图调度 |
| 导出/导入配置 | ✅ | JSON 格式备份恢复 |
| 测试覆盖 | ✅ | 单元测试 + 集成测试 |
| 流式 SSE 支持 | ✅ | streamCallAgent 实现 |
| Agent 间依赖图 | ✅ | 可视化依赖配置 |
| 任务模板系统 | ✅ | 预设 + 自定义模板 |
| 执行历史记录 | ✅ | 自动记录 + 搜索过滤 |
| 悬停显示 Agent 功能 | ✅ | Tooltip 组件 |
| 键盘快捷键系统 | ✅ | 全局快捷键 + 帮助弹窗 |
| 暗色/亮色主题切换 | ✅ | 持久化主题配置 |

### ⚠️ 待完善
| 功能 | 优先级 | 说明 |
|------|--------|------|
| 错误处理与重试 | 🔴 P0 | API 失败无重试机制 |
| 多模型支持 | 🔴 P0 | 硬编码 Claude，无法切换 |
| API Key 管理 | 🔴 P0 | 无密钥配置界面 |
| 并行执行模式 | 🟡 P1 | 当前仅支持顺序执行 |
| 导出/导入配置 | 🟡 P1 | 无法备份 Agent 配置 |
| 测试覆盖 | 🟡 P1 | 无任何测试 |
| 流式 SSE 支持 | 🟡 P1 | 当前为模拟流式，非真实 SSE |

### ❌ 缺失功能
| 功能 | 优先级 | 说明 |
|------|--------|------|
| Agent 间依赖图 | 🔴 P0 | 当前为固定线性流水线 |
| 任务模板系统 | 🟡 P1 | 无法保存常用任务 |
| 执行历史记录 | 🟡 P1 | 无历史任务查询 |
| 权限与分享 | 🟢 P2 | 多用户场景 |
| 插件系统 | 🟢 P2 | 扩展 Agent 能力 |

---

## 四、技术债务与问题

### 4.1 架构问题

| 问题 | 位置 | 影响 | 建议 |
|------|------|------|------|
| 单文件 510 行 | 全局 | 可维护性差 | 拆分为独立模块 |
| 状态管理分散 | L95-108 | 14 个 state 难以追踪 | 引入 useReducer 或 Zustand |
| 硬编码 API | L182-184 | 无法切换模型/提供商 | 抽象 API 层 |
| 非标准存储 API | L56-57 | `window.storage` 非 Web 标准 | 适配 localStorage/IndexedDB |
| 无类型系统 | 全局 | 易出错 | 迁移至 TypeScript |

### 4.2 代码质量问题

| 问题 | 位置 | 建议 |
|------|------|------|
| Diff 算法简陋 | L40-51 | 使用 `diff` 库替代行级对比 |
| 流式模拟不真实 | L173-179 | 改为真实 SSE 或流式 API |
| 错误处理薄弱 | L207-214 | 添加重试、降级、用户提示 |
| 无 Loading 骨架屏 | L228 | 初始化仅文字提示 |
| 内联样式泛滥 | 全局 | 提取为 CSS 模块或 Tailwind |

### 4.3 安全问题

| 问题 | 风险 | 建议 |
|------|------|------|
| API Key 无管理 | 高 | 添加密钥配置与加密存储 |
| 无请求限流 | 中 | 防止意外高额费用 |
| 无输入校验 | 低 | 任务长度、特殊字符处理 |

---

## 五、迭代路线图

### Phase 1: 稳定性与基础增强 (1-2 周)

#### 1.1 代码重构
- [ ] 拆分文件结构
  ```
  src/
  ├── components/
  │   ├── AgentHub.jsx          # 主容器
  │   ├── Pipeline/             # 流水线展示
  │   ├── LogPanel/             # 日志面板
  │   ├── ConfigPanel/          # 配置面板
  │   └── VersionHistory/       # 版本历史
  ├── hooks/
  │   ├── useAgents.js          # Agent 状态管理
  │   ├── useVersions.js        # 版本控制逻辑
  │   └── usePipeline.js        # 流水线执行
  ├── services/
  │   ├── api.js                # LLM API 抽象
  │   └── storage.js            # 存储适配层
  ├── utils/
  │   ├── hash.js
  │   └── diff.js
  └── constants/
      └── colors.js
  ```

- [ ] 状态管理升级
  ```javascript
  // 使用 useReducer 替代多个 useState
  const [state, dispatch] = useReducer(agentHubReducer, initialState);
  // 或引入 Zustand
  const useStore = create((set) => ({ agents: [], versions: {}, ... }));
  ```

#### 1.2 API 层抽象
```javascript
// services/api.js
export class LLMProvider {
  constructor(config) { /* model, apiKey, baseUrl */ }
  async chat(messages, options) { /* 统一接口 */ }
  async streamChat(messages, onChunk) { /* 真实流式 */ }
}

// 支持多提供商
const providers = {
  anthropic: AnthropicProvider,
  openai: OpenAIProvider,
  local: OllamaProvider,
};
```

#### 1.3 存储层适配
```javascript
// services/storage.js
export const storage = {
  async get(key) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  },
  async set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};
```

#### 1.4 错误处理增强
```javascript
// 添加重试机制
async function callWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === maxRetries - 1) throw err;
      await delay(1000 * (i + 1)); // 指数退避
    }
  }
}
```

---

### Phase 2: 功能扩展 (2-3 周)

#### 2.1 可配置流水线
```javascript
// 支持 DAG 依赖图而非固定线性
const pipeline = {
  nodes: [
    { id: 'planner', agent: '规划师' },
    { id: 'research', agent: '研究员', depends: ['planner'] },
    { id: 'execute', agent: '执行者', depends: ['planner', 'research'] },
    { id: 'review', agent: '审查员', depends: ['execute'] },
  ]
};
```

#### 2.2 真实流式输出
```javascript
// 使用 Anthropic 的 message_streaming
const response = await fetch(url, {
  headers: { 'anthropic-beta': 'message-streaming-2023-10-16' },
  body: JSON.stringify({ stream: true, ... })
});
const reader = response.body.getReader();
// 逐 chunk 处理
```

#### 2.3 配置导入/导出
```javascript
// 导出为 JSON
function exportConfig(agents, versions) {
  const blob = new Blob([JSON.stringify({ agents, versions }, null, 2)], { type: 'application/json' });
  // 触发下载
}

// 导入并冲突处理
function importConfig(data, mode = 'merge' | 'overwrite') { ... }
```

#### 2.4 任务模板
```javascript
const templates = [
  {
    name: "代码审查",
    task: "审查以下代码的质量、安全性和性能：\n\n{{code}}",
    agents: ['研究员', '审查员'],
  }
];
```

---

### Phase 3: 高级特性 (3-4 周)

#### 3.1 TypeScript 迁移
```typescript
interface Agent {
  hash: string;
  name: string;
  subtitle: string;
  icon: string;
  colorKey: ColorKey;
  systemPrompt: string;
}

interface Version {
  sha: string;
  fullSha: string;
  message: string;
  ts: number;
  agent: Agent;
}

type AgentStatus = 'idle' | 'running' | 'done' | 'error';
```

#### 3.2 测试体系
```
tests/
├── unit/
│   ├── hash.test.js
│   ├── diff.test.js
│   └── storage.test.js
├── integration/
│   └── pipeline.test.js
└── e2e/
    └── run.test.js
```

#### 3.3 性能优化
- 虚拟滚动长日志列表
- React.memo 优化子组件渲染
- 防抖/节流频繁更新的状态

#### 3.4 用户体验
- 键盘快捷键系统
- 暗色/亮色主题切换
- 国际化 (i18n) 支持
- 执行历史时间线

---

## 六、关键技术决策建议

### 6.1 状态管理方案对比

| 方案 | 复杂度 | 学习曲线 | 适用场景 |
|------|--------|----------|----------|
| 保持 useState | 低 | 无 | 小型项目 |
| useReducer | 中 | 低 | 中等复杂状态 |
| Zustand | 中 | 低 | 推荐：轻量且强大 |
| Redux Toolkit | 高 | 中 | 大型团队项目 |

**建议**：迁移至 Zustand，保持轻量同时获得更好的状态组织。

### 6.2 样式方案对比

| 方案 | 维护性 | 性能 | 迁移成本 |
|------|--------|------|----------|
| 保持内联 | 差 | 中 | 无 |
| CSS Modules | 好 | 高 | 中 |
| Tailwind CSS | 好 | 高 | 高 |
| Styled Components | 中 | 中 | 中 |

**建议**：迁移至 CSS Modules，平衡维护性与迁移成本。

### 6.3 Diff 算法

当前实现为简单行级对比，建议：
- 短期：使用 `diff` npm 包
- 长期：集成 `monaco-editor` 的 diff 视图

```javascript
import { diffLines } from 'diff';
const changes = diffLines(oldPrompt, newPrompt);
```

---

## 七、迭代状态更新 (2026-04-01)

### ✅ Phase 1-3 全部完成 + Phase 4 部分完成

| 类别 | 状态 | 说明 |
|------|------|------|
| 代码重构 | ✅ | 120 文件，模块化架构 |
| API 层抽象 | ✅ | Anthropic + OpenAI |
| 存储适配 | ✅ | localStorage 回退 |
| 错误处理 | ✅ | 指数退避重试 |
| 测试覆盖 | ✅ | 4 个测试文件 (unit + e2e) |
| DAG 流水线 | ✅ | 可视化依赖配置 |
| 真实 SSE | ✅ | streamCallAgent |
| 导入/导出 | ✅ | JSON 格式 |
| 任务模板 | ✅ | 预设 + 自定义 |
| 执行历史 | ✅ | 自动记录 + 搜索 |
| Token 统计 | ✅ | 成本计算 + 速率 |
| 键盘快捷键 | ✅ | 全局 + 帮助弹窗 |
| 暗色/亮色 | ✅ | 持久化主题 |
| 悬停 Tooltip | ✅ | 系统提示词预览 |
| 虚拟滚动 | ✅ | 日志面板 |
| 骨架屏 | ✅ | Loading 状态 |
| 搜索过滤 | ✅ | ConfigPanel + ProjectManager |
| 项目集成 | ✅ | 3 个 Agent 完整迁移 |
| JSDoc 类型 | ✅ | types.js |
| Zustand 状态 | ✅ | useStore.js |
| i18n | ✅ | zh-CN + en-US |
| CSS Modules | ✅ | AgentHub.module.css |
| **Monaco Diff 视图** | ✅ | **ConfigPanel + OutputPreview** |

### 🔄 Phase 4 剩余任务

1. ~~**Monaco Editor Diff 视图**~~ - ✅ 已完成 (2026-04-07)
2. **云端同步** - 团队共享配置
3. **插件系统** - 扩展 Agent 能力
4. **TypeScript 完全迁移** - 替代 JSDoc

---

## 八、长期愿景

### 8.1 产品定位演进
```
当前: 单用户本地工具
  ↓
短期: 团队共享配置 + 云端同步
  ↓
中期: Agent 市场 + 模板共享
  ↓
长期: 企业级多 Agent 编排平台
```

### 8.2 技术架构演进
```
当前: 单文件 React 组件
  ↓
短期: 模块化 + TypeScript + 测试
  ↓
中期: 微前端 + 插件系统
  ↓
长期: 分布式 Agent 执行引擎
```

---

## 九、风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| API 费用失控 | 中 | 高 | 添加配额限制与提醒 |
| 数据丢失 | 低 | 高 | 自动备份 + 导出功能 |
| 性能瓶颈 | 中 | 中 | 虚拟滚动 + 懒加载 |
| 安全漏洞 | 低 | 高 | API Key 加密存储 |

---

## 十、总结

AgentHub 是一个概念验证良好的轻量多 Agent 协作平台，核心价值在于：
1. **Git 式版本管理** 创新性地应用于 Agent 配置
2. **流水线可视化** 直观展示多 Agent 协作
3. **开箱即用** 预设角色降低使用门槛

**下一步行动**：优先完成 Phase 1 的代码重构与 API 层抽象，为后续功能扩展打下坚实基础。建议按照 Week 1 冲刺清单逐步推进，每完成一个功能即进行测试验证。
