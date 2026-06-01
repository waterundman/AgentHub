# AgentHub 更新日志

## v1.4.0 (2026-05-31)

### Bug修复

#### 模块导入修复
- 修复AgentHub.jsx循环依赖问题
- 修复index.html缺失问题
- 修复Icon组件导入路径
- 修复Tab组件（RunTab、ConfigTab、ProjectsTab、ApiTab、ToolsTab）导入路径
- 修复lucide-react缺少Stop图标问题

#### 验证结果
- 单元测试: 211/211 通过
- UI验证: 6/6 通过
- 构建验证: 通过

---

## v1.3.0 (2026-05-30)

### 新增功能

#### Agent多维评述系统
- 实现五层评述框架（Tool→Skill→Behavior→Capability→Specialization）
- 支持Agent专业化指数计算
- 支持Agent画像可视化
- 支持Agent对比分析

#### Tool层采集
- 扫描Agent配置中的工具引用
- 查询toolRegistry获取工具详情
- 统计工具分类和来源

#### Skill层采集
- 解析Agent的Skill配置
- 分析系统提示词中的领域知识
- 识别工作流模式
- 评估Skill深度

#### Behavior层分析
- 统计工具调用频率
- 识别调用顺序模式
- 发现工具组合模式
- 生成行为指纹

#### Capability层推断
- 基于Tool+Skill+Behavior推断能力边界
- 识别能力覆盖和深度
- 识别能力缺口

#### Specialization层评估
- 计算专业化指数（赫芬达尔指数）
- 识别TOP 3擅长领域
- 发现独特能力

#### 流式输出优化
- 实现SSE解析器
- 支持增量Markdown渲染
- 自动滚动控制

#### Tracing系统
- 实现结构化追踪
- 支持Span嵌套
- 可视化调用链路

### 创建的文件

```
src/services/profiler/
├── types.js
├── AgentProfiler.js
└── layers/
    ├── ToolLayerCollector.js
    ├── SkillLayerCollector.js
    ├── BehaviorAnalyzer.js
    ├── CapabilityInferrer.js
    └── SpecializationScorer.js

src/services/profiler/fingerprint/
└── BehaviorFingerprint.js

src/services/tracing/
└── TracingService.js

src/components/AgentProfile/
├── AgentProfilePanel.jsx
├── BehaviorView.jsx
├── CapabilityMap.jsx
└── SpecializationView.jsx

src/components/TracingPanel/
└── TracingPanel.jsx

src/components/OutputPreview/
└── StreamOutput.jsx

src/hooks/
├── useToolLayer.js
├── useSkillLayer.js
├── useStreamRender.js
└── useTracing.js

src/utils/
└── sseParser.js
```

---

## v1.2.0 (2026-05-30)

### 新增功能

#### Webhook消息发送
- 支持飞书、钉钉、企业微信三个平台
- 消息中包含项目名称标识
- 支持签名验证（飞书、钉钉）
- 支持测试连接功能

#### .agent压缩格式
- 支持打包agent项目为.agent文件
- 支持解压.agent文件并加载
- 支持基本的完整性验证
- 支持拖拽导入和导出

### 创建的文件

```
src/services/webhook/
├── WebhookService.js
├── platforms/
│   ├── feishu.js
│   ├── dingtalk.js
│   ├── wecom.js
│   └── index.js
└── index.js

src/services/agentFormat/
├── manifest.js
├── packer.js
├── unpacker.js
├── verifier.js
└── index.js

src/components/
├── WebhookConfig.jsx
├── AgentImport.jsx
├── AgentExport.jsx
└── AgentFormatUI.jsx

src/store/
└── useWebhookStore.js
```

---

## v1.1.0 (2026-05-30)

### 代码质量提升

#### AgentHub组件拆分
- 将450行的主组件拆分为8个职责单一的子组件
- AgentHubHeader - 头部导航
- AgentHubModals - 模态框管理
- RunTab/ConfigTab/ProjectsTab/ApiTab/ToolsTab - 各标签页

#### 状态管理统一
- 消除useStore.js和hooks/index.js的重复逻辑
- 创建useAgentStore.js和usePipelineStore.js
- 使用zustand persist中间件

#### Provider适配器抽象
- 消除api.js中的switch-case重复
- 创建ProviderAdapter基类
- 实现AnthropicAdapter、OpenAIAdapter、DeepSeekAdapter

#### 测试覆盖提升
- 核心业务逻辑测试覆盖率从20%提升到60%+
- 添加store、providers、toolRegistry等测试

### 创建的文件

```
src/components/AgentHub/
├── index.jsx
├── AgentHubHeader.jsx
├── AgentHubModals.jsx
└── tabs/
    ├── RunTab.jsx
    ├── ConfigTab.jsx
    ├── ProjectsTab.jsx
    ├── ApiTab.jsx
    └── ToolsTab.jsx

src/store/
├── useAgentStore.js
├── usePipelineStore.js
└── index.js

src/services/providers/
├── ProviderAdapter.js
├── AnthropicAdapter.js
├── OpenAIAdapter.js
├── DeepSeekAdapter.js
└── index.js
```

---

## v1.0.0 (2026-05-29)

### 核心功能

#### LLM Router
- 支持13个Provider配置
- 支持4种路由策略（成本优先、延迟优先、故障转移、手动选择）
- 支持断路器机制
- 支持Agent级LLM配置覆盖

#### 前端图标系统
- 集成Lucide React图标库
- 为关键组件添加图标
- 统一的Icon组件

#### ToolUse Tag和沙箱
- 工具注册表服务
- 工具使用标签显示
- 工具权限沙箱限制
- 工具调用拦截器

#### 外部项目转写
- 支持10种外部格式
- 转写规则引擎
- 导入向导组件

### 创建的文件

```
src/constants/providers.js
src/services/circuitBreaker.js
src/services/routingStrategy.js
src/services/llmRouter.js
src/components/Icon.jsx
src/components/AgentLLMConfig.jsx
src/services/toolRegistry.js
src/services/toolCallInterceptor.js
src/components/ToolUseTag.jsx
src/components/AgentToolSandbox.jsx
src/services/transcriptionRules.js
src/services/transcriptionEngine.js
src/components/ImportWizard.jsx
src/components/TranscriptionPreview.jsx
```

---

## 版本说明

- **Major版本** (x.0.0): 重大功能更新
- **Minor版本** (x.y.0): 新功能添加
- **Patch版本** (x.y.z): Bug修复和小改进
