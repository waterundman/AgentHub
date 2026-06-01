# Provider适配器使用说明

## 重构完成

API层已重构为使用Provider适配器模式，消除了switch-case重复代码。

## 文件结构

```
src/services/providers/
├── ProviderAdapter.js    # 基类
├── AnthropicAdapter.js   # Anthropic适配器
├── OpenAIAdapter.js      # OpenAI适配器
├── DeepSeekAdapter.js    # DeepSeek适配器（继承OpenAI）
└── index.js              # 工厂和注册
```

## 添加新Provider

### 方式1：兼容OpenAI的Provider

如果新Provider兼容OpenAI API格式，只需在`index.js`中添加映射：

```javascript
const PROVIDER_MAP = {
  // ... 现有映射
  newProvider: OpenAIAdapter,  // 添加这一行
};
```

### 方式2：自定义Provider

如果新Provider有独特的API格式：

1. 创建新的适配器文件，例如`NewProviderAdapter.js`：

```javascript
import { ProviderAdapter } from './ProviderAdapter.js';

export class NewProviderAdapter extends ProviderAdapter {
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`
    };
  }

  buildBody(systemPrompt, messages, options = {}) {
    // 实现独特的请求体格式
    return {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    };
  }

  extractText(data) {
    // 实现独特的响应解析
    return data.result?.text || '(无输出)';
  }

  extractUsage(data) {
    // 实现独特的用量提取
    const usage = data.usage || {};
    return {
      inputTokens: usage.input_tokens || 0,
      outputTokens: usage.output_tokens || 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    };
  }

  parseStreamChunk(json) {
    // 实现独特的流式解析
    return json.delta?.text || '';
  }
}
```

2. 在`index.js`中注册：

```javascript
import { NewProviderAdapter } from './NewProviderAdapter.js';

const PROVIDER_MAP = {
  // ... 现有映射
  newProvider: NewProviderAdapter,
};
```

## 配置格式

配置格式保持不变：

```javascript
const config = {
  provider: 'newProvider',  // Provider名称
  model: 'model-name',      // 模型名称
  apiKey: 'your-api-key',   // API密钥
  baseUrl: 'https://api.example.com/v1',  // API端点
  maxTokens: 1000,          // 最大token数
  maxRetries: 3,            // 最大重试次数
  retryDelay: 1000,         // 重试延迟（毫秒）
};
```

## 测试

运行测试验证重构：

```bash
npm run test:run
```

所有现有测试应通过（除了预先存在的失败测试）。
