# Changelog

## [0.3.0] - 2026-03-31

### Added
- 键盘快捷键系统 (Ctrl+Enter 启动, Escape 停止, Ctrl+1-4 切换标签, Ctrl+/ 帮助)
- 暗色/亮色主题切换，自动持久化
- 日志面板虚拟滚动，支持大量日志高性能渲染
- Loading 骨架屏组件
- ConfigPanel 搜索过滤功能
- Agent 悬停显示 Tooltip (系统提示词预览)
- Pipeline 悬停高亮 + 上浮动画
- 集成测试套件 (pipeline 执行流程)

### Changed
- 重构为模块化架构 (src/components, hooks, services, utils, constants)
- API 层抽象支持多提供商 (Anthropic/OpenAI)
- 存储层适配 (window.storage → localStorage 回退)
- React.memo 优化核心组件渲染

### Fixed
- templates.js 拼写错误 (SORAGE_TEMPLATES → STORAGE_TEMPLATES)
- 依赖关系初始化逻辑

---

## [0.2.0] - 2026-03-31

### Added
- DAG 可配置流水线 (可视化依赖配置)
- 并行执行无依赖 Agent
- 任务模板系统 (预设 + 自定义)
- 配置导入/导出 (JSON 格式)
- 执行历史记录 (自动记录 + 搜索)
- API 配置面板 (多模型切换、连接测试)
- 错误处理与重试 (指数退避)
- 真实 SSE 流式输出支持
- 停止运行按钮

### Changed
- 拆分单文件为模块化结构
- 多状态管理提取为自定义 hooks
- 流水线支持 DAG 调度

---

## [0.1.0] - 2026-03-30

### Added
- 初始版本
- 多 Agent 顺序流水线执行
- Git 式版本控制 (Commit/Diff/Revert)
- Agent 身份哈希系统 (SHA-256)
- 流式日志输出
- 本地持久化
- 4 个预设 Agent (规划师/研究员/执行者/审查员)
