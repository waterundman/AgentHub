# AgentHub 插件系统

AgentHub 插件系统允许你扩展 Agent 的能力，添加新的 LLM Provider、工具和存储后端。

## 快速开始

### 1. 创建 Agent 插件

```javascript
import { createAgentPlugin } from './plugins/factory.js';

const myPlugin = createAgentPlugin({
  name: 'my-custom-agent',
  version: '1.0.0',
  
  // Agent 定义
  definition: {
    name: '自定义Agent',
    subtitle: '我的专属Agent',
    icon: 'M',
    colorKey: 'purple',
    capabilities: ['能力1', '能力2'],
    systemPrompt: 'You are a custom agent...',
  },
  
  // 执行函数
  async execute(task, options) {
    // 实现你的 Agent 逻辑
    const result = await doSomething(task);
    return result;
  },
  
  // 可选：注册时回调
  async onRegister({ pluginManager }) {
    console.log('插件已注册');
  },
});
```

### 2. 注册插件

```javascript
import { pluginManager } from './plugins/index.js';

// 注册插件
await pluginManager.register(myPlugin);

// 激活插件
await pluginManager.activate('my-custom-agent');
```

### 3. 执行 Agent 任务

```javascript
import { pluginManager } from './plugins/index.js';

// 通过插件管理器执行
const result = await pluginManager.executeAgent('自定义Agent', '生成一份报告', {
  maxTokens: 2000,
});

console.log(result);
```

### 4. 使用钩子系统

```javascript
import { globalHooks, HOOK_POINTS } from './plugins/hooks.js';

// 监听 Agent 执行前
globalHooks.on(HOOK_POINTS.AGENT_BEFORE_EXECUTE, async (context) => {
  console.log(`Agent ${context.agentName} 开始执行:`, context.task);
});

// 监听 Agent 执行后
globalHooks.on(HOOK_POINTS.AGENT_AFTER_EXECUTE, async (context) => {
  console.log(`Agent ${context.agentName} 执行完成`);
});
```

## 插件类型

### Agent Plugin
扩展 Agent 类型，添加新的执行能力。

### Provider Plugin
添加新的 LLM Provider（如 OpenAI、Anthropic 等）。

### Tool Plugin
为 Agent 添加工具调用能力。

### Storage Plugin
自定义存储后端（如云存储、数据库等）。

## 钩子点

| 钩子名称 | 说明 | 参数 |
|---------|------|------|
| `PLUGIN_REGISTER` | 插件注册时 | `{ plugin }` |
| `PLUGIN_ACTIVATE` | 插件激活时 | `{ pluginName }` |
| `PLUGIN_DEACTIVATE` | 插件停用时 | `{ pluginName }` |
| `AGENT_BEFORE_EXECUTE` | Agent 执行前 | `{ agentName, task, options, plugin }` |
| `AGENT_AFTER_EXECUTE` | Agent 执行后 | `{ agentName, result, error? }` |
| `PIPELINE_START` | 流水线开始 | `{ agents, task }` |
| `PIPELINE_END` | 流水线结束 | `{ results, stats }` |

## 完整示例

查看 `src/plugins/builtin.js` 了解如何将现有 Agent 转换为插件格式。

## 最佳实践

1. **版本管理**: 使用语义化版本号 (semver)
2. **能力声明**: 准确描述插件的能力列表
3. **错误处理**: 在 execute 函数中正确处理错误
4. **资源清理**: 在 onDeactivate 中释放资源
5. **异步加载**: 使用动态 import 按需加载插件代码

## API 参考

### PluginManager

#### `register(plugin): Promise<boolean>`
注册新插件

#### `activate(pluginName): Promise<boolean>`
激活插件

#### `deactivate(pluginName): Promise<boolean>`
停用插件

#### `get(pluginName): AgentPlugin`
获取插件实例

#### `executeAgent(agentName, task, options): Promise<any>`
执行 Agent 插件

#### `getAgentsByCapability(capability): AgentPlugin[]`
根据能力查找 Agent

### PluginHooks

#### `on(hookName, callback, priority): Function`
注册钩子监听器

#### `off(hookName, callback): void`
移除钩子监听器

#### `emit(hookName, context): Promise<void>`
触发钩子

## 迁移指南

如果你有现有的 Agent 实现，可以轻松迁移到插件系统：

```javascript
// 旧方式：硬编码在 agentRunner.js
case "PPT 大师": {
  const { generatePPT } = await import("../../projects/ppt-master/src/index.js");
  return generatePPT(task, options);
}

// 新方式：插件化
const myPlugin = createAgentPlugin({
  name: 'ppt-master',
  execute: async (task, options) => {
    const { generatePPT } = await import("../../projects/ppt-master/src/index.js");
    return generatePPT(task, options);
  },
});
```

插件系统提供了更好的可维护性和扩展性。