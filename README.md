# AgentHub

轻量多 Agent 协作平台，采用 Git 式版本管理 AI Agent 配置。

## 特性

- **多 Agent 流水线协作**：支持多个 Agent 按顺序或 DAG 依赖图执行任务
- **Git 式版本控制**：每个 Agent 持有唯一 SHA-256 身份哈希，支持提交、回滚、差异对比
- **多模型支持**：Anthropic Claude / OpenAI GPT 可配置切换
- **任务模板**：预设常用工作流模板，一键启动
- **导入/导出**：JSON 格式备份与恢复配置
- **执行历史**：自动记录每次任务执行结果

## 项目结构

```
src/
├── components/
│   ├── AgentHub.jsx            # 主容器
│   ├── HashBadge.jsx           # 哈希徽章
│   ├── DiffView.jsx            # 差异视图
│   ├── Pipeline/               # 流水线可视化
│   ├── LogPanel/               # 日志面板
│   ├── ConfigPanel/            # Agent 配置面板
│   ├── ApiConfig/              # API 配置
│   ├── TemplatesPanel/         # 任务模板
│   ├── ImportExport/           # 导入导出
│   └── ExecutionHistory/       # 执行历史
├── hooks/
│   └── index.js                # useAgents, useVersions, usePipeline (delegates to store)
├── store/
│   ├── index.js                # useAgentStore, usePipelineStore
│   ├── useAgentStore.js        # Agent状态管理
│   └── usePipelineStore.js     # 流水线状态管理
├── services/
│   ├── api.js                  # 多提供商 LLM API 抽象
│   ├── storage.js              # 存储适配层
│   └── templates.js            # 模板管理
├── utils/
│   ├── hash.js                 # SHA-256 哈希工具
│   └── diff.js                 # 差异对比工具
└── constants/
    ├── colors.js               # 颜色与状态常量
    └── presets.js              # 预设 Agent 定义
tests/
└── unit/
    ├── hash.test.js
    ├── diff.test.js
    └── storage.test.js
```

## 快速开始

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 运行测试（单次）
npm run test:run
```

## 使用指南

### 1. 配置 API

在 "API" 标签页中：
- 选择提供商（Anthropic / OpenAI）
- 选择模型
- 输入 API Key
- 点击 "测试连接" 验证

### 2. 运行任务

在 "运行" 标签页中：
- 输入任务描述
- 点击 "▶ 启动" 或使用 `Ctrl+Enter`
- 查看流水线状态和实时日志

### 3. 管理 Agent

在 "配置" 标签页中：
- 编辑 Agent 名称、颜色、系统提示词
- 配置依赖关系（DAG 模式）
- 提交版本、查看差异、回滚历史

### 4. 使用模板

在 "工具" 标签页中：
- 选择预设模板快速开始
- 创建自定义模板
- 查看执行历史
- 导入/导出配置

## 架构设计

### 数据流

```
用户输入任务 → 启动流水线 → DAG 调度执行
  ↓
每个 Agent 接收: 任务 + 依赖 Agent 输出
  ↓
流式日志更新 → 最终输出展示
  ↓
执行记录自动保存至历史
```

### 版本控制

- **Agent ID**：创建时生成唯一 SHA-256 哈希，修改内容不改变 ID
- **Commit**：提交时生成内容哈希，记录变更差异
- **Revert**：回滚至任意历史版本
- **Diff**：行级差异对比，支持工作区 vs HEAD

## 技术栈

- React (Hooks)
- Web Crypto API (SHA-256)
- localStorage / window.storage 适配
- Anthropic Claude / OpenAI GPT API
- Vitest (测试)

## 开发

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 查看测试覆盖率
npm run test:coverage
```

## License

MIT
